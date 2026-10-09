import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICustomRecord extends Document {
  sectionId: Types.ObjectId;
  userId: Types.ObjectId;
  title?: string;
  slug?: string;
  date?: Date;
  data: Map<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CustomRecordSchema: Schema = new Schema({
  sectionId: { type: Schema.Types.ObjectId, ref: 'CustomSection', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String },
  slug: { type: String, index: true },
  date: { type: Date },
  data: { type: Map, of: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.models.CustomRecord || mongoose.model<ICustomRecord>('CustomRecord', CustomRecordSchema);
