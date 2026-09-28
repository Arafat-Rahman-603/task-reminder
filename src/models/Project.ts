import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';
  priority: 'Low' | 'Medium' | 'High';
  startDate?: Date;
  targetDate?: Date;
  color?: string;
  tags: string[];
  relatedGoalIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'], 
    default: 'Planning' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Medium' 
  },
  startDate: { type: Date },
  targetDate: { type: Date },
  color: { type: String },
  tags: { type: [String], default: [] },
  relatedGoalIds: [{ type: Schema.Types.ObjectId, ref: 'Goal' }],
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
