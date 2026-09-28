import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICustomSection extends Document {
  userId: Types.ObjectId;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  layout: 'list' | 'table' | 'kanban' | 'gallery';
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomSectionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  icon: { type: String },
  description: { type: String },
  layout: { type: String, enum: ['list', 'table', 'kanban', 'gallery'], default: 'list' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Ensure unique slug per user
CustomSectionSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.models.CustomSection || mongoose.model<ICustomSection>('CustomSection', CustomSectionSchema);
