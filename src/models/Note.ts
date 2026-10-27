import mongoose, { Schema, Document, Types } from 'mongoose';
import { applySoftDeleteMiddleware } from '@/lib/soft-delete';

export interface INoteField {
  _id?: Types.ObjectId;
  name: string;
  type: string;
  value: unknown;
}

export interface INote extends Document {
  userId: Types.ObjectId; // Legacy
  workspaceId?: Types.ObjectId;
  groupId: Types.ObjectId;
  title: string;
  slug: string;
  date?: Date;
  content?: string;
  visibility?: 'workspace' | 'private' | 'restricted';
  visibleToMembers?: Types.ObjectId[];
  editableBy?: 'workspace' | 'creator_only' | 'restricted';
  editableByMembers?: Types.ObjectId[];
  attachments?: { 
    url: string; 
    publicId: string; 
    resourceType?: string; 
    originalFilename?: string; 
  }[];
  customFields: INoteField[];
  isDeleted?: boolean;
  deletedAt?: Date | null;
  purgeAt?: Date | null;
  deletedBy?: Types.ObjectId;
  deletionBatchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteFieldSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  value: { type: Schema.Types.Mixed }
});

const NoteSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'NoteGroup', required: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  date: { type: Date },
  content: { type: String },
  visibility: { 
    type: String, 
    enum: ['workspace', 'private', 'restricted'], 
    default: 'workspace',
    index: true 
  },
  visibleToMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  editableBy: { 
    type: String, 
    enum: ['workspace', 'creator_only', 'restricted'], 
    default: 'workspace' 
  },
  editableByMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  attachments: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String },
    originalFilename: { type: String }
  }],
  customFields: [NoteFieldSchema]
}, { timestamps: true });

NoteSchema.index({ groupId: 1, slug: 1 }, { unique: true });

NoteSchema.pre('save', async function () {
  if (this.isNew && !this.workspaceId && this.userId) {
    const { ensurePersonalWorkspace } = await import('@/lib/workspace');
    const ws = await ensurePersonalWorkspace(this.userId.toString());
    if (ws) {
      this.workspaceId = ws._id;
    }
  }
});

applySoftDeleteMiddleware(NoteSchema);

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
