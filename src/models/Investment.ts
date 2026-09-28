import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvestment extends Document {
  userId: Types.ObjectId;
  assetName: string; // e.g., "AAPL" or "S&P 500 ETF"
  assetType: 'Stock' | 'Bond' | 'Crypto' | 'Mutual Fund' | 'ETF' | 'Other';
  // Holdings should ideally be calculated from InvestmentTransaction history. 
  // We keep these here for fast read caching, but they must be updated by transaction triggers.
  quantity: mongoose.Types.Decimal128;
  averageCost: mongoose.Types.Decimal128;
  currentPrice: mongoose.Types.Decimal128; 
  currency: string;
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

export default mongoose.models.Investment || mongoose.model<IInvestment>('Investment', InvestmentSchema);
