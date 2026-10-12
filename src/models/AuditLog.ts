import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  workspaceId?: Types.ObjectId;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'IMPORT' | 'EXPORT' | 'SETTINGS_CHANGE' | 'INVITE_CREATE' | 'INVITE_REVOKE' | 'INVITE_ACCEPT' | 'MEMBER_ROLE_UPDATE' | 'MEMBER_REMOVE' | 'WORKSPACE_RENAME' | 'WORKSPACE_ARCHIVE' | 'WORKSPACE_DELETE';
  entityType: string; // e.g. "Transaction", "User", "Investment", "Workspace", "WorkspaceInvitation", "WorkspaceMembership"
  entityId?: Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  action: { 
    type: String, 
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'IMPORT', 'EXPORT', 'SETTINGS_CHANGE', 'INVITE_CREATE', 'INVITE_REVOKE', 'INVITE_ACCEPT', 'MEMBER_ROLE_UPDATE', 'MEMBER_REMOVE', 'WORKSPACE_RENAME', 'WORKSPACE_ARCHIVE', 'WORKSPACE_DELETE'],
    required: true
  },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String }
}, { timestamps: true });

// We often query logs by user/workspace and time
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ workspaceId: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
