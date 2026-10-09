import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIdea extends Document {
  userId: Types.ObjectId; // Legacy
  workspaceId?: Types.ObjectId;
  title: string;
  description?: string;
  content?: string;
  status: 'Inbox' | 'Exploring' | 'Planned' | 'In Progress' | 'On Hold' | 'Completed' | 'Archived';
  priority: 'Low' | 'Medium' | 'High';
  tags: string[];
  slug: string;
  targetDate?: Date;
  attachments?: {
    url: string;
    publicId: string;
    resourceType?: string;
    originalFilename?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const IdeaSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String },
  status: { 
    type: String, 
    enum: ['Inbox', 'Exploring', 'Planned', 'In Progress', 'On Hold', 'Completed', 'Archived'], 
    default: 'Inbox' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Medium' 
  },
  tags: { type: [String], default: [] },
  targetDate: { type: Date },
  slug: { type: String, required: true, index: true },
  attachments: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String },
    originalFilename: { type: String }
  }],
}, { timestamps: true });

IdeaSchema.index({ workspaceId: 1, slug: 1 }, { unique: true, partialFilterExpression: { workspaceId: { $exists: true } } });

IdeaSchema.pre('save', async function () {
  if (this.isNew && !this.workspaceId && this.userId) {
    const { ensurePersonalWorkspace } = await import('@/lib/workspace');
    const ws = await ensurePersonalWorkspace(this.userId.toString());
    if (ws) {
      this.workspaceId = ws._id;
    }
  }
});

export default mongoose.models.Idea || mongoose.model<IIdea>('Idea', IdeaSchema);
