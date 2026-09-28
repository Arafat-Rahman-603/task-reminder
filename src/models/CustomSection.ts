import mongoose, { Schema, Document } from 'mongoose';

export type FieldType = 'Text' | 'Long Text' | 'Number' | 'Currency' | 'Date' | 'Date & Time' | 'Checkbox' | 'Select' | 'Multi Select' | 'Email' | 'Phone' | 'URL' | 'Rating' | 'Status' | 'Relation' | 'File';

export type ViewType = 'Simple List' | 'Table' | 'Kanban' | 'Checklist' | 'Gallery' | 'Tracker' | 'Calendar' | 'Database' | 'Dashboard';

export interface ICustomSection extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  icon?: string;
  defaultView: ViewType;
  fields: {
    id: string;
    name: string;
    type: FieldType;
    required: boolean;
    options?: string[]; // For Select/Multi Select/Status
  }[];
  order: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomSectionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  icon: { type: String },
  defaultView: { type: String, default: 'Simple List' },
  fields: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    required: { type: Boolean, default: false },
    options: [{ type: String }]
  }],
  order: { type: Number, default: 0 },
  archived: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure slugs are unique per user
CustomSectionSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.models.CustomSection || mongoose.model<ICustomSection>('CustomSection', CustomSectionSchema);
