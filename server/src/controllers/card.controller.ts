import { Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { CardModel } from '../models/Card.model';
import { CardService } from '../services/card.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.util';

const IssueCardSchema = z.object({
  accountId: z.string(),
  cardholderName: z.string().min(2),
  brand: z.enum(['VISA', 'MASTERCARD']).default('VISA'),
  spendingLimitMonthlyMinorUnits: z.number().int().positive().default(100000)
});

const UpdateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'FROZEN', 'TERMINATED'])
});

const UpdateLimitsSchema = z.object({
  spendingLimitMonthlyMinorUnits: z.number().int().positive()
});

const SimulateChargeSchema = z.object({
  merchantName: z.string().min(2),
  amountMinorUnits: z.number().int().positive()
});

export class CardController {
  static async listCards(req: AuthenticatedRequest, res: Response) {
    try {
      const cards = await CardModel.find({ 
        userId: req.user?.id, 
        status: { $ne: 'TERMINATED' } 
      }).sort({ createdAt: -1 });

      const dtos = cards.map((c) => CardService.toDTO(c, false));
      return sendSuccess(res, { cards: dtos });
    } catch (err: any) {
      return sendError(res, 'CARDS_FETCH_FAILED', err.message, 500);
    }
  }

  static async issueCard(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = IssueCardSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid card issuance data', 400, parsed.error.format());
      }

      if (!Types.ObjectId.isValid(parsed.data.accountId)) {
        return sendError(res, 'ACCOUNT_NOT_FOUND', 'Target account for card issuance does not exist.', 404);
      }

      const card = await CardService.issueCard({
        userId: req.user!.id,
        accountId: parsed.data.accountId,
        cardholderName: parsed.data.cardholderName,
        brand: parsed.data.brand,
        spendingLimitMonthlyMinorUnits: parsed.data.spendingLimitMonthlyMinorUnits
      });

      return sendSuccess(res, { card: CardService.toDTO(card, true) }, 201);
    } catch (err: any) {
      const isNotFound = err.message?.startsWith('ACCOUNT_NOT_FOUND');
      return sendError(res, isNotFound ? 'ACCOUNT_NOT_FOUND' : 'CARD_ISSUE_FAILED', err.message, isNotFound ? 404 : 500);
    }
  }

  static async updateCardStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = UpdateStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid status', 400);
      }

      if (!Types.ObjectId.isValid(req.params.id as string)) {
        return sendError(res, 'CARD_NOT_FOUND', 'Card not found', 404);
      }

      const card = await CardModel.findOneAndUpdate(
        { _id: req.params.id, userId: req.user?.id },
        { status: parsed.data.status },
        { new: true }
      );

      if (!card) {
        return sendError(res, 'CARD_NOT_FOUND', 'Card not found', 404);
      }

      return sendSuccess(res, { card: CardService.toDTO(card, false) });
    } catch (err: any) {
      return sendError(res, 'CARD_STATUS_UPDATE_FAILED', err.message, 500);
    }
  }

  static async updateCardLimits(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = UpdateLimitsSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid limit', 400);
      }

      if (!Types.ObjectId.isValid(req.params.id as string)) {
        return sendError(res, 'CARD_NOT_FOUND', 'Card not found', 404);
      }

      const card = await CardModel.findOneAndUpdate(
        { _id: req.params.id, userId: req.user?.id },
        { spendingLimitMonthlyMinorUnits: parsed.data.spendingLimitMonthlyMinorUnits },
        { new: true }
      );

      if (!card) {
        return sendError(res, 'CARD_NOT_FOUND', 'Card not found', 404);
      }

      return sendSuccess(res, { card: CardService.toDTO(card, false) });
    } catch (err: any) {
      return sendError(res, 'CARD_LIMITS_UPDATE_FAILED', err.message, 500);
    }
  }

  static async revealPan(req: AuthenticatedRequest, res: Response) {
    try {
      if (!Types.ObjectId.isValid(req.params.id as string)) {
        return sendError(res, 'CARD_NOT_FOUND', 'Card not found', 404);
      }

      const card = await CardModel.findOne({ _id: req.params.id, userId: req.user?.id });
      if (!card) {
        return sendError(res, 'CARD_NOT_FOUND', 'Card not found', 404);
      }

      return sendSuccess(res, { fullPan: card.fullPan, cvv: card.cvv });
    } catch (err: any) {
      return sendError(res, 'REVEAL_PAN_FAILED', err.message, 500);
    }
  }

  static async simulatePosCharge(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = SimulateChargeSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid charge params', 400);
      }

      if (!Types.ObjectId.isValid(req.params.id as string)) {
        return sendError(res, 'CARD_NOT_FOUND', 'Virtual card not found', 404);
      }

      const idempotencyKey = req.headers['idempotency-key'] as string;

      const result = await CardService.simulatePosCharge({
        cardId: req.params.id as string,
        merchantName: parsed.data.merchantName,
        amountMinorUnits: parsed.data.amountMinorUnits,
        idempotencyKey
      });

      if (!result.approved) {
        return sendError(res, 'CHARGE_DECLINED', result.reason || 'Card charge declined', 402, {
          cardStatus: result.card.status,
          remainingLimit: result.remainingMonthlyLimitMinorUnits
        });
      }

      return sendSuccess(res, {
        approved: true,
        merchantName: parsed.data.merchantName,
        amountMinorUnits: parsed.data.amountMinorUnits,
        card: CardService.toDTO(result.card, false),
        remainingMonthlyLimitMinorUnits: result.remainingMonthlyLimitMinorUnits
      });
    } catch (err: any) {
      const isNotFound = err.message?.startsWith('CARD_NOT_FOUND') || err.message?.startsWith('LINKED_ACCOUNT_NOT_FOUND');
      const code = err.message.startsWith('INSUFFICIENT_FUNDS') ? 'INSUFFICIENT_FUNDS' : (isNotFound ? 'NOT_FOUND' : 'CHARGE_FAILED');
      return sendError(res, code, err.message, isNotFound ? 404 : 400);
    }
  }
}
