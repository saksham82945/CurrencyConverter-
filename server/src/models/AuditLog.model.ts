import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actorUserId?: Types.ObjectId;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  userAgent?: string;
  changes?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    actorRole: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true
    },
    entityId: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String,
      required: true,
      default: '127.0.0.1'
    },
    userAgent: {
      type: String
    },
    changes: {
      type: Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const AuditLogModel = model<IAuditLog>('AuditLog', AuditLogSchema);
