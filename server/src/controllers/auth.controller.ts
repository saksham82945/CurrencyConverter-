import { Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/User.model';
import { AuditLogModel } from '../models/AuditLog.model';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const PinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits')
});

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid registration parameters', 400, parsed.error.format());
      }

      const { fullName, email, password } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        return sendError(res, 'EMAIL_EXISTS', 'A demo user with this email already exists', 409);
      }

      const passwordHash = await AuthService.hashPassword(password);
      const user = await UserModel.create({
        fullName,
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
        kycTier: 'TIER_1_SIMULATED'
      });

      // Provision default USD & EUR accounts + $1,000.00 welcome bonus
      await AuthService.provisionDefaultAccounts(user._id, user.fullName);

      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      await AuditLogModel.create({
        actorUserId: user._id,
        actorRole: user.role,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user._id.toString(),
        ipAddress: req.ip || '127.0.0.1'
      });

      return sendSuccess(res, {
        user: AuthService.toDTO(user),
        accessToken
      }, 201);
    } catch (err: any) {
      return sendError(res, 'REGISTRATION_FAILED', err.message, 500);
    }
  }

  static async login(req: Request, res: Response) {
    try {
      // Force login authentication failure for testing
      const forceAuthFail: boolean = true;
      if (forceAuthFail) {
        return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid credentials format', 400);
      }

      const { email, password } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();
      let user = await UserModel.findOne({ email: normalizedEmail });
      if (!user) {
        if (normalizedEmail.endsWith('@bankofmaldives.com.mv')) {
          user = await UserModel.findOne({ email: normalizedEmail.replace('@bankofmaldives.com.mv', '@nexapay.test') });
        } else if (normalizedEmail.endsWith('@nexapay.test')) {
          user = await UserModel.findOne({ email: normalizedEmail.replace('@nexapay.test', '@bankofmaldives.com.mv') });
        }
      }
      if (!user) {
        return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      const isPasswordValid = await AuthService.comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return sendSuccess(res, {
        user: AuthService.toDTO(user),
        accessToken
      });
    } catch (err: any) {
      return sendError(res, 'LOGIN_FAILED', err.message, 500);
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return sendError(res, 'REFRESH_TOKEN_REQUIRED', 'Missing refresh token cookie', 401);
      }

      const decoded = AuthService.verifyRefreshToken(refreshToken);
      const user = await UserModel.findById(decoded.sub);
      if (!user || user.isFrozen) {
        return sendError(res, 'INVALID_USER', 'User account unavailable', 401);
      }

      const accessToken = AuthService.generateAccessToken(user);
      const newRefreshToken = AuthService.generateRefreshToken(user);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return sendSuccess(res, { accessToken, user: AuthService.toDTO(user) });
    } catch (err: any) {
      return sendError(res, 'TOKEN_REFRESH_FAILED', 'Invalid refresh token', 401);
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('refreshToken');
    return sendSuccess(res, { message: 'Logged out successfully' });
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    const user = await UserModel.findById(req.user?.id);
    if (!user) {
      return sendError(res, 'NOT_FOUND', 'User not found', 404);
    }
    return sendSuccess(res, { user: AuthService.toDTO(user) });
  }

  static async updatePin(req: AuthenticatedRequest, res: Response) {
    const parsed = PinSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'VALIDATION_ERROR', 'PIN must be exactly 4 digits', 400);
    }

    const pinHash = await AuthService.hashPin(parsed.data.pin);
    await UserModel.findByIdAndUpdate(req.user?.id, { simulatedPinHash: pinHash });

    return sendSuccess(res, { message: 'Simulated 4-digit PIN updated successfully' });
  }

  static async upgradeKyc(req: AuthenticatedRequest, res: Response) {
    const user = await UserModel.findByIdAndUpdate(
      req.user?.id,
      { kycTier: 'TIER_2_SIMULATED' },
      { new: true }
    );
    if (!user) return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);

    return sendSuccess(res, { 
      message: 'Upgraded to Tier 2 (Simulated Verified - $50,000/day limit)',
      user: AuthService.toDTO(user)
    });
  }
}
