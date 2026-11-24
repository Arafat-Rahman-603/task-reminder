import mongoose, { Schema, Document, Types } from "mongoose";

export type PlatformAiProviderId = "openrouter" | "gemini" | "openai" | "groq" | "custom";

export interface IPlatformAiConfig extends Document {
  key: string;
  activeProvider: PlatformAiProviderId;
  openrouterModel: string;
  openrouterFallbackModels: string[];
  encryptedOpenrouterApiKey?: string | null;
  geminiModel: string;
  geminiFallbackModels: string[];
  encryptedGeminiApiKey?: string | null;
  openaiModel: string;
  encryptedOpenaiApiKey?: string | null;
  groqModel: string;
  encryptedGroqApiKey?: string | null;
  customBaseUrl?: string;
  customModel?: string;
  encryptedCustomApiKey?: string | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformAiConfigSchema = new Schema<IPlatformAiConfig>(
  {
    key: { type: String, default: "default", unique: true, index: true },
    activeProvider: {
      type: String,
      enum: ["openrouter", "gemini", "openai", "groq", "custom"],
      default: "openrouter",
    },
    openrouterModel: { type: String, default: "openai/gpt-4o-mini" },
    openrouterFallbackModels: {
      type: [String],
      default: ["google/gemini-2.5-flash", "meta-llama/llama-3.3-70b-instruct"],
    },
    encryptedOpenrouterApiKey: { type: String, default: null },
    geminiModel: { type: String, default: "gemini-4-argon" },
    geminiFallbackModels: {
      type: [String],
      default: ["gemini-4-hydrogen", "gemini-3.5-flash-lite"],
    },
    encryptedGeminiApiKey: { type: String, default: null },
    openaiModel: { type: String, default: "gpt-4o-mini" },
    encryptedOpenaiApiKey: { type: String, default: null },
    groqModel: { type: String, default: "llama-3.3-70b-versatile" },
    encryptedGroqApiKey: { type: String, default: null },
    customBaseUrl: { type: String, default: "" },
    customModel: { type: String, default: "" },
    encryptedCustomApiKey: { type: String, default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.PlatformAiConfig ||
  mongoose.model<IPlatformAiConfig>("PlatformAiConfig", PlatformAiConfigSchema);
