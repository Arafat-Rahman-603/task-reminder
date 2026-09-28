import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  category: string;
  fileUrl: string; // Internal or S3 bucket URL
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
  title: { type: String, required: true },
  category: { type: String, default: 'Uncategorized' },
  fileUrl: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  expiryDate: { type: Date },
  notes: { type: String },
  tags: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
