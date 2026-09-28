import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICustomView extends Document {
  sectionId: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: 'table' | 'kanban' | 'gallery' | 'list';
  config: {
    groupByField?: Types.ObjectId; // For Kanban
    visibleFields: Types.ObjectId[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sorts: any[];
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomViewSchema: Schema = new Schema({
  sectionId: { type: Schema.Types.ObjectId, ref: 'CustomSection', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['table', 'kanban', 'gallery', 'list'], required: true },
  config: {
    groupByField: { type: Schema.Types.ObjectId, ref: 'CustomField' },
    visibleFields: [{ type: Schema.Types.ObjectId, ref: 'CustomField' }],
    filters: { type: Schema.Types.Mixed, default: [] },
    sorts: { type: Schema.Types.Mixed, default: [] },
  },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.CustomView || mongoose.model<ICustomView>('CustomView', CustomViewSchema);
