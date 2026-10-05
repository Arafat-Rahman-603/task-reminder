import mongoose, { Document, Schema } from 'mongoose';

export interface IVaultItem extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  category: string;
  encryptedData: string;
  iv: string;
  salt: string;
  isCustomPassword?: boolean;
  customPasswordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaultItemSchema = new Schema<IVaultItem>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, default: 'Login' },
  encryptedData: { type: String, required: true },
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  isCustomPassword: { type: Boolean, default: false },
  customPasswordHash: { type: String },
}, {
  timestamps: true,
});

export default mongoose.models.VaultItem || mongoose.model<IVaultItem>('VaultItem', VaultItemSchema);
