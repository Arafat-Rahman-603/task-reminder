import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  name: string;
  provider?: string;
  amount: mongoose.Types.Decimal128;
  currency: string;
  frequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  nextBillingDate: Date;
  accountId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  autoRenew: boolean;
  status: 'Active' | 'Cancelled' | 'Paused';
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  provider: { type: String },
  amount: { type: Schema.Types.Decimal128, required: true },
  currency: { type: String, default: 'BDT' },
  frequency: { 
    type: String, 
    enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'],
    required: true
  },
  nextBillingDate: { type: Date, required: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  autoRenew: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['Active', 'Cancelled', 'Paused'], 
    default: 'Active' 
  },
}, { timestamps: true });

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
