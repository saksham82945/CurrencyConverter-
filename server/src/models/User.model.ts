import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, KycTier } from '../shared/types/account.types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  kycTier: KycTier;
  simulatedPinHash?: string;
  isFrozen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'COMPLIANCE'],
      default: 'USER',
      index: true
    },
    kycTier: {
      type: String,
      enum: ['TIER_1_SIMULATED', 'TIER_2_SIMULATED'],
      default: 'TIER_1_SIMULATED'
    },
    simulatedPinHash: {
      type: String,
      default: undefined
    },
    isFrozen: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const UserModel = model<IUser>('User', UserSchema);
