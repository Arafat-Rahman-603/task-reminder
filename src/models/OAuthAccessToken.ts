import mongoose, { Schema, Document, Model } from "mongoose";
import type { IMcpKeyScopes } from "@/models/McpApiKey";

export interface IOAuthAccessToken extends Document {
  tokenHash: string;
  refreshTokenHash?: string | null;
  clientId: string;
  userId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  scopes: IMcpKeyScopes;
  scopeString: string;
  resource?: string;
  revokedAt?: Date | null;
  expiresAt: Date;
  refreshExpiresAt: Date;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OAuthAccessTokenSchema = new Schema<IOAuthAccessToken>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    refreshTokenHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: undefined,
    },
    clientId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    scopes: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: true },
      delete: { type: Boolean, default: false },
      finance: { type: Boolean, default: false },
    },
    scopeString: { type: String, required: true },
    resource: { type: String },
    revokedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: true },
    refreshExpiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const OAuthAccessToken: Model<IOAuthAccessToken> =
  mongoose.models.OAuthAccessToken ||
  mongoose.model<IOAuthAccessToken>("OAuthAccessToken", OAuthAccessTokenSchema);
