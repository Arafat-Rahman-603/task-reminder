import mongoose, { Document, Schema, Types } from "mongoose";

export interface INotificationPreference extends Document {
  userId: Types.ObjectId;
  pushEnabled: boolean;
  taskReminders: boolean;
  routineReminders: boolean;
  dailyOverview?: {
    enabled: boolean;
    time: string; // HH:mm, default "00:00"
  };
  morningSummary?: {
    enabled: boolean;
    time: string; // HH:mm, default "07:00"
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  timezone: string;
  metadata?: {
    onesignalSubscriptionId?: string;
    onesignalExternalId?: string;
    lastSyncAt?: string;
  };
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
    dailyOverview: {
      enabled: { type: Boolean, default: true },
      time: { type: String, default: "00:00" },
    },
    morningSummary: {
      enabled: { type: Boolean, default: true },
      time: { type: String, default: "07:00" },
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: "22:00" },
      end: { type: String, default: "07:00" },
    },
    timezone: { type: String, default: "UTC" },
    metadata: {
      onesignalSubscriptionId: { type: String },
      onesignalExternalId: { type: String },
      lastSyncAt: { type: String },
    },
  },
  { timestamps: true }
);

// Indexes (userId unique index defined above in schema)

export const NotificationPreference =
  mongoose.models.NotificationPreference ||
  mongoose.model<INotificationPreference>("NotificationPreference", NotificationPreferenceSchema);
