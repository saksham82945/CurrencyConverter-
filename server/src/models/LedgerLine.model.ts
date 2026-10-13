import { Schema, model, Document, Types } from 'mongoose';
import { SupportedCurrency, ALL_SUPPORTED_CURRENCIES } from '../shared/constants/currencies';
import { EntryDirection } from '../shared/types/ledger.types';

export interface ILedgerLine extends Document {
  _id: Types.ObjectId;
  journalEntryId: Types.ObjectId;
  ledgerAccountId: Types.ObjectId;
  direction: EntryDirection;
  amountMinorUnits: number;
  currency: SupportedCurrency;
  accountBalanceAfter: number;
  createdAt: Date;
}

const LedgerLineSchema = new Schema<ILedgerLine>(
  {
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
      required: true,
      index: true
    },
    ledgerAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'LedgerAccount',
      required: true,
      index: true
    },
    direction: {
      type: String,
      enum: ['DEBIT', 'CREDIT'],
      required: true
    },
    amountMinorUnits: {
      type: Number,
      required: true,
      min: [1, 'Ledger line amount must be at least 1 minor unit'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be an integer minor unit'
      }
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    accountBalanceAfter: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be an integer'
      }
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Compound index for chronological ledger line history per account
LedgerLineSchema.index({ ledgerAccountId: 1, createdAt: -1 });

// Immutability protection
LedgerLineSchema.pre('updateOne', function (next) {
  next(new Error('IMMUTABLE_RECORD: Ledger lines cannot be modified.'));
});

LedgerLineSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('IMMUTABLE_RECORD: Ledger lines cannot be modified.'));
});

export const LedgerLineModel = model<ILedgerLine>('LedgerLine', LedgerLineSchema);
