import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPushRegistration extends Document {
  userId: Types.ObjectId;
  fcmToken: string;
  userAgent?: string;
  platform?: string;
  isActive: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PushRegistrationSchema = new Schema<IPushRegistration>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fcmToken: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: { type: String },
    platform: { type: String },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PushRegistration =
  mongoose.models.PushRegistration ||
  mongoose.model<IPushRegistration>("PushRegistration", PushRegistrationSchema);
