import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWorkspaceInvitation extends Document {
  workspaceId: mongoose.Types.ObjectId;
  tokenHash: string; // Hashed token for security
  role: 'owner' | 'admin' | 'member' | 'viewer';
  expiresAt: Date;
  createdBy: mongoose.Types.ObjectId;
  maxUses?: number; // Optional: 1 for specific invites, more for general links
  uses: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceInvitationSchema = new Schema<IWorkspaceInvitation>({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'member',
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  maxUses: {
    type: Number,
  },
  uses: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

// Auto-delete expired invitations
WorkspaceInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.WorkspaceInvitation || mongoose.model<IWorkspaceInvitation>('WorkspaceInvitation', WorkspaceInvitationSchema);
