import mongoose, { Document, Schema, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: "TASK_REMINDER" | "ROUTINE_REMINDER" | "BUDGET_ALERT" | "INVESTMENT_REMINDER" | "DAILY_SUMMARY" | "MORNING_SUMMARY" | "SYSTEM" | "CUSTOM_REMINDER" | "EVENT_REMINDER" | "HABIT_REMINDER" | "GOAL_REMINDER" | "SUBSCRIPTION_REMINDER" | "DOCUMENT_REMINDER" | "IDEA_REMINDER" | "WORKSPACE_INVITE" | "TASK_ASSIGNED" | "TASK_STATUS_CHANGED" | "TASK_COMMENT";
  title: string;
  body: string;
  url?: string;
  entityType?: "TASK" | "ROUTINE" | "BUDGET" | "INVESTMENT" | "SYSTEM" | "CUSTOMRECORD" | "EVENT" | "HABIT" | "GOAL" | "SUBSCRIPTION" | "DOCUMENT";
  entityId?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  status: "SCHEDULED" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["TASK_REMINDER", "ROUTINE_REMINDER", "BUDGET_ALERT", "INVESTMENT_REMINDER", "DAILY_SUMMARY", "MORNING_SUMMARY", "SYSTEM", "CUSTOM_REMINDER", "EVENT_REMINDER", "HABIT_REMINDER", "GOAL_REMINDER", "SUBSCRIPTION_REMINDER", "DOCUMENT_REMINDER", "IDEA_REMINDER", "WORKSPACE_INVITE", "TASK_ASSIGNED", "TASK_STATUS_CHANGED", "TASK_COMMENT"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    url: { type: String },
    entityType: {
      type: String,
      enum: ["TASK", "ROUTINE", "BUDGET", "INVESTMENT", "SYSTEM", "CUSTOMRECORD", "EVENT", "HABIT", "GOAL", "SUBSCRIPTION", "DOCUMENT"],
    },
    entityId: { type: String },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    status: {
      type: String,
      enum: ["SCHEDULED", "SENDING", "SENT", "FAILED", "CANCELLED"],
      default: "SCHEDULED",
    },
    metadata: { 
      type: Schema.Types.Mixed,
      default: {}
    },
  },
  { timestamps: true }
);

// Indexes
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ status: 1, scheduledAt: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });
NotificationSchema.index({ entityType: 1, entityId: 1, status: 1 }); // For duplicate prevention / cancellation
NotificationSchema.index({ userId: 1, "metadata.reminderId": 1 });
NotificationSchema.index({ userId: 1, "metadata.notificationId": 1 });
NotificationSchema.index({ userId: 1, "metadata.idempotencyKey": 1 }, { sparse: true });

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
