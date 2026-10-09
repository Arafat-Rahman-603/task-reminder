import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  slug: string;
  userId: Types.ObjectId;
  title: string;
  description?: string;
  notes?: string;
  status: 'Inbox' | 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
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
  slug: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['Inbox', 'Planned', 'In Progress', 'Completed', 'Cancelled'], 
    default: 'Inbox' 
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

// Ensure slug is unique per user
TaskSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
