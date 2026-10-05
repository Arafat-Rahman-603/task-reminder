import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRoutineItem {
  _id?: Types.ObjectId;
  title: string;
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
  remindAtStart?: boolean;
  remindAtEnd?: boolean;
  isCompleted?: boolean;
}

export interface IRoutine extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  schedule: string[]; // e.g. ['Monday', 'Tuesday'] or ['Daily']
  startDate?: Date;
  startTime?: string;
  endTime?: string;
  recurrence?: string;
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
  startDate: { type: Date },
  startTime: { type: String },
  endTime: { type: String },
  recurrence: { type: String },
  items: [{
    title: { type: String, required: true },
    durationMinutes: { type: Number },
    startTime: { type: String },
    endTime: { type: String },
    remindAtStart: { type: Boolean, default: false },
    remindAtEnd: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Routine || mongoose.model<IRoutine>('Routine', RoutineSchema);
