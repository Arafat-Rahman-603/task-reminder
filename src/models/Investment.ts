import mongoose, { Schema, Document, Types } from 'mongoose';
import { applySoftDeleteMiddleware } from '@/lib/soft-delete';

export interface IInvestment extends Document {
  userId: Types.ObjectId;
  assetName: string; // e.g., "AAPL" or "S&P 500 ETF"
  assetType: 'Stock' | 'Bond' | 'Crypto' | 'Mutual Fund' | 'ETF' | 'Other';
  quantity: mongoose.Types.Decimal128;
  averageCost: mongoose.Types.Decimal128;
  currentPrice: mongoose.Types.Decimal128; 
  currency: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  purgeAt?: Date | null;
  deletedBy?: Types.ObjectId;
  deletionBatchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assetName: { type: String, required: true },
  assetType: { 
    type: String, 
    enum: ['Stock', 'Bond', 'Crypto', 'Mutual Fund', 'ETF', 'Other'],
    default: 'Stock'
  },
  quantity: { type: Schema.Types.Decimal128, default: 0 },
  averageCost: { type: Schema.Types.Decimal128, default: 0 },
  currentPrice: { type: Schema.Types.Decimal128, default: 0 },
  currency: { type: String, default: 'BDT' }
}, { timestamps: true });

applySoftDeleteMiddleware(InvestmentSchema);

export default mongoose.models.Investment || mongoose.model<IInvestment>('Investment', InvestmentSchema);
