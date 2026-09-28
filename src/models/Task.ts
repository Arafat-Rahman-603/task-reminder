import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: Date;
  projectId?: Types.ObjectId;
  relatedGoalId?: Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Medium' 
  },
  dueDate: { type: Date },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
  relatedGoalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
  tags: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
