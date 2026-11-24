import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMcpKeyScopes {
  read: boolean;
  write: boolean;
  delete: boolean;
  finance: boolean;
}

export interface IMcpApiKey extends Document {
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: IMcpKeyScopes;
  isActive: boolean;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const McpApiKeySchema = new Schema<IMcpApiKey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    keyPrefix: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true, index: true },
    scopes: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: true },
      delete: { type: Boolean, default: false },
      finance: { type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: true, index: true },
    lastUsedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

McpApiKeySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.McpApiKey ||
  mongoose.model<IMcpApiKey>("McpApiKey", McpApiKeySchema);
