import mongoose, { Schema, Document, Types } from 'mongoose';
import { applySoftDeleteMiddleware } from '@/lib/soft-delete';

export interface INoteGroup extends Document {
  userId: Types.ObjectId; // Legacy
  workspaceId?: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  purgeAt?: Date | null;
  deletedBy?: Types.ObjectId;
  deletionBatchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteGroupSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
}, { timestamps: true });

NoteGroupSchema.index({ workspaceId: 1, slug: 1 }, { unique: true, partialFilterExpression: { workspaceId: { $exists: true } } });

NoteGroupSchema.pre('save', async function () {
  if (this.isNew && !this.workspaceId && this.userId) {
    const { ensurePersonalWorkspace } = await import('@/lib/workspace');
    const ws = await ensurePersonalWorkspace(this.userId.toString());
    if (ws) {
      this.workspaceId = ws._id;
    }
  }
});

applySoftDeleteMiddleware(NoteGroupSchema);

export default mongoose.models.NoteGroup || mongoose.model<INoteGroup>('NoteGroup', NoteGroupSchema);
