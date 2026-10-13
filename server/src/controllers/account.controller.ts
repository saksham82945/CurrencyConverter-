import { Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { AccountModel } from '../models/Account.model';
import { LedgerAccountModel } from '../models/LedgerAccount.model';
import { LedgerLineModel } from '../models/LedgerLine.model';
import { JournalEntryModel } from '../models/JournalEntry.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.util';
import { formatMinorUnits, SupportedCurrency } from '../shared/constants/currencies';
import { getWorldCurrency } from '../shared/constants/worldCurrencies';
import { AccountDTO } from '../shared/types/account.types';
import { FxService } from '../services/fx.service';
import { AuthService } from '../services/auth.service';

const CreateAccountSchema = z.object({
  currency: z.string().min(2).max(10).transform((val) => val.trim().toUpperCase()),
  accountType: z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .pipe(z.enum(['CHECKING', 'SAVINGS']))
    .default('CHECKING'),
  nickname: z.string().min(2).max(50).optional()
});

export class AccountController {
  static async listAccounts(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      }

      let accounts = await AccountModel.find({ userId: req.user.id, status: { $ne: 'CLOSED' } });

      // If user has no active accounts, auto-provision default USD & EUR accounts on the fly
      if (accounts.length === 0 && Types.ObjectId.isValid(req.user.id)) {
        try {
          await AuthService.provisionDefaultAccounts(new Types.ObjectId(req.user.id), req.user.email);
          accounts = await AccountModel.find({ userId: req.user.id, status: { $ne: 'CLOSED' } });
        } catch (provErr) {
          console.warn('[AccountController] Auto-provisioning note:', provErr);
        }
      }

      const accountDTOs: AccountDTO[] = [];
      let totalNetWorthUsdMinorUnits = 0;

      for (const acc of accounts) {
        let balance = 0;
        if (acc.ledgerAccountId) {
          try {
            const ledgerAcc = await LedgerAccountModel.findById(acc.ledgerAccountId);
            balance = ledgerAcc && typeof ledgerAcc.balanceMinorUnits === 'number' ? ledgerAcc.balanceMinorUnits : 0;
          } catch {
            balance = 0;
          }
        }

        accountDTOs.push({
          id: acc._id.toString(),
          userId: acc.userId?.toString() || req.user.id,
          accountNumber: acc.accountNumber,
          routingNumber: acc.routingNumber || '026014887',
          currency: acc.currency as SupportedCurrency,
          accountType: acc.accountType || 'CHECKING',
          nickname: acc.nickname || `${acc.currency} Account`,
          status: acc.status || 'ACTIVE',
          ledgerAccountId: acc.ledgerAccountId ? acc.ledgerAccountId.toString() : '',
          balanceMinorUnits: balance,
          balanceFormatted: formatMinorUnits(balance, acc.currency),
          availableMinorUnits: balance,
          availableFormatted: formatMinorUnits(balance, acc.currency),
          createdAt: acc.createdAt ? (typeof acc.createdAt === 'string' ? acc.createdAt : acc.createdAt.toISOString()) : new Date().toISOString()
        });

        // Convert balance to USD for aggregated net worth
        if (acc.currency === 'USD') {
          totalNetWorthUsdMinorUnits += balance;
        } else if (balance === 0) {
          totalNetWorthUsdMinorUnits += 0;
        } else {
          try {
            const quote = await FxService.getQuote(acc.currency, 'USD', balance);
            totalNetWorthUsdMinorUnits += quote.toAmountMinorUnits;
          } catch {
            // Robust fallback: compute USD equivalent via static world currency catalog rate
            const worldCurr = getWorldCurrency(acc.currency);
            const rateUsd = worldCurr.ratePerUSD || 1.0;
            const factor = Math.pow(10, worldCurr.decimals || 2);
            const usdUnits = Math.round((balance / factor) * (1 / rateUsd) * 100);
            totalNetWorthUsdMinorUnits += usdUnits;
          }
        }
      }

      return sendSuccess(res, {
        accounts: accountDTOs,
        totalNetWorthUSDMinorUnits: totalNetWorthUsdMinorUnits,
        totalNetWorthUSDFormatted: formatMinorUnits(totalNetWorthUsdMinorUnits, 'USD')
      });
    } catch (err: any) {
      return sendError(res, 'ACCOUNTS_FETCH_FAILED', err.message, 500);
    }
  }

  static async createAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = CreateAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid account parameters', 400, parsed.error.format());
      }

      const { currency, accountType, nickname } = parsed.data;

      // Check if user already has this currency account
      const existing = await AccountModel.findOne({ 
        userId: req.user?.id, 
        currency, 
        accountType,
        status: 'ACTIVE' 
      });

      if (existing) {
        return sendError(res, 'ACCOUNT_EXISTS', `You already have an active ${currency} ${accountType} account.`, 409);
      }

      // Generate unique account number with collision retry
      let accNum = '';
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = '77' + Math.floor(10000000 + Math.random() * 90000000).toString();
        const exists = await AccountModel.findOne({ accountNumber: candidate });
        if (!exists) {
          accNum = candidate;
          break;
        }
      }
      if (!accNum) {
        accNum = '77' + Date.now().toString().slice(-8);
      }

      const defaultNickname = nickname?.trim() || `${currency} ${accountType === 'CHECKING' ? 'Checking' : 'Savings'}`;

      // Create Ledger Account
      const ledgerAcc = await LedgerAccountModel.create({
        code: `2000-CUST-${currency}-${accNum}`,
        name: `${req.user?.email || 'User'} - ${defaultNickname}`,
        type: 'LIABILITY',
        currency,
        isSystemAccount: false,
        normalBalance: 'CREDIT',
        balanceMinorUnits: 0
      });

      const newAccount = await AccountModel.create({
        userId: req.user?.id,
        accountNumber: accNum,
        routingNumber: '026014887',
        currency,
        accountType,
        nickname: defaultNickname,
        status: 'ACTIVE',
        ledgerAccountId: ledgerAcc._id
      });

      const dto: AccountDTO = {
        id: newAccount._id.toString(),
        userId: newAccount.userId.toString(),
        accountNumber: newAccount.accountNumber,
        routingNumber: newAccount.routingNumber,
        currency: newAccount.currency as SupportedCurrency,
        accountType: newAccount.accountType,
        nickname: newAccount.nickname,
        status: newAccount.status,
        ledgerAccountId: newAccount.ledgerAccountId.toString(),
        balanceMinorUnits: 0,
        balanceFormatted: formatMinorUnits(0, newAccount.currency),
        availableMinorUnits: 0,
        availableFormatted: formatMinorUnits(0, newAccount.currency),
        createdAt: newAccount.createdAt.toISOString()
      };

      return sendSuccess(res, { account: dto }, 201);
    } catch (err: any) {
      return sendError(res, 'CREATE_ACCOUNT_FAILED', err.message, 500);
    }
  }

  static async getAccountById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      if (!id || !Types.ObjectId.isValid(id)) {
        return sendError(res, 'ACCOUNT_NOT_FOUND', 'Account not found', 404);
      }

      const account = await AccountModel.findOne({ 
        _id: id, 
        userId: req.user?.id 
      });

      if (!account) {
        return sendError(res, 'ACCOUNT_NOT_FOUND', 'Account not found', 404);
      }

      let balance = 0;
      if (account.ledgerAccountId) {
        try {
          const ledgerAcc = await LedgerAccountModel.findById(account.ledgerAccountId);
          balance = ledgerAcc ? ledgerAcc.balanceMinorUnits : 0;
        } catch {
          balance = 0;
        }
      }

      const dto: AccountDTO = {
        id: account._id.toString(),
        userId: account.userId?.toString() || req.user?.id || '',
        accountNumber: account.accountNumber,
        routingNumber: account.routingNumber || '026014887',
        currency: account.currency as SupportedCurrency,
        accountType: account.accountType || 'CHECKING',
        nickname: account.nickname || `${account.currency} Account`,
        status: account.status || 'ACTIVE',
        ledgerAccountId: account.ledgerAccountId ? account.ledgerAccountId.toString() : '',
        balanceMinorUnits: balance,
        balanceFormatted: formatMinorUnits(balance, account.currency),
        availableMinorUnits: balance,
        availableFormatted: formatMinorUnits(balance, account.currency),
        createdAt: account.createdAt ? (typeof account.createdAt === 'string' ? account.createdAt : account.createdAt.toISOString()) : new Date().toISOString()
      };

      return sendSuccess(res, { account: dto });
    } catch (err: any) {
      return sendError(res, 'GET_ACCOUNT_FAILED', err.message, 500);
    }
  }

  static async getAccountEntries(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      if (!id || !Types.ObjectId.isValid(id)) {
        return sendError(res, 'ACCOUNT_NOT_FOUND', 'Account not found', 404);
      }

      const account = await AccountModel.findOne({ 
        _id: id, 
        userId: req.user?.id 
      });

      if (!account) {
        return sendError(res, 'ACCOUNT_NOT_FOUND', 'Account not found', 404);
      }

      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const skip = (page - 1) * limit;

      if (!account.ledgerAccountId) {
        return sendSuccess(res, {
          items: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        });
      }

      const totalLines = await LedgerLineModel.countDocuments({ 
        ledgerAccountId: account.ledgerAccountId 
      });

      const lines = await LedgerLineModel.find({ 
        ledgerAccountId: account.ledgerAccountId 
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const journalIds = lines.map((l) => l.journalEntryId).filter(Boolean);
      const journals = await JournalEntryModel.find({ _id: { $in: journalIds } });
      const journalMap = new Map(journals.map((j) => [j._id.toString(), j]));

      const items = lines.map((line) => {
        const journal = line.journalEntryId ? journalMap.get(line.journalEntryId.toString()) : undefined;
        return {
          id: line._id.toString(),
          journalEntryId: line.journalEntryId ? line.journalEntryId.toString() : '',
          entryNumber: journal ? journal.entryNumber : 'UNKNOWN',
          description: journal ? journal.description : 'Transaction',
          referenceType: journal ? journal.referenceType : 'TRANSFER',
          direction: line.direction,
          amountMinorUnits: line.amountMinorUnits,
          amountFormatted: formatMinorUnits(line.amountMinorUnits, line.currency),
          currency: line.currency,
          accountBalanceAfter: line.accountBalanceAfter,
          accountBalanceAfterFormatted: formatMinorUnits(line.accountBalanceAfter, line.currency),
          postedAt: journal?.postedAt ? journal.postedAt.toISOString() : (line.createdAt ? line.createdAt.toISOString() : new Date().toISOString())
        };
      });

      return sendSuccess(res, {
        items,
        pagination: {
          total: totalLines,
          page,
          limit,
          totalPages: Math.ceil(totalLines / limit)
        }
      });
    } catch (err: any) {
      return sendError(res, 'ENTRIES_FETCH_FAILED', err.message, 500);
    }
  }
}
