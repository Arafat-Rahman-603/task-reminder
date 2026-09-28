import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRoutineItem {
  _id?: Types.ObjectId;
  title: string;
  durationMinutes?: number;
}

export interface IRoutine extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  schedule: string[]; // e.g. ['Monday', 'Tuesday']
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  items: IRoutineItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  schedule: { type: [String], default: [] },
  timeOfDay: { 
    type: String, 
    enum: ['Morning', 'Afternoon', 'Evening', 'Night']
  },
  items: [{
    title: { type: String, required: true },
    durationMinutes: { type: Number }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Routine || mongoose.model<IRoutine>('Routine', RoutineSchema);
