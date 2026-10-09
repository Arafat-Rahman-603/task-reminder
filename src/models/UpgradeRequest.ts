import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUpgradeRequest extends Document {
  workspaceId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  requestedPlan: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UpgradeRequestSchema: Schema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedPlan: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.UpgradeRequest || mongoose.model<IUpgradeRequest>("UpgradeRequest", UpgradeRequestSchema);
