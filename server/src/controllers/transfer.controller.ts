import { Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { AccountModel } from '../models/Account.model';
import { UserModel } from '../models/User.model';
import { LedgerAccountModel } from '../models/LedgerAccount.model';
import { JournalEntryModel } from '../models/JournalEntry.model';
import { LedgerLineModel } from '../models/LedgerLine.model';
import { InstitutionModel } from '../models/Institution.model';
import { AuditLogModel } from '../models/AuditLog.model';
import { BeneficiaryModel } from '../models/Beneficiary.model';
import { LedgerService } from '../services/ledger.service';
import { FxService } from '../services/fx.service';
import { generateReceiptHash } from '../utils/hash.util';
import { sendSuccess, sendError } from '../utils/response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { formatMinorUnits, SupportedCurrency, ALL_SUPPORTED_CURRENCIES } from '../shared/constants/currencies';

const InternalTransferSchema = z.object({
  sourceAccountId: z.string(),
  recipientIdentifier: z.string().min(1), // email, account number, or receipt account
  recipientName: z.string().optional(),
  amountMinorUnits: z.number().int().positive('Amount must be greater than zero'),
  targetCurrency: z.string().optional(),
  description: z.string().max(100).optional(),
  simulatedPin: z.string().optional()
});

const ExternalTransferSchema = z.object({
  sourceAccountId: z.string(),
  institutionRoutingOrBic: z.string(),
  institutionName: z.string().optional(),
  beneficiaryName: z.string().min(2),
  beneficiaryAccountNumber: z.string().min(4),
  amountMinorUnits: z.number().int().positive(),
  rail: z.enum(['ACH', 'WIRE', 'SEPA', 'FASTER_PAYMENTS', 'RAAST', 'RTGS', 'SWIFT', 'NEFT']).default('WIRE'),
  targetCurrency: z.string().optional(),
  description: z.string().max(100).optional(),
  simulatedPin: z.string().optional()
});

const MultiCurrencyTransferSchema = z.object({
  sourceAccountId: z.string(),
  targetCurrency: z.string().min(3).max(10),
  sourceAmountMinorUnits: z.number().int().positive('Amount must be greater than zero'),
  transferType: z.enum(['EXTERNAL_BANK', 'INTERNAL_NEXAPAY']),
  institutionRoutingOrBic: z.string().optional(),
  institutionName: z.string().optional(),
  beneficiaryName: z.string().min(2).optional(),
  beneficiaryAccountNumber: z.string().min(4).optional(),
  rail: z.enum(['ACH', 'WIRE', 'SEPA', 'FASTER_PAYMENTS', 'RAAST', 'RTGS', 'SWIFT', 'NEFT']).default('WIRE'),
  recipientIdentifier: z.string().min(3).optional(),
  description: z.string().max(150).optional(),
  simulatedPin: z.string().optional()
});

const FxSwapSchema = z.object({
  fromAccountId: z.string(),
  toAccountId: z.string(),
  fromAmountMinorUnits: z.number().int().positive()
});

async function getOrCreateSystemAccount(
  code: string,
  name: string,
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
  currency: string,
  normalBalance: 'DEBIT' | 'CREDIT',
  defaultBalance = 0
) {
  let acc = await LedgerAccountModel.findOne({ code });
  if (!acc) {
    acc = await LedgerAccountModel.create({
      code,
      name,
      type,
      currency,
      isSystemAccount: true,
      normalBalance,
      balanceMinorUnits: defaultBalance
    });
  }
  return acc;
}

export class TransferController {
  static async transferInternal(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = InternalTransferSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid transfer inputs', 400, parsed.error.format());
      }

      const { sourceAccountId, recipientIdentifier, recipientName, amountMinorUnits, targetCurrency, description } = parsed.data;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      // 1. Verify source account ownership
      if (!Types.ObjectId.isValid(sourceAccountId)) {
        return sendError(res, 'SOURCE_ACCOUNT_INVALID', 'Invalid source account ID', 400);
      }

      const sourceAccount = await AccountModel.findOne({ 
        _id: sourceAccountId, 
        userId: req.user?.id, 
        status: 'ACTIVE' 
      });
      if (!sourceAccount) {
        return sendError(res, 'SOURCE_ACCOUNT_INVALID', 'Source account not found or not active.', 404);
      }

      const user = await UserModel.findById(req.user?.id);

      // Determine effective target currency
      const destCurrency = (targetCurrency || sourceAccount.currency).toUpperCase();
      const isCrossCurrency = destCurrency !== sourceAccount.currency;

      // 2. Find recipient user or counterparty account
      const normRecipient = recipientIdentifier.toLowerCase().trim();
      let recipientUser = await UserModel.findOne({ email: normRecipient });
      if (!recipientUser) {
        if (normRecipient.endsWith('@bankofmaldives.com.mv')) {
          recipientUser = await UserModel.findOne({ email: normRecipient.replace('@bankofmaldives.com.mv', '@nexapay.test') });
        } else if (normRecipient.endsWith('@nexapay.test')) {
          recipientUser = await UserModel.findOne({ email: normRecipient.replace('@nexapay.test', '@bankofmaldives.com.mv') });
        }
      }
      let recipientAccount: any = null;
      let effectiveAccountNumber = recipientIdentifier.trim();
      let effectiveRecipientName = (recipientName || '').trim();
      let recipientLedgerAccount: any = null;

      if (recipientUser) {
        recipientAccount = await AccountModel.findOne({ 
          userId: recipientUser._id, 
          currency: destCurrency, 
          status: 'ACTIVE' 
        });

        if (!recipientAccount) {
          const accNum = '77' + Math.floor(10000000 + Math.random() * 90000000).toString();
          const recipientLedgerAcc = await LedgerAccountModel.create({
            code: `2000-CUST-${destCurrency}-${accNum}`,
            name: `${recipientUser.email} - ${destCurrency} Checking`,
            type: 'LIABILITY',
            currency: destCurrency,
            isSystemAccount: false,
            normalBalance: 'CREDIT',
            balanceMinorUnits: 0
          });

          recipientAccount = await AccountModel.create({
            userId: recipientUser._id,
            accountNumber: accNum,
            currency: destCurrency,
            accountType: 'CHECKING',
            nickname: `${destCurrency} Checking`,
            status: 'ACTIVE',
            ledgerAccountId: recipientLedgerAcc._id
          });
        }

        if (recipientAccount._id.toString() === sourceAccount._id.toString()) {
          return sendError(res, 'SELF_TRANSFER_PROHIBITED', 'Cannot make a P2P transfer to the identical account.', 400);
        }

        effectiveAccountNumber = recipientAccount.accountNumber;
        effectiveRecipientName = effectiveRecipientName || recipientUser.fullName;
        recipientLedgerAccount = await LedgerAccountModel.findById(recipientAccount.ledgerAccountId);
      } else {
        // Look up by account number in database
        const foundByNum = await AccountModel.findOne({ 
          accountNumber: recipientIdentifier.trim(), 
          status: 'ACTIVE' 
        });

        if (foundByNum) {
          recipientUser = await UserModel.findById(foundByNum.userId);
          if (foundByNum.currency === destCurrency) {
            recipientAccount = foundByNum;
          } else if (recipientUser) {
            recipientAccount = await AccountModel.findOne({
              userId: recipientUser._id,
              currency: destCurrency,
              status: 'ACTIVE'
            });
          }

          if (recipientAccount) {
            if (recipientAccount._id.toString() === sourceAccount._id.toString()) {
              return sendError(res, 'SELF_TRANSFER_PROHIBITED', 'Cannot make a P2P transfer to the identical account.', 400);
            }
            effectiveAccountNumber = recipientAccount.accountNumber;
            effectiveRecipientName = effectiveRecipientName || (recipientUser?.fullName || 'BML Account Holder');
            recipientLedgerAccount = await LedgerAccountModel.findById(recipientAccount.ledgerAccountId);
          }
        }

        // If not an existing user account in DB, allow ANY normal receipt account number!
        if (!recipientLedgerAccount) {
          const isNumeric = /^\d+$/.test(recipientIdentifier.trim());
          effectiveAccountNumber = isNumeric
            ? recipientIdentifier.trim()
            : (recipientIdentifier.trim().startsWith('77') ? recipientIdentifier.trim() : `773000${Math.floor(1000000 + Math.random() * 9000000)}`);

          // Check if there is a saved beneficiary
          const savedBeneficiary = await BeneficiaryModel.findOne({
            userId: user?._id,
            identifier: { $in: [recipientIdentifier.trim(), effectiveAccountNumber] }
          });

          if (!effectiveRecipientName) {
            if (savedBeneficiary?.name) {
              effectiveRecipientName = savedBeneficiary.name;
            } else if (effectiveAccountNumber === '7730000852744' || recipientIdentifier.trim() === '7730000852744') {
              effectiveRecipientName = 'ALI SHAVIN';
            } else if (!isNumeric && recipientIdentifier.trim().length > 1) {
              effectiveRecipientName = recipientIdentifier.trim();
            } else {
              effectiveRecipientName = 'ALI SHAVIN';
            }
          }

          // Create counterparty liability ledger account for balancing
          const ledgerCode = `2002-COUNTERPARTY-${destCurrency}-${effectiveAccountNumber}`;
          recipientLedgerAccount = await LedgerAccountModel.findOne({ code: ledgerCode });
          if (!recipientLedgerAccount) {
            recipientLedgerAccount = await LedgerAccountModel.create({
              code: ledgerCode,
              name: `${effectiveRecipientName} - BML Account (${effectiveAccountNumber})`,
              type: 'LIABILITY',
              currency: destCurrency,
              isSystemAccount: false,
              normalBalance: 'CREDIT',
              balanceMinorUnits: 0
            });
          }
        }
      }

      if (effectiveAccountNumber === sourceAccount.accountNumber) {
        return sendError(res, 'SELF_TRANSFER_PROHIBITED', 'Cannot make a P2P transfer to the identical account.', 400);
      }

      const senderLedgerAccount = await LedgerAccountModel.findById(sourceAccount.ledgerAccountId);
      if (!senderLedgerAccount || !recipientLedgerAccount) {
        return sendError(res, 'LEDGER_ACCOUNT_ERROR', 'Underlying ledger accounts not configured properly.', 500);
      }

      let quote: any = null;
      let legs: any[] = [];
      let finalCreditedMinorUnits = amountMinorUnits;

      if (isCrossCurrency) {
        quote = await FxService.getQuote(sourceAccount.currency, destCurrency, amountMinorUnits);
        finalCreditedMinorUnits = quote.toAmountMinorUnits;

        const feeRevenueAcc = await getOrCreateSystemAccount(
          `4001-FX-FEE-REVENUE-${sourceAccount.currency}`,
          `Bank of Maldives FX Fee Revenue (${sourceAccount.currency})`,
          'REVENUE',
          sourceAccount.currency,
          'CREDIT',
          0
        );

        const sourceVault = await getOrCreateSystemAccount(
          `1001-VAULT-${sourceAccount.currency}`,
          `Bank of Maldives Vault Reserve (${sourceAccount.currency})`,
          'ASSET',
          sourceAccount.currency,
          'DEBIT',
          1000000000
        );

        const targetVault = await getOrCreateSystemAccount(
          `1001-VAULT-${destCurrency}`,
          `Bank of Maldives Vault Reserve (${destCurrency})`,
          'ASSET',
          destCurrency,
          'DEBIT',
          1000000000
        );

        legs = [
          // Source Currency Leg (Balanced: Debit = amount, Credit = fee + net)
          {
            ledgerAccountId: senderLedgerAccount._id,
            direction: 'DEBIT',
            amountMinorUnits,
            currency: sourceAccount.currency
          },
          ...(quote.feeMinorUnits > 0 ? [{
            ledgerAccountId: feeRevenueAcc._id,
            direction: 'CREDIT',
            amountMinorUnits: quote.feeMinorUnits,
            currency: sourceAccount.currency
          }] : []),
          {
            ledgerAccountId: sourceVault._id,
            direction: 'CREDIT',
            amountMinorUnits: quote.netFromMinorUnits,
            currency: sourceAccount.currency
          },
          // Destination Currency Leg (Balanced: Debit = target, Credit = target)
          {
            ledgerAccountId: targetVault._id,
            direction: 'DEBIT',
            amountMinorUnits: quote.toAmountMinorUnits,
            currency: destCurrency
          },
          {
            ledgerAccountId: recipientLedgerAccount._id,
            direction: 'CREDIT',
            amountMinorUnits: quote.toAmountMinorUnits,
            currency: destCurrency
          }
        ];
      } else {
        // Same-currency standard P2P
        legs = [
          {
            ledgerAccountId: senderLedgerAccount._id,
            direction: 'DEBIT',
            amountMinorUnits,
            currency: sourceAccount.currency
          },
          {
            ledgerAccountId: recipientLedgerAccount._id,
            direction: 'CREDIT',
            amountMinorUnits,
            currency: sourceAccount.currency
          }
        ];
      }

      const transferDesc = description || (isCrossCurrency
        ? `Multi-Currency Transfer: ${formatMinorUnits(amountMinorUnits, sourceAccount.currency)} -> ${formatMinorUnits(finalCreditedMinorUnits, destCurrency)} to ${effectiveRecipientName}`
        : `Transfer to ${effectiveRecipientName}`);

      const { journalEntry } = await LedgerService.postJournalEntry({
        idempotencyKey,
        referenceType: 'P2P_TRANSFER',
        referenceId: recipientAccount ? recipientAccount._id.toString() : effectiveAccountNumber,
        description: transferDesc,
        metadata: {
          simulated: false,
          senderUserId: user?._id,
          senderName: user?.fullName || 'Darren Trader',
          senderAccount: sourceAccount.accountNumber,
          recipientUserId: recipientUser?._id,
          recipientName: effectiveRecipientName,
          beneficiaryName: effectiveRecipientName,
          beneficiaryAccountNumber: effectiveAccountNumber,
          beneficiaryBank: 'Bank of Maldives',
          institutionName: 'Bank of Maldives',
          narration: (description || transferDesc).toUpperCase(),
          statusText: 'SUCCESS',
          sourceCurrency: sourceAccount.currency,
          targetCurrency: destCurrency,
          exchangeRateUsed: quote ? quote.rate : 1.0,
          sourceAmountMinorUnits: amountMinorUnits,
          targetAmountMinorUnits: finalCreditedMinorUnits,
          notes: description || transferDesc
        },
        legs
      });

      const receiptHash = generateReceiptHash({
        entryNumber: journalEntry.entryNumber,
        sourceAccount: sourceAccount.accountNumber,
        destinationAccount: effectiveAccountNumber,
        amountMinorUnits,
        currency: sourceAccount.currency,
        timestamp: journalEntry.postedAt.toISOString()
      });

      await AuditLogModel.create({
        actorUserId: user?._id,
        actorRole: user?.role,
        action: 'P2P_TRANSFER',
        entityType: 'ACCOUNT',
        entityId: sourceAccount._id.toString(),
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Bank-of-Maldives-Client',
        details: {
          entryNumber: journalEntry.entryNumber,
          sourceAmountMinorUnits: amountMinorUnits,
          sourceCurrency: sourceAccount.currency,
          targetCurrency: destCurrency,
          creditedMinorUnits: finalCreditedMinorUnits,
          exchangeRate: quote ? quote.rate : 1.0,
          recipientId: recipientUser?._id || effectiveAccountNumber
        }
      });

      return sendSuccess(res, {
        journalEntryId: journalEntry._id.toString(),
        entryNumber: journalEntry.entryNumber,
        status: journalEntry.status,
        amountMinorUnits,
        amountFormatted: formatMinorUnits(amountMinorUnits, sourceAccount.currency),
        currency: sourceAccount.currency,
        targetCurrency: destCurrency,
        creditedMinorUnits: finalCreditedMinorUnits,
        creditedFormatted: formatMinorUnits(finalCreditedMinorUnits, destCurrency),
        appliedRate: quote ? quote.rate : 1.0,
        recipientName: effectiveRecipientName,
        recipientAccount: effectiveAccountNumber,
        beneficiaryAccountNumber: effectiveAccountNumber,
        receiptHash,
        postedAt: journalEntry.postedAt.toISOString()
      });
    } catch (err: any) {
      const code = err.message.startsWith('INSUFFICIENT_FUNDS') ? 'INSUFFICIENT_FUNDS' : 'TRANSFER_FAILED';
      return sendError(res, code, err.message, 400);
    }
  }

  static async transferExternal(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = ExternalTransferSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid wire details', 400, parsed.error.format());
      }

      const { 
        sourceAccountId, 
        institutionRoutingOrBic, 
        beneficiaryName, 
        beneficiaryAccountNumber, 
        amountMinorUnits, 
        rail, 
        targetCurrency,
        description 
      } = parsed.data;

      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!Types.ObjectId.isValid(sourceAccountId)) {
        return sendError(res, 'SOURCE_ACCOUNT_INVALID', 'Invalid source account ID', 400);
      }

      const sourceAccount = await AccountModel.findOne({ 
        _id: sourceAccountId, 
        userId: req.user?.id, 
        status: 'ACTIVE' 
      });
      if (!sourceAccount) {
        return sendError(res, 'SOURCE_ACCOUNT_INVALID', 'Source account not found', 404);
      }

      // Verify institution or use custom added bank
      let institution = await InstitutionModel.findOne({
        $or: [
          { routingNumber: institutionRoutingOrBic.trim() },
          { bicSwift: institutionRoutingOrBic.trim().toUpperCase() }
        ]
      });

      const institutionName = parsed.data.institutionName?.trim() || (institution ? institution.name : (institutionRoutingOrBic ? `Bank (${institutionRoutingOrBic})` : 'Commercial Bank'));

      if (!institution && parsed.data.institutionName) {
        await InstitutionModel.create({
          name: institutionName,
          routingNumber: institutionRoutingOrBic.trim(),
          bicSwift: institutionRoutingOrBic.trim().toUpperCase(),
          country: 'GLOBAL',
          supportedCurrencies: [sourceAccount.currency, (targetCurrency || sourceAccount.currency)],
          supportedRail: rail,
          networkStatus: 'ONLINE',
          isFictionalDisclaimer: false
        }).catch(() => null);
      }

      const user = await UserModel.findById(req.user?.id);

      // Determine effective target currency
      const destCurrency = (targetCurrency || sourceAccount.currency).toUpperCase();
      const isCrossCurrency = destCurrency !== sourceAccount.currency;

      let quote: any = null;
      let legs: any[] = [];
      let finalCreditedMinorUnits = amountMinorUnits;

      if (isCrossCurrency) {
        // Calculate authoritative real-time FX quote
        quote = await FxService.getQuote(sourceAccount.currency, destCurrency, amountMinorUnits);
        finalCreditedMinorUnits = quote.toAmountMinorUnits;

        const feeRevenueAcc = await getOrCreateSystemAccount(
          `4001-FX-FEE-REVENUE-${sourceAccount.currency}`,
          `Bank of Maldives FX Fee Revenue (${sourceAccount.currency})`,
          'REVENUE',
          sourceAccount.currency,
          'CREDIT',
          0
        );

        const sourceVault = await getOrCreateSystemAccount(
          `1001-VAULT-${sourceAccount.currency}`,
          `Bank of Maldives Vault Reserve (${sourceAccount.currency})`,
          'ASSET',
          sourceAccount.currency,
          'DEBIT',
          1000000000
        );

        const targetVault = await getOrCreateSystemAccount(
          `1001-VAULT-${destCurrency}`,
          `Bank of Maldives Vault Reserve (${destCurrency})`,
          'ASSET',
          destCurrency,
          'DEBIT',
          1000000000
        );

        const clearingAcc = await getOrCreateSystemAccount(
          `1200-OUTBOUND-CLEARING-${destCurrency}`,
          `Bank of Maldives Outbound Clearing Transit (${destCurrency})`,
          'ASSET',
          destCurrency,
          'DEBIT',
          0
        );

        legs = [
          // Source Currency Leg
          {
            ledgerAccountId: sourceAccount.ledgerAccountId,
            direction: 'DEBIT',
            amountMinorUnits,
            currency: sourceAccount.currency
          },
          ...(quote.feeMinorUnits > 0 ? [{
            ledgerAccountId: feeRevenueAcc._id,
            direction: 'CREDIT',
            amountMinorUnits: quote.feeMinorUnits,
            currency: sourceAccount.currency
          }] : []),
          {
            ledgerAccountId: sourceVault._id,
            direction: 'CREDIT',
            amountMinorUnits: quote.netFromMinorUnits,
            currency: sourceAccount.currency
          },
          // Destination Currency Leg
          {
            ledgerAccountId: targetVault._id,
            direction: 'DEBIT',
            amountMinorUnits: quote.toAmountMinorUnits,
            currency: destCurrency
          },
          {
            ledgerAccountId: clearingAcc._id,
            direction: 'CREDIT',
            amountMinorUnits: quote.toAmountMinorUnits,
            currency: destCurrency
          }
        ];
      } else {
        // Same-currency standard wire
        const clearingAcc = await getOrCreateSystemAccount(
          `1200-OUTBOUND-CLEARING-${sourceAccount.currency}`,
          `Bank of Maldives Outbound Clearing Transit (${sourceAccount.currency})`,
          'ASSET',
          sourceAccount.currency,
          'DEBIT',
          0
        );

        legs = [
          {
            ledgerAccountId: sourceAccount.ledgerAccountId,
            direction: 'DEBIT',
            amountMinorUnits,
            currency: sourceAccount.currency
          },
          {
            ledgerAccountId: clearingAcc._id,
            direction: 'CREDIT',
            amountMinorUnits,
            currency: sourceAccount.currency
          }
        ];
      }

      const wireDesc = description || (isCrossCurrency
        ? `Cross-Border Wire (${sourceAccount.currency} -> ${destCurrency}): ${formatMinorUnits(amountMinorUnits, sourceAccount.currency)} to ${beneficiaryName} at ${institutionName}`
        : `Outbound ${rail} Transfer to ${beneficiaryName} at ${institutionName}`);

      const { journalEntry } = await LedgerService.postJournalEntry({
        idempotencyKey,
        referenceType: 'EXTERNAL_TRANSFER',
        description: wireDesc,
        metadata: {
          simulated: false,
          senderUserId: user?._id,
          senderName: user?.fullName || 'Darren Trader',
          senderAccount: sourceAccount.accountNumber,
          recipientName: beneficiaryName,
          beneficiaryName,
          beneficiaryAccountNumber,
          beneficiaryBank: institutionName,
          institutionName,
          narration: (description || wireDesc).toUpperCase(),
          statusText: 'Transaction Successful',
          sourceCurrency: sourceAccount.currency,
          targetCurrency: destCurrency,
          sourceAmountMinorUnits: amountMinorUnits,
          targetAmountMinorUnits: finalCreditedMinorUnits,
          exchangeRateUsed: quote ? quote.rate : 1.0,
          rail,
          notes: `Rail: ${rail} | Routing/BIC: ${institutionRoutingOrBic} | Account: ${beneficiaryAccountNumber}`
        },
        legs
      });

      const receiptHash = generateReceiptHash({
        entryNumber: journalEntry.entryNumber,
        sourceAccount: sourceAccount.accountNumber,
        destinationAccount: beneficiaryAccountNumber,
        amountMinorUnits,
        currency: sourceAccount.currency,
        timestamp: journalEntry.postedAt.toISOString()
      });

      return sendSuccess(res, {
        journalEntryId: journalEntry._id.toString(),
        entryNumber: journalEntry.entryNumber,
        status: journalEntry.status,
        amountMinorUnits,
        amountFormatted: formatMinorUnits(amountMinorUnits, sourceAccount.currency),
        currency: sourceAccount.currency,
        targetCurrency: destCurrency,
        creditedMinorUnits: finalCreditedMinorUnits,
        creditedFormatted: formatMinorUnits(finalCreditedMinorUnits, destCurrency),
        appliedRate: quote ? quote.rate : 1.0,
        beneficiaryName,
        beneficiaryAccountNumber,
        institutionName,
        rail,
        receiptHash,
        postedAt: journalEntry.postedAt.toISOString()
      });
    } catch (err: any) {
      const code = err.message.startsWith('INSUFFICIENT_FUNDS') ? 'INSUFFICIENT_FUNDS' : 'EXTERNAL_TRANSFER_FAILED';
      return sendError(res, code, err.message, 400);
    }
  }

  static async transferMultiCurrency(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = MultiCurrencyTransferSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid multi-currency transfer parameters', 400, parsed.error.format());
      }

      const {
        sourceAccountId,
        targetCurrency,
        sourceAmountMinorUnits,
        transferType,
        institutionRoutingOrBic,
        institutionName,
        beneficiaryName,
        beneficiaryAccountNumber,
        rail,
        recipientIdentifier,
        description
      } = parsed.data;

      if (transferType === 'EXTERNAL_BANK') {
        if (!institutionRoutingOrBic || !beneficiaryName || !beneficiaryAccountNumber) {
          return sendError(res, 'MISSING_BENEFICIARY_DETAILS', 'External transfers require routing, beneficiary name and account number.', 400);
        }

        // Delegate to transferExternal with targetCurrency and custom institutionName
        req.body = {
          sourceAccountId,
          institutionRoutingOrBic,
          institutionName,
          beneficiaryName,
          beneficiaryAccountNumber,
          amountMinorUnits: sourceAmountMinorUnits,
          rail,
          targetCurrency,
          description
        };
        return await TransferController.transferExternal(req, res);
      } else {
        if (!recipientIdentifier) {
          return sendError(res, 'MISSING_RECIPIENT', 'Internal transfer requires recipient email or account number.', 400);
        }

        // Delegate to transferInternal with targetCurrency
        req.body = {
          sourceAccountId,
          recipientIdentifier,
          amountMinorUnits: sourceAmountMinorUnits,
          targetCurrency,
          description
        };
        return await TransferController.transferInternal(req, res);
      }
    } catch (err: any) {
      return sendError(res, 'MULTI_CURRENCY_TRANSFER_FAILED', err.message, 400);
    }
  }

  static async transferFxSwap(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = FxSwapSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid FX swap parameters', 400, parsed.error.format());
      }

      const { fromAccountId, toAccountId, fromAmountMinorUnits } = parsed.data;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!Types.ObjectId.isValid(fromAccountId) || !Types.ObjectId.isValid(toAccountId)) {
        return sendError(res, 'ACCOUNT_NOT_FOUND', 'Source or destination conversion account not found', 404);
      }

      const fromAccount = await AccountModel.findOne({ _id: fromAccountId, userId: req.user?.id, status: 'ACTIVE' });
      const toAccount = await AccountModel.findOne({ _id: toAccountId, userId: req.user?.id, status: 'ACTIVE' });

      if (!fromAccount || !toAccount) {
        return sendError(res, 'ACCOUNT_NOT_FOUND', 'Source or destination conversion account not found', 404);
      }

      if (fromAccount.currency === toAccount.currency) {
        return sendError(res, 'IDENTICAL_CURRENCY', 'Cannot swap between identical currencies', 400);
      }

      // Calculate authoritative quote
      const quote = await FxService.getQuote(fromAccount.currency, toAccount.currency, fromAmountMinorUnits);

      // System Ledger Accounts
      const feeRevenueAcc = await getOrCreateSystemAccount(
        `4001-FX-FEE-REVENUE-${fromAccount.currency}`,
        `Bank of Maldives FX Fee Revenue (${fromAccount.currency})`,
        'REVENUE',
        fromAccount.currency,
        'CREDIT',
        0
      );

      const fromVault = await getOrCreateSystemAccount(
        `1001-VAULT-${fromAccount.currency}`,
        `Bank of Maldives Vault Reserve (${fromAccount.currency})`,
        'ASSET',
        fromAccount.currency,
        'DEBIT',
        1000000000
      );

      const toVault = await getOrCreateSystemAccount(
        `1001-VAULT-${toAccount.currency}`,
        `Bank of Maldives Vault Reserve (${toAccount.currency})`,
        'ASSET',
        toAccount.currency,
        'DEBIT',
        1000000000
      );

      const user = await UserModel.findById(req.user?.id);

      const { journalEntry } = await LedgerService.postJournalEntry({
        idempotencyKey,
        referenceType: 'FX_SWAP',
        description: `Currency Swap ${fromAccount.currency} -> ${toAccount.currency} at rate ${quote.rate}`,
        metadata: {
          simulated: false,
          senderUserId: user?._id,
          exchangeRateUsed: quote.rate,
          notes: `Fee: ${quote.feeMinorUnits} (${quote.feeBps} bps)`
        },
        legs: [
          // Leg 1: Source Currency
          {
            ledgerAccountId: fromAccount.ledgerAccountId,
            direction: 'DEBIT' as const,
            amountMinorUnits: fromAmountMinorUnits,
            currency: fromAccount.currency
          },
          ...(quote.feeMinorUnits > 0 ? [{
            ledgerAccountId: feeRevenueAcc._id,
            direction: 'CREDIT' as const,
            amountMinorUnits: quote.feeMinorUnits,
            currency: fromAccount.currency
          }] : []),
          {
            ledgerAccountId: fromVault._id,
            direction: 'CREDIT' as const,
            amountMinorUnits: quote.netFromMinorUnits,
            currency: fromAccount.currency
          },
          // Leg 2: Destination Currency
          {
            ledgerAccountId: toVault._id,
            direction: 'DEBIT' as const,
            amountMinorUnits: quote.toAmountMinorUnits,
            currency: toAccount.currency
          },
          {
            ledgerAccountId: toAccount.ledgerAccountId,
            direction: 'CREDIT' as const,
            amountMinorUnits: quote.toAmountMinorUnits,
            currency: toAccount.currency
          }
        ]
      });

      return sendSuccess(res, {
        entryNumber: journalEntry.entryNumber,
        fromCurrency: fromAccount.currency,
        toCurrency: toAccount.currency,
        debitedMinorUnits: fromAmountMinorUnits,
        debitedFormatted: formatMinorUnits(fromAmountMinorUnits, fromAccount.currency),
        creditedMinorUnits: quote.toAmountMinorUnits,
        creditedFormatted: formatMinorUnits(quote.toAmountMinorUnits, toAccount.currency),
        appliedRate: quote.rate,
        feeMinorUnits: quote.feeMinorUnits,
        feeFormatted: formatMinorUnits(quote.feeMinorUnits, fromAccount.currency),
        postedAt: journalEntry.postedAt.toISOString()
      });
    } catch (err: any) {
      const code = err.message.startsWith('INSUFFICIENT_FUNDS') ? 'INSUFFICIENT_FUNDS' : 'SWAP_FAILED';
      return sendError(res, code, err.message, 400);
    }
  }

  static async getReceipt(req: AuthenticatedRequest, res: Response) {
    try {
      const { entryNumber } = req.params;
      const journalEntry = await JournalEntryModel.findOne({ entryNumber });
      if (!journalEntry) {
        return sendError(res, 'RECEIPT_NOT_FOUND', 'Receipt transaction not found', 404);
      }

      const lines = await LedgerLineModel.find({ journalEntryId: journalEntry._id });

      const populatedLines = await Promise.all(
        lines.map(async (l) => {
          const ledgerAcc = await LedgerAccountModel.findById(l.ledgerAccountId);
          return {
            accountCode: ledgerAcc?.code,
            accountName: ledgerAcc?.name,
            direction: l.direction,
            amountMinorUnits: l.amountMinorUnits,
            amountFormatted: formatMinorUnits(l.amountMinorUnits, l.currency),
            currency: l.currency,
            balanceAfterFormatted: ledgerAcc ? formatMinorUnits(l.accountBalanceAfter, l.currency) : undefined
          };
        })
      );

      const hash = generateReceiptHash({
        entryNumber: journalEntry.entryNumber,
        sourceAccount: journalEntry.metadata?.senderName || 'Bank of Maldives Reserve',
        destinationAccount: journalEntry.metadata?.recipientName || 'External',
        amountMinorUnits: lines[0]?.amountMinorUnits || 0,
        currency: lines[0]?.currency || 'USD',
        timestamp: journalEntry.postedAt.toISOString()
      });

      return sendSuccess(res, {
        entryNumber: journalEntry.entryNumber,
        description: journalEntry.description,
        referenceType: journalEntry.referenceType,
        status: journalEntry.status,
        postedAt: journalEntry.postedAt.toISOString(),
        metadata: journalEntry.metadata,
        lines: populatedLines,
        receiptFingerprintHex: hash,
        receiptHash: hash,
        disclaimer: 'OFFICIAL CLEARINGHOUSE TRANSACTION RECORD • BANK OF MALDIVES INTERNET BANKING'
      });
    } catch (err: any) {
      return sendError(res, 'RECEIPT_FETCH_FAILED', err.message, 500);
    }
  }
}
