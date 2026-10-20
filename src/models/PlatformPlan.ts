import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformPlan extends Document {
  slug: string;
  name: string;
  price: string;
  priceNum: number;
  period: string;
  description: string;
  target: "individual" | "team" | "enterprise";
  maxMembers: number;
  maxCustomSections: number;
  maxStorageMB: number;
  featureLabels: string[];
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformPlanSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    priceNum: { type: Number, default: 0 },
    period: { type: String, default: "/mo" },
    description: { type: String, default: "" },
    target: {
      type: String,
      enum: ["individual", "team", "enterprise"],
      default: "individual",
    },
    maxMembers: { type: Number, default: 5 },
    maxCustomSections: { type: Number, default: 3 },
    maxStorageMB: { type: Number, default: 100 },
    featureLabels: { type: [String], default: [] },
    isCustom: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.PlatformPlan ||
  mongoose.model<IPlatformPlan>("PlatformPlan", PlatformPlanSchema);
