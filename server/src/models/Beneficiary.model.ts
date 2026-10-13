import { Schema, model, Document, Types } from 'mongoose';
import { SupportedCurrency, ALL_SUPPORTED_CURRENCIES } from '../shared/constants/currencies';

export interface IBeneficiary extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: 'INTERNAL_NEXAPAY' | 'EXTERNAL_BANK';
  identifier: string; // email or account number
  routingOrBic?: string;
  institutionName?: string;
  currency: SupportedCurrency;
  createdAt: Date;
  updatedAt: Date;
}

const BeneficiarySchema = new Schema<IBeneficiary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['INTERNAL_NEXAPAY', 'EXTERNAL_BANK'],
      required: true
    },
    identifier: {
      type: String,
      required: true,
      trim: true
    },
    routingOrBic: {
      type: String,
      trim: true
    },
    institutionName: {
      type: String,
      trim: true
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

BeneficiarySchema.index({ userId: 1, identifier: 1 }, { unique: true });

export const BeneficiaryModel = model<IBeneficiary>('Beneficiary', BeneficiarySchema);
