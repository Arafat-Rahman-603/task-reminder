import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  slug: string;
  userId: Types.ObjectId; // Creator / legacy owner
  workspaceId?: Types.ObjectId;
  assigneeId?: Types.ObjectId; // Assigned to user
  title: string;

  description?: string;
  notes?: string;
  status: 'Inbox' | 'Planned' | 'In Progress' | 'Completed' | 'Cancelled' | 'Backlog' | 'To Do' | 'In Review' | 'Done' | 'Blocked' | 'Problem/Error';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: Date;
  dueTime?: string;
  startDate?: Date;
  startTime?: string;
  completedAt?: Date;
  recurringSchedule?: string;
  projectId?: Types.ObjectId;
  relatedGoalId?: Types.ObjectId;
  tags: string[];
  attachments?: {
    url: string;
    publicId: string;
    resourceType?: string;
    originalFilename?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  slug: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['Inbox', 'Planned', 'In Progress', 'Completed', 'Cancelled', 'Backlog', 'To Do', 'In Review', 'Done', 'Blocked', 'Problem/Error'], 
    default: 'Backlog' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'], 
    default: 'Medium' 
  },
  dueDate: { type: Date },
  dueTime: { type: String },
  startDate: { type: Date },
  startTime: { type: String },
  completedAt: { type: Date },
  recurringSchedule: { type: String },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
  relatedGoalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
  tags: { type: [String], default: [] },
  attachments: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String },
    originalFilename: { type: String }
  }],
}, { timestamps: true });

// Ensure slug is unique per workspace
TaskSchema.index({ workspaceId: 1, slug: 1 }, { unique: true, partialFilterExpression: { workspaceId: { $exists: true } } });

TaskSchema.pre('save', async function () {
  if (this.isNew && !this.workspaceId && this.userId) {
    const { ensurePersonalWorkspace } = await import('@/lib/workspace');
    const ws = await ensurePersonalWorkspace(this.userId.toString());
    if (ws) {
      this.workspaceId = ws._id;
    }
  }
});

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
