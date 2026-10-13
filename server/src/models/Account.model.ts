import { Schema, model, Document, Types } from 'mongoose';
import { SupportedCurrency, ALL_SUPPORTED_CURRENCIES } from '../shared/constants/currencies';
import { AccountType, AccountStatus } from '../shared/types/account.types';

export interface IAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accountNumber: string;
  routingNumber: string;
  currency: SupportedCurrency;
  accountType: AccountType;
  nickname: string;
  status: AccountStatus;
  ledgerAccountId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    routingNumber: {
      type: String,
      required: true,
      default: '026014887' // Bank of Maldives Routing Transit Number
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    accountType: {
      type: String,
      enum: ['CHECKING', 'SAVINGS'],
      default: 'CHECKING'
    },
    nickname: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FROZEN', 'CLOSED'],
      default: 'ACTIVE'
    },
    ledgerAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'LedgerAccount',
      required: true
    }
  },
  {
    timestamps: true
  }
);

AccountSchema.index({ userId: 1, currency: 1 });

export const AccountModel = model<IAccount>('Account', AccountSchema);
