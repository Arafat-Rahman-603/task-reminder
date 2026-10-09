import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INoteGroup extends Document {
  userId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteGroupSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
}, { timestamps: true });

NoteGroupSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.models.NoteGroup || mongoose.model<INoteGroup>('NoteGroup', NoteGroupSchema);
