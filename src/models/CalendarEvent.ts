import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICalendarEvent extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  location?: string;
  recurrence?: string; // e.g. RRULE string
  relatedTaskId?: Types.ObjectId;
  relatedProjectId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  location: { type: String },
  recurrence: { type: String },
  relatedTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  relatedProjectId: { type: Schema.Types.ObjectId, ref: 'Project' },
}, { timestamps: true });

export default mongoose.models.CalendarEvent || mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
