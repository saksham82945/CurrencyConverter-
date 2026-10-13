import { Request, Response } from 'express';
import { z } from 'zod';
import { FxService } from '../services/fx.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { formatMinorUnits, SupportedCurrency, ALL_SUPPORTED_CURRENCIES } from '../../../shared/constants/currencies';

const QuoteSchema = z.object({
  from: z.string().min(3).max(10),
  to: z.string().min(3).max(10),
  amountMinorUnits: z.number().int().positive()
});

export class FxController {
  static async getRates(req: Request, res: Response) {
    try {
      const rates = await FxService.getAllRates();
      return sendSuccess(res, { rates });
    } catch (err: any) {
      return sendError(res, 'RATES_FETCH_FAILED', err.message, 500);
    }
  }

  static async getQuote(req: Request, res: Response) {
    try {
      const parsed = QuoteSchema.safeParse({
        from: req.query.from,
        to: req.query.to,
        amountMinorUnits: parseInt(req.query.amountMinorUnits as string, 10)
      });

      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid quote parameters', 400, parsed.error.format());
      }

      const { from, to, amountMinorUnits } = parsed.data;
      const quote = await FxService.getQuote(from, to, amountMinorUnits);

      return sendSuccess(res, {
        ...quote,
        appliedRate: quote.rate,
        fromCurrency: from,
        toCurrency: to,
        fromFormatted: formatMinorUnits(amountMinorUnits, from),
        fromAmountFormatted: formatMinorUnits(amountMinorUnits, from),
        toFormatted: formatMinorUnits(quote.toAmountMinorUnits, to),
        toAmountFormatted: formatMinorUnits(quote.toAmountMinorUnits, to),
        feeFormatted: formatMinorUnits(quote.feeMinorUnits, from)
      });
    } catch (err: any) {
      return sendError(res, 'QUOTE_FAILED', err.message, 400);
    }
  }

  static async getLiveRates(req: Request, res: Response) {
    try {
      const data = await FxService.getLiveRates();
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 'LIVE_RATES_FETCH_FAILED', err.message, 500);
    }
  }

  static async syncRates(req: Request, res: Response) {
    try {
      const result = await FxService.syncLiveRatesToDb();
      return sendSuccess(res, result);
    } catch (err: any) {
      return sendError(res, 'RATES_SYNC_FAILED', err.message, 500);
    }
  }
}

