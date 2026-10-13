import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../models/User.model';
import { sendError } from '../utils/response.util';
import { UserRole } from '../../../shared/types/account.types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    kycTier: string;
  };
}

export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'UNAUTHORIZED', 'Missing or invalid authorization header', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = AuthService.verifyAccessToken(token);

    const user = await UserModel.findById(decoded.sub);
    if (!user || user.isFrozen) {
      return sendError(res, 'USER_SUSPENDED', 'Account not found or suspended in simulator', 403);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      kycTier: user.kycTier
    };

    next();
  } catch (err: any) {
    return sendError(res, 'INVALID_TOKEN', 'Session expired or token invalid', 401);
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions for this simulation action', 403);
    }
    next();
  };
}

export async function verifySimulatedPin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const pin = req.body.simulatedPin;
    if (!pin) {
      return sendError(res, 'PIN_REQUIRED', 'Simulated 4-digit PIN is required for this action', 400);
    }

    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
    }

    const user = await UserModel.findById(req.user.id);
    if (!user || !user.simulatedPinHash) {
      // If user has not set a PIN yet, allow "1234" as the default simulation PIN
      if (pin === '1234') {
        return next();
      }
      return sendError(res, 'INVALID_PIN', 'Incorrect simulated PIN (Default is 1234)', 400);
    }

    const isValid = await AuthService.comparePin(pin, user.simulatedPinHash);
    if (!isValid) {
      return sendError(res, 'INVALID_PIN', 'Incorrect simulated PIN', 400);
    }

    next();
  } catch (err: any) {
    return sendError(res, 'PIN_VERIFICATION_FAILED', err.message, 500);
  }
}
