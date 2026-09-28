import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  userId: Types.ObjectId;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  icon: { type: String },
  color: { type: String }
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
