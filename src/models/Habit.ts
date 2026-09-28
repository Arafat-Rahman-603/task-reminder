import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHabitLog {
  date: Date;
  status: 'completed' | 'skipped' | 'failed';
  notes?: string;
}

export interface IHabit extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Custom';
  customDays?: number[]; // 0 = Sunday, 1 = Monday
  logs: IHabitLog[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  frequency: { 
    type: String, 
    enum: ['Daily', 'Weekly', 'Monthly', 'Custom'],
    default: 'Daily'
  },
  customDays: { type: [Number] },
  logs: [{
    date: { type: Date, required: true },
    status: { type: String, enum: ['completed', 'skipped', 'failed'], required: true },
    notes: { type: String }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Habit || mongoose.model<IHabit>('Habit', HabitSchema);
