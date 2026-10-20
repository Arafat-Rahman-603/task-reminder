import mongoose, { Schema, Document } from "mongoose";

export interface ICustomizerConfig extends Document {
  key: string;
  basePrice: number;
  baseIncludedSections: number;
  pricePerSection: number;
  baseIncludedMembers: number;
  pricePerMember: number;
  baseIncludedStorageGB: number;
  pricePerGBStorage: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomizerConfigSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    basePrice: { type: Number, default: 4.99 },
    baseIncludedSections: { type: Number, default: 3 },
    pricePerSection: { type: Number, default: 0.40 },
    baseIncludedMembers: { type: Number, default: 1 },
    pricePerMember: { type: Number, default: 1.50 },
    baseIncludedStorageGB: { type: Number, default: 1 },
    pricePerGBStorage: { type: Number, default: 0.25 },
  },
  { timestamps: true }
);

export default mongoose.models.CustomizerConfig ||
  mongoose.model<ICustomizerConfig>("CustomizerConfig", CustomizerConfigSchema);
