import { Schema, model, Document, Types } from 'mongoose';
import { SupportedCurrency, ALL_SUPPORTED_CURRENCIES } from '../../../shared/constants/currencies';

export interface IExchangeRate extends Document {
  _id: Types.ObjectId;
  pair: string; // e.g. "USD/EUR"
  from: string;
  to: string;
  rate: number; // e.g. 0.9200
  feeBps: number; // Basis points fee, e.g. 0 (0.00%)
  source?: string; // e.g. "LIVE_MARKET"
  lastUpdated: Date;
}

const ExchangeRateSchema = new Schema<IExchangeRate>(
  {
    pair: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    from: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    to: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    rate: {
      type: Number,
      required: true,
      min: 0.000001
    },
    feeBps: {
      type: Number,
      required: true,
      default: 0
    },
    source: {
      type: String,
      default: 'LIVE_MARKET'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const ExchangeRateModel = model<IExchangeRate>('ExchangeRate', ExchangeRateSchema);
