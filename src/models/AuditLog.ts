import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'IMPORT' | 'EXPORT' | 'SETTINGS_CHANGE';
  entityType: string; // e.g. "Transaction", "User", "Investment"
  entityId?: Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { 
    type: String, 
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'IMPORT', 'EXPORT', 'SETTINGS_CHANGE'],
    required: true
  },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String }
}, { timestamps: true });

// We often query logs by user and time
AuditLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
