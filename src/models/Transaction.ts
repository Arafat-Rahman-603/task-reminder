import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  amount: mongoose.Types.Decimal128;
  currency: string;
  date: Date;
  accountId: Types.ObjectId;
  categoryId?: Types.ObjectId;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  transferId?: Types.ObjectId; // Links the two sides of a transfer
  tags: string[];
  receiptUrl?: string;
  receiptPublicId?: string;
  attachments?: {
    url: string;
    publicId: string;
    resourceType?: string;
    originalFilename?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  currency: { type: String, default: 'BDT' },
  date: { type: Date, required: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['income', 'expense', 'transfer'], 
    required: true 
  },
  transferId: { type: Schema.Types.ObjectId },
  tags: { type: [String], default: [] },
  receiptUrl: { type: String },
  receiptPublicId: { type: String },
  attachments: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String },
    originalFilename: { type: String }
  }],
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
