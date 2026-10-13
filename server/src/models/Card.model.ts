import { Schema, model, Document, Types } from 'mongoose';

export interface ICard extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  cardType: 'VIRTUAL_DEBIT';
  brand: 'VISA' | 'MASTERCARD';
  cardholderName: string;
  lastFour: string;
  maskedPan: string;
  fullPan: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
  spendingLimitMonthlyMinorUnits: number;
  spentCurrentMonthMinorUnits: number;
  status: 'ACTIVE' | 'FROZEN' | 'TERMINATED';
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true
    },
    cardType: {
      type: String,
      default: 'VIRTUAL_DEBIT'
    },
    brand: {
      type: String,
      enum: ['VISA', 'MASTERCARD'],
      default: 'VISA'
    },
    cardholderName: {
      type: String,
      required: true
    },
    lastFour: {
      type: String,
      required: true,
      index: true
    },
    maskedPan: {
      type: String,
      required: true
    },
    fullPan: {
      type: String,
      required: true
    },
    cvv: {
      type: String,
      required: true
    },
    expiryMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    expiryYear: {
      type: Number,
      required: true
    },
    spendingLimitMonthlyMinorUnits: {
      type: Number,
      required: true,
      default: 100000 // $1,000.00
    },
    spentCurrentMonthMinorUnits: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FROZEN', 'TERMINATED'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

export const CardModel = model<ICard>('Card', CardSchema);
