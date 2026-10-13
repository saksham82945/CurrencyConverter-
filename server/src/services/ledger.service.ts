import { Types, ClientSession } from 'mongoose';
import { runInTransaction } from '../config/db';
import { LedgerAccountModel, ILedgerAccount } from '../models/LedgerAccount.model';
import { JournalEntryModel, IJournalEntry } from '../models/JournalEntry.model';
import { LedgerLineModel, ILedgerLine } from '../models/LedgerLine.model';
import { SupportedCurrency, formatMinorUnits, ALL_SUPPORTED_CURRENCIES } from '../shared/constants/currencies';
import { 
  JournalReferenceType, 
  EntryDirection, 
  TrialBalanceDTO, 
  TrialBalanceItem 
} from '../shared/types/ledger.types';

export interface LedgerLegInput {
  ledgerAccountId: Types.ObjectId | string;
  direction: EntryDirection;
  amountMinorUnits: number;
  currency: SupportedCurrency;
}

export interface PostJournalEntryParams {
  idempotencyKey?: string;
  referenceType: JournalReferenceType;
  referenceId?: string;
  description: string;
  metadata?: {
    simulated?: boolean;
    senderUserId?: Types.ObjectId | string;
    senderName?: string;
    recipientUserId?: Types.ObjectId | string;
    recipientName?: string;
    exchangeRateUsed?: number;
    notes?: string;
    [key: string]: any;
  };
  legs: LedgerLegInput[];
}

export class LedgerService {
  /**
   * Post a balanced double-entry journal entry atomically.
   * Throws if:
   * 1. Sum of debits != sum of credits for any currency leg.
   * 2. Any customer liability account would drop below zero.
   * 3. Idempotency key was already posted.
   */
  static async postJournalEntry(params: PostJournalEntryParams): Promise<{
    journalEntry: IJournalEntry;
    lines: ILedgerLine[];
  }> {
    // 1. Verify currency-level balance invariant
    const totalsByCurrency: Record<string, { debits: number; credits: number }> = {};

    for (const leg of params.legs) {
      if (leg.amountMinorUnits <= 0 || !Number.isInteger(leg.amountMinorUnits)) {
        throw new Error(`INVALID_AMOUNT: Ledger leg amount must be a positive integer minor unit (${leg.amountMinorUnits}).`);
      }

      if (!totalsByCurrency[leg.currency]) {
        totalsByCurrency[leg.currency] = { debits: 0, credits: 0 };
      }

      if (leg.direction === 'DEBIT') {
        totalsByCurrency[leg.currency].debits += leg.amountMinorUnits;
      } else {
        totalsByCurrency[leg.currency].credits += leg.amountMinorUnits;
      }
    }

    for (const [curr, totals] of Object.entries(totalsByCurrency)) {
      if (totals.debits !== totals.credits) {
        throw new Error(
          `UNBALANCED_ENTRY: Debits (${totals.debits}) do not equal Credits (${totals.credits}) for currency ${curr}.`
        );
      }
    }

    // 2. Generate unique entry number: JRN-YYYYMMDD-XXXXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const entryNumber = `JRN-${dateStr}-${randomHex}`;

    // 3. Execute in atomic transaction
    return await runInTransaction(async (session: ClientSession | null) => {
      // Check idempotency key if provided
      if (params.idempotencyKey) {
        const existing = await JournalEntryModel.findOne({ 
          idempotencyKey: params.idempotencyKey 
        }).session(session);

        if (existing) {
          const existingLines = await LedgerLineModel.find({ 
            journalEntryId: existing._id 
          }).session(session);
          return { journalEntry: existing, lines: existingLines };
        }
      }

      // Create JournalEntry header
      const [journalEntry] = await JournalEntryModel.create(
        [
          {
            entryNumber,
            idempotencyKey: params.idempotencyKey,
            referenceType: params.referenceType,
            referenceId: params.referenceId,
            description: params.description,
            status: 'POSTED',
            metadata: {
              ...(params.metadata || {}),
              senderUserId: params.metadata?.senderUserId ? new Types.ObjectId(params.metadata.senderUserId) : undefined,
              senderName: params.metadata?.senderName,
              recipientUserId: params.metadata?.recipientUserId ? new Types.ObjectId(params.metadata.recipientUserId) : undefined,
              recipientName: params.metadata?.recipientName,
              exchangeRateUsed: params.metadata?.exchangeRateUsed,
              notes: params.metadata?.notes
            },
            postedAt: new Date()
          }
        ],
        { session: session || undefined }
      );

      const createdLines: ILedgerLine[] = [];

      // Process each leg and update ledger accounts
      for (const leg of params.legs) {
        const ledgerAccount = await LedgerAccountModel.findById(leg.ledgerAccountId).session(session);
        if (!ledgerAccount) {
          throw new Error(`LEDGER_ACCOUNT_NOT_FOUND: Account with ID ${leg.ledgerAccountId} not found.`);
        }

        if (ledgerAccount.currency !== leg.currency) {
          throw new Error(
            `CURRENCY_MISMATCH: Account currency ${ledgerAccount.currency} does not match leg currency ${leg.currency}.`
          );
        }

        let newBalance = ledgerAccount.balanceMinorUnits;

        // Apply debit/credit math based on normal balance of account type
        if (ledgerAccount.normalBalance === 'DEBIT') {
          // ASSETS and EXPENSES: Debit increases, Credit decreases
          newBalance += leg.direction === 'DEBIT' ? leg.amountMinorUnits : -leg.amountMinorUnits;
        } else {
          // LIABILITIES, EQUITY, REVENUE: Credit increases, Debit decreases
          newBalance += leg.direction === 'CREDIT' ? leg.amountMinorUnits : -leg.amountMinorUnits;
        }

        // Customer deposit accounts are liabilities; cannot be overdrawn (balance < 0)
        if (ledgerAccount.type === 'LIABILITY' && !ledgerAccount.isSystemAccount && newBalance < 0) {
          throw new Error(
            `INSUFFICIENT_FUNDS: Available balance (${ledgerAccount.balanceMinorUnits}) cannot cover requested debit (${leg.amountMinorUnits}).`
          );
        }

        ledgerAccount.balanceMinorUnits = newBalance;
        await ledgerAccount.save({ session: session || undefined });

        const [line] = await LedgerLineModel.create(
          [
            {
              journalEntryId: journalEntry._id,
              ledgerAccountId: ledgerAccount._id,
              direction: leg.direction,
              amountMinorUnits: leg.amountMinorUnits,
              currency: leg.currency,
              accountBalanceAfter: newBalance
            }
          ],
          { session: session || undefined }
        );

        createdLines.push(line);
      }

      return { journalEntry, lines: createdLines };
    });
  }

  /**
   * Produce comprehensive system trial balance verifying debits === credits
   */
  static async getTrialBalance(): Promise<TrialBalanceDTO> {
    const accounts = await LedgerAccountModel.find().sort({ code: 1 });
    const items: TrialBalanceItem[] = [];

    const currencies = ALL_SUPPORTED_CURRENCIES;
    const totalsByCurrency: TrialBalanceDTO['totalsByCurrency'] = {} as any;
    for (const c of currencies) {
      totalsByCurrency[c] = { totalDebitsMinorUnits: 0, totalCreditsMinorUnits: 0, isBalanced: true };
    }

    for (const acc of accounts) {
      const isDebitNormal = acc.normalBalance === 'DEBIT';
      let debitTotal = 0;
      let creditTotal = 0;

      if (isDebitNormal) {
        if (acc.balanceMinorUnits >= 0) {
          debitTotal = acc.balanceMinorUnits;
        } else {
          creditTotal = -acc.balanceMinorUnits;
        }
      } else {
        if (acc.balanceMinorUnits >= 0) {
          creditTotal = acc.balanceMinorUnits;
        } else {
          debitTotal = -acc.balanceMinorUnits;
        }
      }

      items.push({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        currency: acc.currency,
        debitTotalMinorUnits: debitTotal,
        creditTotalMinorUnits: creditTotal,
        netBalanceMinorUnits: acc.balanceMinorUnits,
        netBalanceFormatted: formatMinorUnits(acc.balanceMinorUnits, acc.currency)
      });

      if (totalsByCurrency[acc.currency]) {
        totalsByCurrency[acc.currency].totalDebitsMinorUnits += debitTotal;
        totalsByCurrency[acc.currency].totalCreditsMinorUnits += creditTotal;
      }
    }

    let overallBalanced = true;
    for (const curr of currencies) {
      const t = totalsByCurrency[curr];
      t.isBalanced = t.totalDebitsMinorUnits === t.totalCreditsMinorUnits;
      if (!t.isBalanced) overallBalanced = false;
    }

    return {
      asOf: new Date().toISOString(),
      accounts: items,
      totalsByCurrency,
      overallBalanced
    };
  }

  /**
   * Audit every journal entry across history to verify debit/credit equality
   */
  static async auditLedgerInvariants(): Promise<{
    totalEntriesChecked: number;
    unbalancedEntriesCount: number;
    isValid: boolean;
    errors: string[];
  }> {
    const entries = await JournalEntryModel.find();
    let unbalancedCount = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      const lines = await LedgerLineModel.find({ journalEntryId: entry._id });
      const currencyMap: Record<string, { debits: number; credits: number }> = {};

      for (const line of lines) {
        if (!currencyMap[line.currency]) {
          currencyMap[line.currency] = { debits: 0, credits: 0 };
        }
        if (line.direction === 'DEBIT') {
          currencyMap[line.currency].debits += line.amountMinorUnits;
        } else {
          currencyMap[line.currency].credits += line.amountMinorUnits;
        }
      }

      for (const [curr, totals] of Object.entries(currencyMap)) {
        if (totals.debits !== totals.credits) {
          unbalancedCount++;
          errors.push(
            `Entry ${entry.entryNumber} is unbalanced in ${curr}: debits=${totals.debits}, credits=${totals.credits}`
          );
        }
      }
    }

    return {
      totalEntriesChecked: entries.length,
      unbalancedEntriesCount: unbalancedCount,
      isValid: unbalancedCount === 0,
      errors
    };
  }
}
