import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAsset extends Document {
  userId: Types.ObjectId;
  name: string;
  category: 'Real Estate' | 'Vehicle' | 'Collectibles' | 'Business' | 'Other';
  value: mongoose.Types.Decimal128;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Real Estate', 'Vehicle', 'Collectibles', 'Business', 'Other'],
    default: 'Other'
  },
  value: { type: Schema.Types.Decimal128, required: true },
  currency: { type: String, default: 'BDT' },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
