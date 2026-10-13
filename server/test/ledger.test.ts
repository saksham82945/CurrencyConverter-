import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '../src/config/db';
import { LedgerAccountModel } from '../src/models/LedgerAccount.model';
import { JournalEntryModel } from '../src/models/JournalEntry.model';
import { LedgerService } from '../src/services/ledger.service';

describe('Financial Integrity & Double-Entry Ledger Engine', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('rejects journal entries where debits != credits', async () => {
    const asset = await LedgerAccountModel.create({
      code: 'TEST-1001-ASSET',
      name: 'Test Vault Asset',
      type: 'ASSET',
      currency: 'USD',
      normalBalance: 'DEBIT',
      balanceMinorUnits: 50000
    });

    const liability = await LedgerAccountModel.create({
      code: 'TEST-2001-LIAB',
      name: 'Test Customer Liability',
      type: 'LIABILITY',
      currency: 'USD',
      normalBalance: 'CREDIT',
      balanceMinorUnits: 50000
    });

    // Unbalanced: Debit 1000, Credit 900
    await expect(
      LedgerService.postJournalEntry({
        referenceType: 'P2P_TRANSFER',
        description: 'Unbalanced test',
        legs: [
          { ledgerAccountId: asset._id, direction: 'DEBIT', amountMinorUnits: 1000, currency: 'USD' },
          { ledgerAccountId: liability._id, direction: 'CREDIT', amountMinorUnits: 900, currency: 'USD' }
        ]
      })
    ).rejects.toThrow(/UNBALANCED_ENTRY/);
  });

  it('prevents customer liability account from dropping below zero', async () => {
    const custLiability = await LedgerAccountModel.create({
      code: 'TEST-2002-BROKE',
      name: 'Test Broke Customer',
      type: 'LIABILITY',
      currency: 'USD',
      normalBalance: 'CREDIT',
      balanceMinorUnits: 500 // Only $5.00
    });

    const vault = await LedgerAccountModel.create({
      code: 'TEST-1002-VAULT',
      name: 'Vault',
      type: 'ASSET',
      currency: 'USD',
      normalBalance: 'DEBIT',
      balanceMinorUnits: 100000
    });

    // Attempting to withdraw $10.00 (1000 cents) when balance is only $5.00 (500 cents)
    await expect(
      LedgerService.postJournalEntry({
        referenceType: 'P2P_TRANSFER',
        description: 'Overdraft test',
        legs: [
          { ledgerAccountId: custLiability._id, direction: 'DEBIT', amountMinorUnits: 1000, currency: 'USD' },
          { ledgerAccountId: vault._id, direction: 'CREDIT', amountMinorUnits: 1000, currency: 'USD' }
        ]
      })
    ).rejects.toThrow(/INSUFFICIENT_FUNDS/);
  });

  it('posts balanced entry and maintains debit/credit equality', async () => {
    const sender = await LedgerAccountModel.create({
      code: 'TEST-2003-SENDER',
      name: 'Sender Account',
      type: 'LIABILITY',
      currency: 'USD',
      normalBalance: 'CREDIT',
      balanceMinorUnits: 10000 // $100.00
    });

    const recipient = await LedgerAccountModel.create({
      code: 'TEST-2004-RECIPIENT',
      name: 'Recipient Account',
      type: 'LIABILITY',
      currency: 'USD',
      normalBalance: 'CREDIT',
      balanceMinorUnits: 2000 // $20.00
    });

    const { journalEntry, lines } = await LedgerService.postJournalEntry({
      referenceType: 'P2P_TRANSFER',
      description: 'Valid transfer test',
      legs: [
        { ledgerAccountId: sender._id, direction: 'DEBIT', amountMinorUnits: 3000, currency: 'USD' },
        { ledgerAccountId: recipient._id, direction: 'CREDIT', amountMinorUnits: 3000, currency: 'USD' }
      ]
    });

    expect(journalEntry.status).toBe('POSTED');
    expect(lines.length).toBe(2);

    const updatedSender = await LedgerAccountModel.findById(sender._id);
    const updatedRecipient = await LedgerAccountModel.findById(recipient._id);

    expect(updatedSender?.balanceMinorUnits).toBe(7000); // 10000 - 3000
    expect(updatedRecipient?.balanceMinorUnits).toBe(5000); // 2000 + 3000
  });

  it('respects idempotency keys and prevents double deductions', async () => {
    const acc1 = await LedgerAccountModel.create({
      code: 'TEST-2005-IDEMP1',
      name: 'Idemp 1',
      type: 'LIABILITY',
      currency: 'USD',
      normalBalance: 'CREDIT',
      balanceMinorUnits: 10000
    });

    const acc2 = await LedgerAccountModel.create({
      code: 'TEST-2006-IDEMP2',
      name: 'Idemp 2',
      type: 'LIABILITY',
      currency: 'USD',
      normalBalance: 'CREDIT',
      balanceMinorUnits: 10000
    });

    const key = 'test-idempotency-uuid-1234';

    const firstPost = await LedgerService.postJournalEntry({
      idempotencyKey: key,
      referenceType: 'P2P_TRANSFER',
      description: 'First attempt',
      legs: [
        { ledgerAccountId: acc1._id, direction: 'DEBIT', amountMinorUnits: 1500, currency: 'USD' },
        { ledgerAccountId: acc2._id, direction: 'CREDIT', amountMinorUnits: 1500, currency: 'USD' }
      ]
    });

    const secondPost = await LedgerService.postJournalEntry({
      idempotencyKey: key,
      referenceType: 'P2P_TRANSFER',
      description: 'Second retry attempt with same key',
      legs: [
        { ledgerAccountId: acc1._id, direction: 'DEBIT', amountMinorUnits: 1500, currency: 'USD' },
        { ledgerAccountId: acc2._id, direction: 'CREDIT', amountMinorUnits: 1500, currency: 'USD' }
      ]
    });

    expect(secondPost.journalEntry.entryNumber).toBe(firstPost.journalEntry.entryNumber);

    const finalAcc1 = await LedgerAccountModel.findById(acc1._id);
    expect(finalAcc1?.balanceMinorUnits).toBe(8500); // deducted only ONCE!
  });
});
