import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISupportMessage {
  _id?: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  senderRole: "user" | "support" | "admin";
  message: string;
  attachments?: {
    url: string;
    publicId: string;
    resourceType?: string;
    originalFilename?: string;
  }[];
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  ticketNumber: string;
  userId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  subject: string;
  category: "billing" | "technical" | "account" | "feature_request" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  messages: ISupportMessage[];
  lastReplyAt: Date;
  userHasUnread?: boolean;
  staffHasUnread?: boolean;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ["user", "support", "admin"], required: true },
  message: { type: String, required: true },
  attachments: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      resourceType: { type: String },
      originalFilename: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const SupportTicketSchema: Schema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: ["billing", "technical", "account", "feature_request", "general"],
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    messages: [SupportMessageSchema],
    lastReplyAt: { type: Date, default: Date.now },
    userHasUnread: { type: Boolean, default: false, index: true },
    staffHasUnread: { type: Boolean, default: true, index: true },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

SupportTicketSchema.index({ status: 1, lastReplyAt: -1 });
SupportTicketSchema.index({ userId: 1, lastReplyAt: -1 });
SupportTicketSchema.index({ userId: 1, userHasUnread: 1 });
SupportTicketSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);
