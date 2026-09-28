import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomRecord extends Document {
  userId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  // Dynamic fields payload based on the section's defined fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CustomRecordSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'CustomSection', required: true },
  data: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

CustomRecordSchema.index({ userId: 1, sectionId: 1 });

export default mongoose.models.CustomRecord || mongoose.model<ICustomRecord>('CustomRecord', CustomRecordSchema);
