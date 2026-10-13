import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserModel, IUser } from '../models/User.model';
import { AccountModel } from '../models/Account.model';
import { LedgerAccountModel } from '../models/LedgerAccount.model';
import { LedgerService } from './ledger.service';
import { ENV } from '../config/env';
import { UserDTO } from '../../../shared/types/account.types';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static async hashPin(pin: string): Promise<string> {
    return await bcrypt.hash(pin, 10);
  }

  static async comparePin(pin: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(pin, hash);
  }

  static generateAccessToken(user: IUser): string {
    return jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        kycTier: user.kycTier
      },
      ENV.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  static generateRefreshToken(user: IUser): string {
    return jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email
      },
      ENV.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  static verifyAccessToken(token: string): any {
    return jwt.verify(token, ENV.JWT_SECRET);
  }

  static verifyRefreshToken(token: string): any {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
  }

  static toDTO(user: IUser): UserDTO {
    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      kycTier: user.kycTier,
      hasSimulatedPin: !!user.simulatedPinHash,
      isFrozen: user.isFrozen,
      createdAt: user.createdAt.toISOString()
    };
  }

  /**
   * Automatically provision USD Checking and EUR Savings accounts for a new user
   * and credit a welcome $1,000.00 test deposit via double-entry ledger.
   */
  static async provisionDefaultAccounts(userId: Types.ObjectId, fullName: string) {
    // 1. Create USD Liability Ledger Account
    const usdAccNum = '770' + Math.floor(1000000 + Math.random() * 9000000).toString();
    const usdLedgerAcc = await LedgerAccountModel.create({
      code: `2001-CUST-USD-${usdAccNum}`,
      name: `${fullName} - USD Deposit Liability`,
      type: 'LIABILITY',
      currency: 'USD',
      isSystemAccount: false,
      normalBalance: 'CREDIT',
      balanceMinorUnits: 0
    });

    const usdAccount = await AccountModel.create({
      userId,
      accountNumber: usdAccNum,
      routingNumber: '026014887',
      currency: 'USD',
      accountType: 'CHECKING',
      nickname: 'Primary USD Checking',
      status: 'ACTIVE',
      ledgerAccountId: usdLedgerAcc._id
    });

    // 2. Create EUR Liability Ledger Account
    const eurAccNum = '771' + Math.floor(1000000 + Math.random() * 9000000).toString();
    const eurLedgerAcc = await LedgerAccountModel.create({
      code: `2002-CUST-EUR-${eurAccNum}`,
      name: `${fullName} - EUR Deposit Liability`,
      type: 'LIABILITY',
      currency: 'EUR',
      isSystemAccount: false,
      normalBalance: 'CREDIT',
      balanceMinorUnits: 0
    });

    await AccountModel.create({
      userId,
      accountNumber: eurAccNum,
      routingNumber: '026014887',
      currency: 'EUR',
      accountType: 'SAVINGS',
      nickname: 'EUR Savings',
      status: 'ACTIVE',
      ledgerAccountId: eurLedgerAcc._id
    });

    // 3. Find or create NexaPay System Vault and Promotional Expense accounts
    let vaultUsd = await LedgerAccountModel.findOne({ code: '1001-VAULT-USD' });
    if (!vaultUsd) {
      vaultUsd = await LedgerAccountModel.create({
        code: '1001-VAULT-USD',
        name: 'Bank of Maldives Simulated Vault Reserves (USD)',
        type: 'ASSET',
        currency: 'USD',
        isSystemAccount: true,
        normalBalance: 'DEBIT',
        balanceMinorUnits: 1000000000
      });

      await LedgerAccountModel.create({
        code: '3001-CAPITAL-USD',
        name: 'Bank of Maldives Simulated Capital & Reserves (USD)',
        type: 'EQUITY',
        currency: 'USD',
        isSystemAccount: true,
        normalBalance: 'CREDIT',
        balanceMinorUnits: 1000000000
      });
    }

    let faucetExpense = await LedgerAccountModel.findOne({ code: '5001-FAUCET-PROMOTION' });
    if (!faucetExpense) {
      faucetExpense = await LedgerAccountModel.create({
        code: '5001-FAUCET-PROMOTION',
        name: 'Simulated User Onboarding & Faucet Expense',
        type: 'EXPENSE',
        currency: 'USD',
        isSystemAccount: true,
        normalBalance: 'DEBIT',
        balanceMinorUnits: 0
      });
    }

    // 4. Balanced welcome liquidity injection: $1,000.00 (100,000 cents)
    // Debit Expense (or Vault) and Credit Customer Deposit Liability
    await LedgerService.postJournalEntry({
      referenceType: 'FAUCET_INJECTION',
      description: `Welcome bonus for new simulated user ${fullName}`,
      metadata: {
        simulated: true,
        recipientUserId: userId,
        recipientName: fullName,
        notes: 'Initial sandbox account funding'
      },
      legs: [
        {
          ledgerAccountId: vaultUsd._id,
          direction: 'DEBIT',
          amountMinorUnits: 100000,
          currency: 'USD'
        },
        {
          ledgerAccountId: usdLedgerAcc._id,
          direction: 'CREDIT',
          amountMinorUnits: 100000,
          currency: 'USD'
        }
      ]
    });

    return { usdAccount };
  }
}
