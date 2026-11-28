import mongoose, { Schema, Document, Model } from "mongoose";

export type OAuthTokenAuthMethod = "none" | "client_secret_post" | "client_secret_basic";

export interface IOAuthClient extends Document {
  clientId: string;
  clientSecretHash?: string | null;
  clientName: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: OAuthTokenAuthMethod;
  scope: string;
  clientUri?: string;
  logoUri?: string;
  registeredByIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OAuthClientSchema = new Schema<IOAuthClient>(
  {
    clientId: { type: String, required: true, unique: true, index: true },
    clientSecretHash: { type: String, default: null },
    clientName: { type: String, required: true, trim: true, maxlength: 120 },
    redirectUris: { type: [String], required: true },
    grantTypes: {
      type: [String],
      default: ["authorization_code", "refresh_token"],
    },
    responseTypes: { type: [String], default: ["code"] },
    tokenEndpointAuthMethod: {
      type: String,
      enum: ["none", "client_secret_post", "client_secret_basic"],
      default: "none",
    },
    scope: {
      type: String,
      default: "mcp:tools mcp:read mcp:write mcp:finance",
    },
    clientUri: { type: String },
    logoUri: { type: String },
    registeredByIp: { type: String },
  },
  { timestamps: true }
);

export const OAuthClient: Model<IOAuthClient> =
  mongoose.models.OAuthClient ||
  mongoose.model<IOAuthClient>("OAuthClient", OAuthClientSchema);
