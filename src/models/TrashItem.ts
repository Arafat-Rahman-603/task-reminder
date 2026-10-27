import mongoose, { Schema, Document, Types } from 'mongoose';

export type TrashEntityType = 
  | 'Task' 
  | 'Project' 
  | 'Routine' 
  | 'Habit' 
  | 'Note' 
  | 'NoteGroup' 
  | 'Idea' 
  | 'CalendarEvent' 
  | 'Document' 
  | 'CustomSection' 
  | 'CustomRecord' 
  | 'DashboardBlock' 
  | 'Transaction' 
  | 'Account' 
  | 'Debt' 
  | 'Investment' 
  | 'FinancialReminder' 
  | 'Invoice' 
  | 'VaultItem';

export interface ITrashAttachment {
  publicId: string;
  url?: string;
  resourceType?: string;
  originalFilename?: string;
  cleanupStatus?: 'pending' | 'deleted' | 'retained_shared' | 'failed';
  error?: string;
}

export interface ITrashItem extends Document {
  userId: Types.ObjectId;
  workspaceId?: Types.ObjectId;
  entityType: TrashEntityType;
  entityId: Types.ObjectId;
  title: string;
  module: string;
  deletedAt: Date;
  purgeAt: Date;
  deletedBy: Types.ObjectId;
  deletionBatchId?: string;
  parentId?: Types.ObjectId;
  parentType?: string;
  status: 'active' | 'purging' | 'restored' | 'purged' | 'failed';
  purgeAttempts?: number;
  lastPurgeError?: string;
  attachments?: ITrashAttachment[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TrashItemSchema = new Schema<ITrashItem>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  entityType: { 
    type: String, 
    required: true,
    enum: [
      'Task', 'Project', 'Routine', 'Habit', 'Note', 'NoteGroup', 'Idea',
      'CalendarEvent', 'Document', 'CustomSection', 'CustomRecord', 'DashboardBlock',
      'Transaction', 'Account', 'Debt', 'Investment', 'FinancialReminder', 'Invoice', 'VaultItem'
    ],
    index: true
  },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  title: { type: String, required: true },
  module: { type: String, required: true },
  deletedAt: { type: Date, required: true, default: Date.now, index: true },
  purgeAt: { type: Date, required: true, index: true },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deletionBatchId: { type: String, index: true },
  parentId: { type: Schema.Types.ObjectId },
  parentType: { type: String },
  status: { type: String, enum: ['active', 'purging', 'restored', 'purged', 'failed'], default: 'active', index: true },
  purgeAttempts: { type: Number, default: 0 },
  lastPurgeError: { type: String },
  attachments: [{
    publicId: { type: String, required: true },
    url: { type: String },
    resourceType: { type: String },
    originalFilename: { type: String },
    cleanupStatus: { 
      type: String, 
      enum: ['pending', 'deleted', 'retained_shared', 'failed'], 
      default: 'pending' 
    },
    error: { type: String }
  }],
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Compound indexes for fast multi-tenant queries and purge sweeps
TrashItemSchema.index({ userId: 1, status: 1, deletedAt: -1 });
TrashItemSchema.index({ workspaceId: 1, status: 1, deletedAt: -1 });
TrashItemSchema.index({ status: 1, purgeAt: 1 });

export default mongoose.models.TrashItem || mongoose.model<ITrashItem>('TrashItem', TrashItemSchema);
