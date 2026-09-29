import mongoose, { Document, Schema, Types } from "mongoose";

export interface INotificationPreference extends Document {
  userId: Types.ObjectId;
  pushEnabled: boolean;
  taskReminders: boolean;
  routineReminders: boolean;
  budgetAlerts: boolean;
  investmentReminders: boolean;
  dailySummary: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    pushEnabled: { type: Boolean, default: false },
    taskReminders: { type: Boolean, default: true },
    routineReminders: { type: Boolean, default: true },
    budgetAlerts: { type: Boolean, default: true },
    investmentReminders: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: false },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: "22:00" },
      end: { type: String, default: "07:00" },
    },
    timezone: { type: String, default: "UTC" },
  },
  { timestamps: true }
);

// Indexes
NotificationPreferenceSchema.index({ userId: 1 });

export const NotificationPreference =
  mongoose.models.NotificationPreference ||
  mongoose.model<INotificationPreference>("NotificationPreference", NotificationPreferenceSchema);
