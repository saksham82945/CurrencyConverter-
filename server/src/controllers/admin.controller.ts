import { Response } from 'express';
import { LedgerService } from '../services/ledger.service';
import { AuditLogModel } from '../models/AuditLog.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.util';

export class AdminController {
  static async getTrialBalance(req: AuthenticatedRequest, res: Response) {
    try {
      const trialBalance = await LedgerService.getTrialBalance();
      return sendSuccess(res, { trialBalance });
    } catch (err: any) {
      return sendError(res, 'TRIAL_BALANCE_FAILED', err.message, 500);
    }
  }

  static async auditInvariants(req: AuthenticatedRequest, res: Response) {
    try {
      const auditResult = await LedgerService.auditLedgerInvariants();
      return sendSuccess(res, { audit: auditResult });
    } catch (err: any) {
      return sendError(res, 'AUDIT_FAILED', err.message, 500);
    }
  }

  static async listAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '50', 10);
      const skip = (page - 1) * limit;

      const total = await AuditLogModel.countDocuments();
      const logs = await AuditLogModel.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      return sendSuccess(res, {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err: any) {
      return sendError(res, 'LOGS_FETCH_FAILED', err.message, 500);
    }
  }
}
