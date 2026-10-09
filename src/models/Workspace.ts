import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWorkspace extends Document {
  name: string;
  type: "personal" | "team";
  ownerId: Types.ObjectId; // User ID of the actual creator/owner
  settings?: {
    workflowStatuses?: string[];
  };
  subscription?: {
    plan: string;
    status: string;
    limits?: any;
    currentPeriodEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["personal", "team"], required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    settings: {
      workflowStatuses: [{ type: String }],
    },
    subscription: {
      plan: { type: String, default: "free" },
      status: { type: String, default: "active" },
      limits: { type: Schema.Types.Mixed },
      currentPeriodEnd: { type: Date },
    },
  },
  { timestamps: true }
);

WorkspaceSchema.index(
  { ownerId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: "personal" } }
);

export default mongoose.models.Workspace || mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);
