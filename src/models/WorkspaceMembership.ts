import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWorkspaceMembership extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: Date;
}

const WorkspaceMembershipSchema: Schema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["owner", "admin", "member", "viewer"], required: true, default: "member" },
  joinedAt: { type: Date, default: Date.now },
});

WorkspaceMembershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export default mongoose.models.WorkspaceMembership || mongoose.model<IWorkspaceMembership>("WorkspaceMembership", WorkspaceMembershipSchema);
