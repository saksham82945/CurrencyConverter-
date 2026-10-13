import { Schema, model, Document, Types } from 'mongoose';
import { SupportedCurrency, ALL_SUPPORTED_CURRENCIES } from '../../../shared/constants/currencies';
import { LedgerAccountType, NormalBalance } from '../../../shared/types/ledger.types';

export interface ILedgerAccount extends Document {
  _id: Types.ObjectId;
  code: string;
  name: string;
  type: LedgerAccountType;
  currency: SupportedCurrency;
  isSystemAccount: boolean;
  normalBalance: NormalBalance;
  balanceMinorUnits: number;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerAccountSchema = new Schema<ILedgerAccount>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'],
      required: true,
      index: true
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    isSystemAccount: {
      type: Boolean,
      default: false
    },
    normalBalance: {
      type: String,
      enum: ['DEBIT', 'CREDIT'],
      required: true
    },
    balanceMinorUnits: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying accounts by currency and type
LedgerAccountSchema.index({ currency: 1, type: 1 });

export const LedgerAccountModel = model<ILedgerAccount>('LedgerAccount', LedgerAccountSchema);
