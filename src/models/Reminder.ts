import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReminder extends Document {
  userId: Types.ObjectId;
  entityType: 'Task' | 'Event' | 'Habit' | 'Goal' | 'Subscription' | 'Document' | 'CustomRecord' | 'Routine' | 'Idea' | 'FinancialReminder';
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
    enum: ['Task', 'Event', 'Habit', 'Goal', 'Subscription', 'Document', 'CustomRecord', 'Routine', 'Idea', 'FinancialReminder'],
    required: true 
  },
  entityId: { type: Schema.Types.ObjectId, required: true },
  remindAt: { type: Date, required: true, index: true },
  repeatRule: { type: String },
  status: { type: String, enum: ['pending', 'processing', 'sent', 'dismissed'], default: 'pending' },
  notificationType: { type: String, enum: ['email', 'push', 'in-app'], default: 'in-app' },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Compound indexes for high-speed scheduler execution and user queries
ReminderSchema.index({ status: 1, remindAt: 1 });
ReminderSchema.index({ userId: 1, status: 1, remindAt: 1 });
ReminderSchema.index({ entityType: 1, entityId: 1, status: 1 });
ReminderSchema.index({ status: 1, updatedAt: 1 });

export default mongoose.models.Reminder || mongoose.model<IReminder>('Reminder', ReminderSchema);
