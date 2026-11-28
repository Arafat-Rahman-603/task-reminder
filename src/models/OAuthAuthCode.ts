import mongoose, { Schema, Document, Model } from "mongoose";
import type { IMcpKeyScopes } from "@/models/McpApiKey";

export interface IOAuthAuthCode extends Document {
  codeHash: string;
  clientId: string;
  userId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  scopes: IMcpKeyScopes;
  scopeString: string;
  resource?: string;
  consumedAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OAuthAuthCodeSchema = new Schema<IOAuthAuthCode>(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    redirectUri: { type: String, required: true },
    codeChallenge: { type: String, required: true },
    codeChallengeMethod: {
      type: String,
      enum: ["S256"],
      default: "S256",
    },
    scopes: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: true },
      delete: { type: Boolean, default: false },
      finance: { type: Boolean, default: false },
    },
    scopeString: { type: String, required: true },
    resource: { type: String },
    consumedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export const OAuthAuthCode: Model<IOAuthAuthCode> =
  mongoose.models.OAuthAuthCode ||
  mongoose.model<IOAuthAuthCode>("OAuthAuthCode", OAuthAuthCodeSchema);
