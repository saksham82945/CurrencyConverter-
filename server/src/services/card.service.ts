import { Types } from 'mongoose';
import { CardModel, ICard } from '../models/Card.model';
import { AccountModel } from '../models/Account.model';
import { LedgerAccountModel } from '../models/LedgerAccount.model';
import { LedgerService } from './ledger.service';
import { VirtualCardDTO } from '../shared/types/account.types';

export class CardService {
  /**
   * Issue a new virtual debit card for an account
   */
  static async issueCard(params: {
    userId: Types.ObjectId | string;
    accountId: Types.ObjectId | string;
    cardholderName: string;
    brand?: 'VISA' | 'MASTERCARD';
    spendingLimitMonthlyMinorUnits?: number;
  }): Promise<ICard> {
    if (!Types.ObjectId.isValid(params.accountId)) {
      throw new Error('ACCOUNT_NOT_FOUND: Target account for card issuance does not exist or is invalid.');
    }

    const account = await AccountModel.findOne({
      _id: params.accountId,
      userId: params.userId,
      status: 'ACTIVE'
    });
    if (!account) {
      throw new Error('ACCOUNT_NOT_FOUND: Target account for card issuance does not exist or is not active.');
    }

    // Generate simulated PAN
    const prefix = params.brand === 'MASTERCARD' ? '5412' : '4912';
    const middle = Math.floor(10000000 + Math.random() * 90000000).toString();
    const lastFour = Math.floor(1000 + Math.random() * 9000).toString();
    const fullPan = `${prefix}${middle}${lastFour}`;
    const maskedPan = `•••• •••• •••• ${lastFour}`;
    const cvv = Math.floor(100 + Math.random() * 900).toString();

    const currentYear = new Date().getFullYear();
    const expiryYear = currentYear + 4;
    const expiryMonth = Math.floor(1 + Math.random() * 12);

    return await CardModel.create({
      userId: new Types.ObjectId(params.userId),
      accountId: account._id,
      brand: params.brand || 'VISA',
      cardholderName: params.cardholderName,
      lastFour,
      maskedPan,
      fullPan,
      cvv,
      expiryMonth,
      expiryYear,
      spendingLimitMonthlyMinorUnits: params.spendingLimitMonthlyMinorUnits || 100000,
      spentCurrentMonthMinorUnits: 0,
      status: 'ACTIVE'
    });
  }

  /**
   * Simulate a POS charge at a merchant terminal
   */
  static async simulatePosCharge(params: {
    cardId: string;
    merchantName: string;
    amountMinorUnits: number;
    idempotencyKey?: string;
  }): Promise<{
    approved: boolean;
    reason?: string;
    card: ICard;
    remainingMonthlyLimitMinorUnits: number;
  }> {
    if (!Types.ObjectId.isValid(params.cardId)) {
      throw new Error('CARD_NOT_FOUND: Virtual card not found.');
    }
    const card = await CardModel.findById(params.cardId);
    if (!card) {
      throw new Error('CARD_NOT_FOUND: Virtual card not found.');
    }

    if (card.status === 'FROZEN') {
      return {
        approved: false,
        reason: 'CARD_FROZEN: This virtual card is currently locked by the cardholder.',
        card,
        remainingMonthlyLimitMinorUnits: card.spendingLimitMonthlyMinorUnits - card.spentCurrentMonthMinorUnits
      };
    }

    if (card.status === 'TERMINATED') {
      return {
        approved: false,
        reason: 'CARD_TERMINATED: This virtual card has been permanently closed.',
        card,
        remainingMonthlyLimitMinorUnits: 0
      };
    }

    // Check monthly limit
    const projectedSpend = card.spentCurrentMonthMinorUnits + params.amountMinorUnits;
    if (projectedSpend > card.spendingLimitMonthlyMinorUnits) {
      return {
        approved: false,
        reason: `SPEND_LIMIT_EXCEEDED: Charge would exceed monthly limit of ${card.spendingLimitMonthlyMinorUnits} minor units.`,
        card,
        remainingMonthlyLimitMinorUnits: card.spendingLimitMonthlyMinorUnits - card.spentCurrentMonthMinorUnits
      };
    }

    const account = await AccountModel.findById(card.accountId);
    if (!account) {
      throw new Error('LINKED_ACCOUNT_NOT_FOUND: The funding account for this card was not found.');
    }

    // Bank of Maldives Merchant Settlement Liability
    let merchantClearing = await LedgerAccountModel.findOne({ 
      code: `2100-MERCHANT-PAYABLE-${account.currency}` 
    });
    if (!merchantClearing) {
      merchantClearing = await LedgerAccountModel.create({
        code: `2100-MERCHANT-PAYABLE-${account.currency}`,
        name: `Bank of Maldives Merchant Settlement Payable (${account.currency})`,
        type: 'LIABILITY',
        currency: account.currency,
        isSystemAccount: true,
        normalBalance: 'CREDIT',
        balanceMinorUnits: 0
      });
    }

    // Execute atomic double-entry debit from customer account
    await LedgerService.postJournalEntry({
      idempotencyKey: params.idempotencyKey,
      referenceType: 'CARD_CHARGE',
      referenceId: card._id.toString(),
      description: `POS Simulated Debit at ${params.merchantName} (Card ending in ${card.lastFour})`,
      metadata: {
        simulated: true,
        senderUserId: card.userId,
        notes: `Simulated Merchant: ${params.merchantName}`
      },
      legs: [
        {
          ledgerAccountId: account.ledgerAccountId,
          direction: 'DEBIT', // customer liability decreases
          amountMinorUnits: params.amountMinorUnits,
          currency: account.currency
        },
        {
          ledgerAccountId: merchantClearing._id,
          direction: 'CREDIT', // asset clearing credit
          amountMinorUnits: params.amountMinorUnits,
          currency: account.currency
        }
      ]
    });

    // Update card spend
    card.spentCurrentMonthMinorUnits += params.amountMinorUnits;
    await card.save();

    return {
      approved: true,
      card,
      remainingMonthlyLimitMinorUnits: card.spendingLimitMonthlyMinorUnits - card.spentCurrentMonthMinorUnits
    };
  }

  static toDTO(card: ICard, revealFullPan = false): VirtualCardDTO {
    return {
      id: card._id.toString(),
      userId: card.userId.toString(),
      accountId: card.accountId.toString(),
      cardType: 'VIRTUAL_DEBIT',
      brand: card.brand,
      cardholderName: card.cardholderName,
      lastFour: card.lastFour,
      maskedPan: card.maskedPan,
      fullPan: revealFullPan ? card.fullPan : undefined,
      cvv: card.cvv,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      spendingLimitMonthlyMinorUnits: card.spendingLimitMonthlyMinorUnits,
      spentCurrentMonthMinorUnits: card.spentCurrentMonthMinorUnits,
      status: card.status,
      createdAt: card.createdAt.toISOString()
    };
  }
}
