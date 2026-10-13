import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/scripts/seed';
import { UserModel } from '../src/models/User.model';
import { AccountModel } from '../src/models/Account.model';
import { AuthService } from '../src/services/auth.service';

describe('Bank Accounts & Ledger Balance Integration Tests', () => {
  let aliceToken = '';
  let aliceUsdAccountId = '';

  beforeAll(async () => {
    await connectDB();
    await seedDatabase();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@bankofmaldives.com.mv', password: 'Password123!' });
    aliceToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('GET /api/v1/accounts returns active accounts and calculated net worth', async () => {
    const res = await request(app)
      .get('/api/v1/accounts')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accounts.length).toBeGreaterThanOrEqual(2);

    const usdAcc = res.body.data.accounts.find((a: any) => a.currency === 'USD');
    expect(usdAcc).toBeDefined();
    expect(usdAcc.accountNumber).toMatch(/^77\d{8}$/);
    expect(usdAcc.routingNumber).toBe('026014887');
    expect(usdAcc.balanceMinorUnits).toBeGreaterThan(0);
    expect(usdAcc.balanceFormatted).toBe('$1,000.00');

    aliceUsdAccountId = usdAcc.id;

    expect(res.body.data.totalNetWorthUSDMinorUnits).toBeGreaterThan(0);
    expect(res.body.data.totalNetWorthUSDFormatted).toContain('$');
  });

  it('GET /api/v1/accounts auto-provisions default accounts if user has 0 accounts', async () => {
    // Create a new user without accounts
    const testUser = await UserModel.create({
      fullName: 'Zero Account User',
      email: 'zero.accounts@bankofmaldives.com.mv',
      passwordHash: await AuthService.hashPassword('Password123!'),
      role: 'USER',
      kycTier: 'TIER_1_SIMULATED'
    });

    const testToken = AuthService.generateAccessToken(testUser);

    // Call GET /api/v1/accounts
    const res = await request(app)
      .get('/api/v1/accounts')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accounts.length).toBeGreaterThanOrEqual(2);

    const autoUsd = res.body.data.accounts.find((a: any) => a.currency === 'USD');
    expect(autoUsd).toBeDefined();
    expect(autoUsd.balanceMinorUnits).toBe(100000); // $1,000.00 welcome bonus

    const autoEur = res.body.data.accounts.find((a: any) => a.currency === 'EUR');
    expect(autoEur).toBeDefined();
  });

  it('POST /api/v1/accounts provisions a new currency account (GBP Checking)', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        currency: 'GBP',
        accountType: 'CHECKING',
        nickname: 'British Pound Checking'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.account.currency).toBe('GBP');
    expect(res.body.data.account.accountType).toBe('CHECKING');
    expect(res.body.data.account.balanceMinorUnits).toBe(0);
    expect(res.body.data.account.balanceFormatted).toBe('£0.00');
    expect(res.body.data.account.accountNumber).toMatch(/^77\d{8}$/);
  });

  it('POST /api/v1/accounts rejects duplicate active currency account', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        currency: 'GBP',
        accountType: 'CHECKING'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ACCOUNT_EXISTS');
  });

  it('GET /api/v1/accounts/:id returns single account details', async () => {
    const res = await request(app)
      .get(`/api/v1/accounts/${aliceUsdAccountId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.account.id).toBe(aliceUsdAccountId);
    expect(res.body.data.account.currency).toBe('USD');
  });

  it('GET /api/v1/accounts/:id rejects non-existent or invalid account ID with 404', async () => {
    const res = await request(app)
      .get('/api/v1/accounts/600000000000000000000000')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');

    const invalidIdRes = await request(app)
      .get('/api/v1/accounts/invalid-not-an-objectid')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(invalidIdRes.status).toBe(404);
    expect(invalidIdRes.body.error.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('GET /api/v1/accounts/:id/entries returns paginated transaction history', async () => {
    const res = await request(app)
      .get(`/api/v1/accounts/${aliceUsdAccountId}/entries?page=1&limit=10`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(10);
  });
});
