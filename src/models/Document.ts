import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDocument extends Document {
  userId: Types.ObjectId;
  workspaceId?: Types.ObjectId;
  title: string;
  category: string;
  fileUrl: string;
  publicId?: string;
  resourceType?: string;
  originalFilename?: string;
  mimeType: string;
  sizeBytes: number;
  expiryDate?: Date;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['General', 'Finance', 'Legal', 'Work', 'Personal', 'Medical', 'Other'],
    default: 'General' 
  },
  fileUrl: { type: String, required: true },
  publicId: { type: String },
  resourceType: { type: String, default: 'auto' },
  originalFilename: { type: String },
  mimeType: { type: String, default: 'application/octet-stream' },
  sizeBytes: { type: Number, required: true, default: 0 },
  expiryDate: { type: Date },
  notes: { type: String },
  tags: { type: [String], default: [] },
}, { timestamps: true });

// Index for quick queries
DocumentSchema.index({ userId: 1, category: 1 });
DocumentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
