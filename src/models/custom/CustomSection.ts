import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICustomSection extends Document {
  userId: Types.ObjectId; // Legacy
  workspaceId?: Types.ObjectId;
  name: string;
  slug: string;
  group?: string;
  icon?: string;
  description?: string;
  layout: 'list' | 'table' | 'kanban' | 'gallery' | 'checklist' | 'tracker' | 'calendar' | 'database' | 'dashboard';
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomSectionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  group: { type: String },
  icon: { type: String },
  description: { type: String },
  layout: { 
    type: String, 
    enum: ['list', 'table', 'kanban', 'gallery', 'checklist', 'tracker', 'calendar', 'database', 'dashboard'], 
    default: 'list' 
  },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Ensure unique slug per user
CustomSectionSchema.index({ workspaceId: 1, slug: 1 }, { unique: true, partialFilterExpression: { workspaceId: { $exists: true } } });

CustomSectionSchema.pre('save', async function () {
  if (this.isNew && !this.workspaceId && this.userId) {
    const { ensurePersonalWorkspace } = await import('@/lib/workspace');
    const ws = await ensurePersonalWorkspace(this.userId.toString());
    if (ws) {
      this.workspaceId = ws._id;
    }
  }
});

export default mongoose.models.CustomSection || mongoose.model<ICustomSection>('CustomSection', CustomSectionSchema);
