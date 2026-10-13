import { Response } from 'express';
import { z } from 'zod';
import { BeneficiaryModel } from '../models/Beneficiary.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.util';
import { BeneficiaryDTO } from '../../../shared/types/account.types';
import { SupportedCurrency, ALL_SUPPORTED_CURRENCIES } from '../../../shared/constants/currencies';

const CreateBeneficiarySchema = z.object({
  name: z.string().min(2),
  type: z.enum(['INTERNAL_NEXAPAY', 'EXTERNAL_BANK']),
  identifier: z.string().min(3),
  routingOrBic: z.string().optional(),
  institutionName: z.string().optional(),
  currency: z.enum(ALL_SUPPORTED_CURRENCIES as [SupportedCurrency, ...SupportedCurrency[]])
});

export class BeneficiaryController {
  static async listBeneficiaries(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await BeneficiaryModel.find({ userId: req.user?.id }).sort({ createdAt: -1 });
      const dtos: BeneficiaryDTO[] = list.map((b) => ({
        id: b._id.toString(),
        userId: b.userId.toString(),
        name: b.name,
        type: b.type,
        identifier: b.identifier,
        routingOrBic: b.routingOrBic,
        institutionName: b.institutionName,
        currency: b.currency,
        createdAt: b.createdAt.toISOString()
      }));

      return sendSuccess(res, { beneficiaries: dtos });
    } catch (err: any) {
      return sendError(res, 'BENEFICIARIES_FETCH_FAILED', err.message, 500);
    }
  }

  static async createBeneficiary(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = CreateBeneficiarySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid beneficiary data', 400, parsed.error.format());
      }

      const existing = await BeneficiaryModel.findOne({
        userId: req.user?.id,
        identifier: parsed.data.identifier.trim()
      });

      if (existing) {
        return sendError(res, 'BENEFICIARY_EXISTS', 'Beneficiary with this identifier already saved', 409);
      }

      const created = await BeneficiaryModel.create({
        userId: req.user?.id,
        name: parsed.data.name.trim(),
        type: parsed.data.type,
        identifier: parsed.data.identifier.trim(),
        routingOrBic: parsed.data.routingOrBic?.trim(),
        institutionName: parsed.data.institutionName?.trim(),
        currency: parsed.data.currency
      });

      const dto: BeneficiaryDTO = {
        id: created._id.toString(),
        userId: created.userId.toString(),
        name: created.name,
        type: created.type,
        identifier: created.identifier,
        routingOrBic: created.routingOrBic,
        institutionName: created.institutionName,
        currency: created.currency,
        createdAt: created.createdAt.toISOString()
      };

      return sendSuccess(res, { beneficiary: dto }, 201);
    } catch (err: any) {
      return sendError(res, 'CREATE_BENEFICIARY_FAILED', err.message, 500);
    }
  }

  static async deleteBeneficiary(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await BeneficiaryModel.findOneAndDelete({
        _id: req.params.id,
        userId: req.user?.id
      });

      if (!result) {
        return sendError(res, 'NOT_FOUND', 'Beneficiary not found', 404);
      }

      return sendSuccess(res, { message: 'Beneficiary removed successfully' });
    } catch (err: any) {
      return sendError(res, 'DELETE_BENEFICIARY_FAILED', err.message, 500);
    }
  }
}
