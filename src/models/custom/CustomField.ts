import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICustomField extends Document {
  sectionId: Types.ObjectId;
  name: string;
  type: 'text' | 'longText' | 'number' | 'currency' | 'date' | 'dateTime' | 'checkbox' | 'select' | 'multiSelect' | 'email' | 'url' | 'status' | 'image' | 'images' | 'document' | 'documents';
  options?: string[]; // for select/multiSelect/status
  isRequired: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomFieldSchema: Schema = new Schema({
  sectionId: { type: Schema.Types.ObjectId, ref: 'CustomSection', required: true, index: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'longText', 'number', 'currency', 'date', 'dateTime', 'checkbox', 'select', 'multiSelect', 'email', 'url', 'status', 'image', 'images', 'document', 'documents'],
    required: true 
  },
  options: { type: [String] },
  isRequired: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.CustomField || mongoose.model<ICustomField>('CustomField', CustomFieldSchema);
