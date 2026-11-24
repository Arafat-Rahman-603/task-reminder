import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPendingApprovalState {
  messageId: string;
  pendingCalls: Array<{
    callId: string;
    name: string;
    args: Record<string, unknown>;
    mutability: "read" | "write" | "delete";
    description: string;
  }>;
  historySnapshot: Array<Record<string, unknown>>;
}

export interface IAiConversation extends Document {
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  title: string;
  summary: string;
  messageCount: number;
  lastMessageAt: Date;
  isPinned: boolean;
  pendingApprovalState?: IPendingApprovalState | null;
  createdAt: Date;
  updatedAt: Date;
}

const AiConversationSchema = new Schema<IAiConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    summary: { type: String, default: "" },
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    isPinned: { type: Boolean, default: false },
    pendingApprovalState: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

AiConversationSchema.index({ userId: 1, workspaceId: 1, isPinned: -1, lastMessageAt: -1 });

export default mongoose.models.AiConversation ||
  mongoose.model<IAiConversation>("AiConversation", AiConversationSchema);
