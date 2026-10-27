import mongoose, { Schema, Document, Types } from 'mongoose';
import { applySoftDeleteMiddleware } from '@/lib/soft-delete';

export interface IAccount extends Document {
  userId: Types.ObjectId;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  currency: string;
  balance: mongoose.Types.Decimal128;
  lowBalanceThreshold?: mongoose.Types.Decimal128;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  purgeAt?: Date | null;
  deletedBy?: Types.ObjectId;
  deletionBatchId?: string;
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
  lowBalanceThreshold: { type: Schema.Types.Decimal128 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

AccountSchema.index({ userId: 1, isActive: 1 });

applySoftDeleteMiddleware(AccountSchema);

export default mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
