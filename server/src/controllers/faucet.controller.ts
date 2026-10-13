import { Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { AccountModel } from '../models/Account.model';
import { LedgerAccountModel } from '../models/LedgerAccount.model';
import { LedgerService } from '../services/ledger.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.util';
import { formatMinorUnits, SUPPORTED_CURRENCIES } from '../../../shared/constants/currencies';

const FaucetSchema = z.object({
  accountId: z.string(),
  amountMinorUnits: z.number().int().positive()
});

export class FaucetController {
  static async injectLiquidity(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = FaucetSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid faucet request', 400, parsed.error.format());
      }

      const { accountId, amountMinorUnits } = parsed.data;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!Types.ObjectId.isValid(accountId)) {
        return sendError(res, 'ACCOUNT_NOT_FOUND', 'Active account not found', 404);
      }

      const account = await AccountModel.findOne({ _id: accountId, userId: req.user?.id, status: 'ACTIVE' });
      if (!account) {
        return sendError(res, 'ACCOUNT_NOT_FOUND', 'Active account not found', 404);
      }

      // Vault reserve ledger account for this currency
      let vault = await LedgerAccountModel.findOne({ code: `1001-VAULT-${account.currency}` });
      if (!vault) {
        vault = await LedgerAccountModel.create({
          code: `1001-VAULT-${account.currency}`,
          name: `Bank of Maldives Simulated Vault Reserve (${account.currency})`,
          type: 'ASSET',
          currency: account.currency,
          isSystemAccount: true,
          normalBalance: 'DEBIT',
          balanceMinorUnits: 1000000000
        });
      }

      const { journalEntry } = await LedgerService.postJournalEntry({
        idempotencyKey,
        referenceType: 'FAUCET_INJECTION',
        description: `Sandbox Faucet Test Funds (${formatMinorUnits(amountMinorUnits, account.currency)})`,
        metadata: {
          simulated: true,
          recipientUserId: req.user?.id,
          notes: 'Developer sandbox faucet liquidity'
        },
        legs: [
          {
            ledgerAccountId: vault._id,
            direction: 'DEBIT', // Vault asset increases (or promotional equity)
            amountMinorUnits,
            currency: account.currency
          },
          {
            ledgerAccountId: account.ledgerAccountId,
            direction: 'CREDIT', // Customer deposit liability increases
            amountMinorUnits,
            currency: account.currency
          }
        ]
      });

      return sendSuccess(res, {
        entryNumber: journalEntry.entryNumber,
        amountMinorUnits,
        amountFormatted: formatMinorUnits(amountMinorUnits, account.currency),
        currency: account.currency,
        postedAt: journalEntry.postedAt.toISOString()
      });
    } catch (err: any) {
      return sendError(res, 'FAUCET_FAILED', err.message, 500);
    }
  }
}
