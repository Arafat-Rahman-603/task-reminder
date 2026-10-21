import mongoose, { Schema, Document, Types } from "mongoose";
import { IWorkspacePermissions } from "@/lib/workspacePermissions";

export interface IWorkspaceRole extends Document {
  workspaceId: Types.ObjectId;
  name: string;
  description?: string;
  color: string;
  baseRole: "admin" | "member" | "viewer";
  permissions: IWorkspacePermissions;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceRoleSchema: Schema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    color: { 
      type: String, 
      enum: ["emerald", "blue", "purple", "amber", "rose", "cyan", "indigo", "slate"], 
      default: "emerald" 
    },
    baseRole: { 
      type: String, 
      enum: ["admin", "member", "viewer"], 
      required: true, 
      default: "member" 
    },
    permissions: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Unique role name per workspace
WorkspaceRoleSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export default mongoose.models.WorkspaceRole || mongoose.model<IWorkspaceRole>("WorkspaceRole", WorkspaceRoleSchema);
