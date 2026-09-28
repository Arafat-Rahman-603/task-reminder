import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvestmentTransaction extends Document {
  userId: Types.ObjectId;
  investmentId: Types.ObjectId;
  accountId?: Types.ObjectId; // The cash account used for this transaction
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'FEE' | 'SPLIT';
  quantity: mongoose.Types.Decimal128;
  unitPrice: mongoose.Types.Decimal128;
  fees: mongoose.Types.Decimal128;
  amount: mongoose.Types.Decimal128; // Total amount (quantity * unitPrice + fees for BUY)
  currency: string;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentTransactionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  investmentId: { type: Schema.Types.ObjectId, ref: 'Investment', required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
  type: { 
    type: String, 
    enum: ['BUY', 'SELL', 'DIVIDEND', 'FEE', 'SPLIT'],
    required: true
  },
  quantity: { type: Schema.Types.Decimal128, required: true },
  unitPrice: { type: Schema.Types.Decimal128, required: true },
  fees: { type: Schema.Types.Decimal128, default: 0 },
  amount: { type: Schema.Types.Decimal128, required: true },
  currency: { type: String, default: 'BDT' },
  date: { type: Date, required: true },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.models.InvestmentTransaction || mongoose.model<IInvestmentTransaction>('InvestmentTransaction', InvestmentTransactionSchema);
