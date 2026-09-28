import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGoal extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  targetDate?: Date;
  status: 'Not Started' | 'In Progress' | 'Achieved' | 'Abandoned';
  progress: number; // 0 to 100
  type: 'Personal' | 'Financial' | 'Health' | 'Career';
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  targetDate: { type: Date },
  status: { 
    type: String, 
    enum: ['Not Started', 'In Progress', 'Achieved', 'Abandoned'], 
    default: 'Not Started' 
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  type: { 
    type: String, 
    enum: ['Personal', 'Financial', 'Health', 'Career'],
    default: 'Personal'
  }
}, { timestamps: true });

export default mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);
