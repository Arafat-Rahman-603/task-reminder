import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReminder extends Document {
  userId: Types.ObjectId;
  entityType: 'Task' | 'Event' | 'Habit' | 'Goal' | 'Subscription' | 'Document' | 'CustomRecord' | 'Routine' | 'Idea';
  entityId: Types.ObjectId;
  remindAt: Date;
  repeatRule?: string;
  status: 'pending' | 'processing' | 'sent' | 'dismissed';
  notificationType: 'email' | 'push' | 'in-app';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  entityType: { 
    type: String, 
    enum: ['Task', 'Event', 'Habit', 'Goal', 'Subscription', 'Document', 'CustomRecord', 'Routine', 'Idea'],
    required: true 
  },
  entityId: { type: Schema.Types.ObjectId, required: true },
  remindAt: { type: Date, required: true, index: true },
  repeatRule: { type: String },
  status: { type: String, enum: ['pending', 'processing', 'sent', 'dismissed'], default: 'pending' },
  notificationType: { type: String, enum: ['email', 'push', 'in-app'], default: 'in-app' },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.models.Reminder || mongoose.model<IReminder>('Reminder', ReminderSchema);
