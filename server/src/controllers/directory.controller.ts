import { Request, Response } from 'express';
import { InstitutionModel } from '../models/Institution.model';
import { sendSuccess, sendError } from '../utils/response.util';
import { InstitutionDTO } from '../shared/types/institution.types';

export class DirectoryController {
  static async searchInstitutions(req: Request, res: Response) {
    try {
      const q = (req.query.q as string || '').trim();
      const country = (req.query.country as string || '').trim().toUpperCase();
      const currency = (req.query.currency as string || '').trim().toUpperCase();
      const rail = (req.query.rail as string || '').trim().toUpperCase();

      const filter: any = {};
      if (country) filter.country = country;
      if (currency) filter.supportedCurrencies = currency;
      if (rail) filter.supportedRail = rail;

      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { routingNumber: { $regex: q, $options: 'i' } },
          { bicSwift: { $regex: q, $options: 'i' } }
        ];
      }

      const institutions = await InstitutionModel.find(filter).sort({ name: 1 });
      const dtos: InstitutionDTO[] = institutions.map((i) => ({
        id: i._id.toString(),
        name: i.name,
        bicSwift: i.bicSwift,
        routingNumber: i.routingNumber,
        country: i.country,
        supportedCurrencies: i.supportedCurrencies as any,
        supportedRail: i.supportedRail,
        networkStatus: i.networkStatus,
        isFictionalDisclaimer: i.isFictionalDisclaimer ?? false
      }));

      return sendSuccess(res, { institutions: dtos });
    } catch (err: any) {
      return sendError(res, 'DIRECTORY_SEARCH_FAILED', err.message, 500);
    }
  }

  static async createInstitution(req: Request, res: Response) {
    try {
      const { name, routingNumber, bicSwift, country, supportedCurrencies, supportedRail } = req.body;
      if (!name || !routingNumber) {
        return sendError(res, 'VALIDATION_ERROR', 'Bank name and routing/BIC number are required', 400);
      }

      const inst = await InstitutionModel.findOneAndUpdate(
        { routingNumber: routingNumber.trim() },
        {
          name: name.trim(),
          routingNumber: routingNumber.trim(),
          bicSwift: (bicSwift || routingNumber).trim().toUpperCase(),
          country: (country || 'GLOBAL').trim().toUpperCase(),
          supportedCurrencies: supportedCurrencies || ['USD', 'INR', 'PKR', 'EUR', 'GBP', 'AED', 'CAD', 'JPY'],
          supportedRail: supportedRail || 'WIRE',
          networkStatus: 'ONLINE',
          isFictionalDisclaimer: false
        },
        { upsert: true, new: true }
      );

      return sendSuccess(res, {
        institution: {
          id: inst._id.toString(),
          name: inst.name,
          routingNumber: inst.routingNumber,
          bicSwift: inst.bicSwift,
          country: inst.country,
          supportedCurrencies: inst.supportedCurrencies,
          supportedRail: inst.supportedRail,
          networkStatus: inst.networkStatus,
          isFictionalDisclaimer: false
        }
      }, 201);
    } catch (err: any) {
      return sendError(res, 'CREATE_INSTITUTION_FAILED', err.message, 500);
    }
  }
}
