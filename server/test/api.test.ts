import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/scripts/seed';

describe('Bank of Maldives REST API Integration Tests', () => {
  let authToken = '';
  let aliceUsdAccountId = '';

  beforeAll(async () => {
    await connectDB();
    await seedDatabase();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('GET /api/health returns simulation status and warning disclaimer', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.simulator).toBe(true);
    expect(res.header['x-simulation-warning']).toBeDefined();
  });

  it('POST /api/v1/auth/login logs in Alice and returns access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@bankofmaldives.com.mv', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.meta.simulated).toBe(true);

    authToken = res.body.data.accessToken;
  });

  it('POST /api/v1/auth/login logs in Darren Trader with forextradingplatformfxe@gmail.com and password Darren Trader', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'forextradingplatformfxe@gmail.com', password: 'Darren Trader' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.fullName).toBe('Darren Trader');
    expect(res.body.data.user.email).toBe('forextradingplatformfxe@gmail.com');
  });

  it('GET /api/v1/accounts returns Alice multi-currency accounts and net worth', async () => {
    const res = await request(app)
      .get('/api/v1/accounts')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.accounts)).toBe(true);
    expect(res.body.data.accounts.length).toBeGreaterThanOrEqual(2);

    const usdAcc = res.body.data.accounts.find((a: any) => a.currency === 'USD');
    expect(usdAcc).toBeDefined();
    expect(usdAcc.balanceMinorUnits).toBeGreaterThan(0);
    aliceUsdAccountId = usdAcc.id;
  });

  it('POST /api/v1/transfers/internal executes instant P2P transfer to Bob', async () => {
    const res = await request(app)
      .post('/api/v1/transfers/internal')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'test-p2p-key-101')
      .send({
        sourceAccountId: aliceUsdAccountId,
        recipientIdentifier: 'bob@bankofmaldives.com.mv',
        amountMinorUnits: 2500, // $25.00
        description: 'Test P2P Payment'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('POSTED');
    expect(res.body.data.amountMinorUnits).toBe(2500);
    expect(res.body.data.receiptHash).toBeDefined();
  });

  it('GET /api/v1/directory/institutions returns real global institutions', async () => {
    const res = await request(app).get('/api/v1/directory/institutions');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.institutions.length).toBeGreaterThan(0);
    expect(res.body.data.institutions[0].isFictionalDisclaimer).toBe(false);
  });

  it('POST /api/v1/faucet/inject injects demo funds into Alice account', async () => {
    const res = await request(app)
      .post('/api/v1/faucet/inject')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'faucet-test-key-555')
      .send({
        accountId: aliceUsdAccountId,
        amountMinorUnits: 500000 // $5,000.00
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amountMinorUnits).toBe(500000);
  });

  it('POST /api/v1/transfers/multi-currency converts USD directly to INR (Indian Rupee) at live rate', async () => {
    const res = await request(app)
      .post('/api/v1/transfers/multi-currency')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'multi-currency-inr-01')
      .send({
        sourceAccountId: aliceUsdAccountId,
        targetCurrency: 'INR',
        sourceAmountMinorUnits: 10000, // $100.00 USD
        transferType: 'EXTERNAL_BANK',
        institutionRoutingOrBic: 'SBIN0000691',
        beneficiaryName: 'Rajesh Sharma',
        beneficiaryAccountNumber: '39481029481',
        rail: 'NEFT',
        description: 'Direct USD to INR Remittance'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currency).toBe('USD');
    expect(res.body.data.targetCurrency).toBe('INR');
    expect(res.body.data.amountMinorUnits).toBe(10000);
    expect(res.body.data.creditedMinorUnits).toBeGreaterThan(800000); // 100 USD * ~84.10 * 100 = 841,000 paise
    expect(res.body.data.appliedRate).toBeGreaterThan(80);
    expect(res.body.data.receiptHash).toBeDefined();
  });

  it('POST /api/v1/transfers/multi-currency converts USD directly to PKR (Pakistani Rupee) at live rate', async () => {
    const res = await request(app)
      .post('/api/v1/transfers/multi-currency')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'multi-currency-pkr-01')
      .send({
        sourceAccountId: aliceUsdAccountId,
        targetCurrency: 'PKR',
        sourceAmountMinorUnits: 20000, // $200.00 USD
        transferType: 'EXTERNAL_BANK',
        institutionRoutingOrBic: 'HABBPKKA',
        beneficiaryName: 'Tariq Mahmood',
        beneficiaryAccountNumber: '00427901234503',
        rail: 'RAAST',
        description: 'Direct USD to PKR Remittance'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currency).toBe('USD');
    expect(res.body.data.targetCurrency).toBe('PKR');
    expect(res.body.data.amountMinorUnits).toBe(20000);
    expect(res.body.data.creditedMinorUnits).toBeGreaterThan(5000000); // 200 USD * ~278.50 * 100 = ~5,570,000 paise
    expect(res.body.data.appliedRate).toBeGreaterThan(250);
    expect(res.body.data.receiptHash).toBeDefined();
  });

  it('POST /api/v1/auth/refresh issues a new access token via refresh token cookie', async () => {
    // Perform login to receive refreshToken cookie
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@bankofmaldives.com.mv', password: 'Password123!' });

    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.user.email).toBe('alice@bankofmaldives.com.mv');
  });

  it('POST /api/v1/transfers/internal executes cross-currency P2P using recipient account number', async () => {
    // Find Bob's USD account number
    const bob = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bob@bankofmaldives.com.mv', password: 'Password123!' });
    const bobToken = bob.body.data.accessToken;

    const bobAccountsRes = await request(app)
      .get('/api/v1/accounts')
      .set('Authorization', `Bearer ${bobToken}`);
    const bobUsdAcc = bobAccountsRes.body.data.accounts.find((a: any) => a.currency === 'USD');
    expect(bobUsdAcc).toBeDefined();

    // Alice sends USD converted to INR directly using Bob's USD account number as identifier
    const transferRes = await request(app)
      .post('/api/v1/transfers/internal')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'test-p2p-accnum-cross-01')
      .send({
        sourceAccountId: aliceUsdAccountId,
        recipientIdentifier: bobUsdAcc.accountNumber,
        targetCurrency: 'INR',
        amountMinorUnits: 5000, // $50.00
        description: 'P2P INR transfer using USD account number'
      });

    expect(transferRes.status).toBe(200);
    expect(transferRes.body.success).toBe(true);
    expect(transferRes.body.data.currency).toBe('USD');
    expect(transferRes.body.data.targetCurrency).toBe('INR');
    expect(transferRes.body.data.creditedMinorUnits).toBeGreaterThan(400000);
  });

  it('POST /api/v1/transfers/internal rejects invalid or nonexistent sourceAccountId with 400 or 404', async () => {
    const invalidIdRes = await request(app)
      .post('/api/v1/transfers/internal')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'test-invalid-id-key-01')
      .send({
        sourceAccountId: 'invalid-non-object-id',
        recipientIdentifier: 'bob@bankofmaldives.com.mv',
        amountMinorUnits: 1000
      });

    expect(invalidIdRes.status).toBe(400);
    expect(invalidIdRes.body.error.code).toBe('SOURCE_ACCOUNT_INVALID');

    const nonExistentRes = await request(app)
      .post('/api/v1/transfers/internal')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'test-nonexistent-id-key-02')
      .send({
        sourceAccountId: '600000000000000000000000',
        recipientIdentifier: 'bob@bankofmaldives.com.mv',
        amountMinorUnits: 1000
      });

    expect(nonExistentRes.status).toBe(404);
    expect(nonExistentRes.body.error.code).toBe('SOURCE_ACCOUNT_INVALID');
  });

  it('POST /api/v1/cards issues virtual card and POST /api/v1/cards/:id/simulate-charge simulates POS payment', async () => {
    // 1. Issue Card for Alice
    const issueRes = await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        accountId: aliceUsdAccountId,
        cardholderName: 'Alice Johnson',
        brand: 'VISA',
        spendingLimitMonthlyMinorUnits: 150000 // $1,500.00
      });

    expect(issueRes.status).toBe(201);
    expect(issueRes.body.success).toBe(true);
    const cardId = issueRes.body.data.card.id;
    expect(cardId).toBeDefined();
    expect(issueRes.body.data.card.brand).toBe('VISA');

    // 2. Simulate POS Charge at merchant
    const chargeRes = await request(app)
      .post(`/api/v1/cards/${cardId}/simulate-charge`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'pos-charge-test-01')
      .send({
        merchantName: 'Starbucks Coffee',
        amountMinorUnits: 850 // $8.50
      });

    expect(chargeRes.status).toBe(200);
    expect(chargeRes.body.success).toBe(true);
    expect(chargeRes.body.data.approved).toBe(true);
    expect(chargeRes.body.data.merchantName).toBe('Starbucks Coffee');
  });
});
