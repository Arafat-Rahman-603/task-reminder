import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationToken extends Document {
  email: string;
  token: string;
  type: 'verify' | 'reset';
  expires: Date;
  createdAt: Date;
}

const VerificationTokenSchema: Schema = new Schema({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  type: { type: String, enum: ['verify', 'reset'], required: true },
  expires: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.models.VerificationToken || mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);
