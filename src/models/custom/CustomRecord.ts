import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICustomRecord extends Document {
  sectionId: Types.ObjectId;
  userId: Types.ObjectId; // Legacy
  workspaceId?: Types.ObjectId;
  title?: string;
  slug?: string;
  date?: Date;
  data: Map<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CustomRecordSchema: Schema = new Schema({
  sectionId: { type: Schema.Types.ObjectId, ref: 'CustomSection', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  title: { type: String },
  slug: { type: String, index: true },
  date: { type: Date },
  data: { type: Map, of: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

CustomRecordSchema.pre('save', async function () {
  if (this.isNew && !this.workspaceId && this.userId) {
    const { ensurePersonalWorkspace } = await import('@/lib/workspace');
    const ws = await ensurePersonalWorkspace(this.userId.toString());
    if (ws) {
      this.workspaceId = ws._id;
    }
  }
});

export default mongoose.models.CustomRecord || mongoose.model<ICustomRecord>('CustomRecord', CustomRecordSchema);
