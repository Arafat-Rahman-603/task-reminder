import mongoose, { Schema, Document } from "mongoose";

export interface IWorkspaceInvitation extends Document {
  workspaceId: mongoose.Types.ObjectId;
  tokenHash: string; // Hashed token for security
  email?: string; // Optional intended recipient email
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions?: Record<string, unknown>; // Granular module and action permissions
  expiresAt: Date;
  createdBy: mongoose.Types.ObjectId;
  maxUses?: number; // Optional: 1 for specific invites, more for general links
  uses: number;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  acceptedAt?: Date;
  acceptedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceInvitationSchema = new Schema<IWorkspaceInvitation>({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'member',
  },
  permissions: {
    type: Schema.Types.Mixed,
    default: null,
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
    default: 1,
  },
  uses: {
    type: Number,
    default: 0,
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true,
  },
  revokedAt: {
    type: Date,
  },
  revokedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  acceptedAt: {
    type: Date,
  },
  acceptedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Auto-delete expired invitations
WorkspaceInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.WorkspaceInvitation || mongoose.model<IWorkspaceInvitation>('WorkspaceInvitation', WorkspaceInvitationSchema);
