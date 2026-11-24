import mongoose, { Schema, Types } from "mongoose";

export interface IAiExecutedAction {
  callId: string;
  name: string;
  mutability: "read" | "write" | "delete";
  ok: boolean;
  summary?: string;
  error?: string;
}

export interface IAiPendingCall {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  mutability: "read" | "write" | "delete";
  description: string;
}

export interface IAiMessage {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  executedActions: IAiExecutedAction[];
  pendingCalls: IAiPendingCall[];
  resolved: boolean;
  provider?: string;
  model?: string;
  ragSources: Array<{ entityType: string; title: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const AiMessageSchema = new Schema<IAiMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "AiConversation",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, default: "" },
    executedActions: {
      type: [
        {
          callId: String,
          name: String,
          mutability: { type: String, enum: ["read", "write", "delete"] },
          ok: Boolean,
          summary: String,
          error: String,
        },
      ],
      default: [],
    },
    pendingCalls: {
      type: [
        {
          callId: String,
          name: String,
          args: Schema.Types.Mixed,
          mutability: { type: String, enum: ["read", "write", "delete"] },
          description: String,
        },
      ],
      default: [],
    },
    resolved: { type: Boolean, default: true },
    provider: { type: String, default: undefined },
    model: { type: String, default: undefined },
    ragSources: {
      type: [
        {
          entityType: String,
          title: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

AiMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.AiMessage ||
  mongoose.model<IAiMessage>("AiMessage", AiMessageSchema);
