import mongoose, { Schema, Document, Types } from "mongoose";

export type RagEntityType =
  | "Task"
  | "Idea"
  | "Note"
  | "Routine"
  | "CustomRecord"
  | "Account"
  | "Transaction"
  | "FinancialReminder";

export interface IAiKnowledgeChunk extends Document {
  userId: Types.ObjectId;
  workspaceId?: Types.ObjectId | null;
  scopeType: "workspace" | "personal_finance";
  entityType: RagEntityType;
  entityId: Types.ObjectId;
  title: string;
  contentText: string;
  tokens: string[];
  vector: number[];
  denseEmbedding?: number[];
  metadata?: Record<string, unknown>;
  entityUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AiKnowledgeChunkSchema = new Schema<IAiKnowledgeChunk>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", default: null, index: true },
    scopeType: {
      type: String,
      enum: ["workspace", "personal_finance"],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: [
        "Task",
        "Idea",
        "Note",
        "Routine",
        "CustomRecord",
        "Account",
        "Transaction",
        "FinancialReminder",
      ],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    contentText: { type: String, required: true },
    tokens: { type: [String], default: [] },
    vector: { type: [Number], default: [] },
    denseEmbedding: { type: [Number], default: undefined },
    metadata: { type: Schema.Types.Mixed, default: {} },
    entityUpdatedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

AiKnowledgeChunkSchema.index({ userId: 1, entityType: 1, entityId: 1 }, { unique: true });
AiKnowledgeChunkSchema.index({ workspaceId: 1, scopeType: 1 });

export default mongoose.models.AiKnowledgeChunk ||
  mongoose.model<IAiKnowledgeChunk>("AiKnowledgeChunk", AiKnowledgeChunkSchema);
