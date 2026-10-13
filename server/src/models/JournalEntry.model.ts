import { Schema, model, Document, Types } from 'mongoose';
import { JournalReferenceType, JournalStatus } from '../../../shared/types/ledger.types';

export interface IJournalEntry extends Document {
  _id: Types.ObjectId;
  entryNumber: string;
  idempotencyKey?: string;
  referenceType: JournalReferenceType;
  referenceId?: string;
  description: string;
  status: JournalStatus;
  metadata: {
    simulated?: boolean;
    senderUserId?: Types.ObjectId;
    senderName?: string;
    recipientUserId?: Types.ObjectId;
    recipientName?: string;
    exchangeRateUsed?: number;
    notes?: string;
    [key: string]: any;
  };
  postedAt: Date;
  createdAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    entryNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      index: true
    },
    referenceType: {
      type: String,
      enum: ['P2P_TRANSFER', 'EXTERNAL_TRANSFER', 'FX_SWAP', 'CARD_CHARGE', 'FAUCET_INJECTION', 'FEE'],
      required: true
    },
    referenceId: {
      type: String
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['POSTED', 'PENDING', 'REJECTED'],
      default: 'POSTED'
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    postedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Immutability protection: Prevent updating posted journal entries
JournalEntrySchema.pre('updateOne', function (next) {
  next(new Error('IMMUTABLE_RECORD: Journal entries cannot be updated. Create an offsetting entry.'));
});

JournalEntrySchema.pre('findOneAndUpdate', function (next) {
  next(new Error('IMMUTABLE_RECORD: Journal entries cannot be updated. Create an offsetting entry.'));
});

export const JournalEntryModel = model<IJournalEntry>('JournalEntry', JournalEntrySchema);
