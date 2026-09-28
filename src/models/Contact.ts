import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContact extends Document {
  userId: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  tags: string[];
  notes?: string;
  importantDates: { title: string; date: Date }[];
  lastInteraction?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  company: { type: String },
  role: { type: String },
  tags: { type: [String], default: [] },
  notes: { type: String },
  importantDates: [{
    title: { type: String, required: true },
    date: { type: Date, required: true }
  }],
  lastInteraction: { type: Date }
}, { timestamps: true });

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
