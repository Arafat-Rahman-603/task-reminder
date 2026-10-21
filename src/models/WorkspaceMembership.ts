import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWorkspaceMembership extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "owner" | "admin" | "member" | "viewer";
  customRoleId?: Types.ObjectId;
  customRoleName?: string;
  permissions?: Record<string, unknown>;
  status: "active" | "suspended";
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceMembershipSchema: Schema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  role: { type: String, enum: ["owner", "admin", "member", "viewer"], required: true, default: "member" },
  customRoleId: { type: Schema.Types.ObjectId, ref: "WorkspaceRole", default: null, index: true },
  customRoleName: { type: String, default: null },
  permissions: { type: Schema.Types.Mixed, default: null },
  status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

WorkspaceMembershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export default mongoose.models.WorkspaceMembership || mongoose.model<IWorkspaceMembership>("WorkspaceMembership", WorkspaceMembershipSchema);
