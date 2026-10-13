import { Schema, model, Document, Types } from 'mongoose';
import { SupportedCurrency, ALL_SUPPORTED_CURRENCIES } from '../shared/constants/currencies';

export interface IInstitution extends Document {
  _id: Types.ObjectId;
  name: string;
  bicSwift: string;
  routingNumber: string;
  country: string;
  supportedCurrencies: SupportedCurrency[];
  supportedRail: 'ACH' | 'WIRE' | 'SEPA' | 'FASTER_PAYMENTS' | 'ZENGIN' | 'NEFT' | 'RAAST' | 'RTGS' | 'SWIFT';
  networkStatus: 'ONLINE' | 'DEGRADED';
  isFictionalDisclaimer: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionSchema = new Schema<IInstitution>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    bicSwift: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    routingNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    country: {
      type: String,
      required: true,
      uppercase: true
    },
    supportedCurrencies: [{
      type: String,
      uppercase: true,
      trim: true
    }],
    supportedRail: {
      type: String,
      enum: ['ACH', 'WIRE', 'SEPA', 'FASTER_PAYMENTS', 'ZENGIN', 'NEFT', 'RAAST', 'RTGS', 'SWIFT'],
      required: true
    },
    networkStatus: {
      type: String,
      enum: ['ONLINE', 'DEGRADED'],
      default: 'ONLINE'
    },
    isFictionalDisclaimer: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const InstitutionModel = model<IInstitution>('Institution', InstitutionSchema);
