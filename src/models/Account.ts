import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAccount extends Document {
  userId: Types.ObjectId;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  currency: string;
  balance: mongoose.Types.Decimal128;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['checking', 'savings', 'credit', 'investment', 'cash'], 
    required: true 
  },
  currency: { type: String, default: 'BDT' },
  balance: { type: Schema.Types.Decimal128, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
