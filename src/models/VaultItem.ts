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
  imageUrl?: string;
  imageId?: string;
  attachments?: {
    url: string;
    publicId: string;
    resourceType?: string;
    originalFilename?: string;
  }[];
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
  imageUrl: { type: String },
  imageId: { type: String },
  attachments: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String },
    originalFilename: { type: String }
  }],
}, {
  timestamps: true,
});

export default mongoose.models.VaultItem || mongoose.model<IVaultItem>('VaultItem', VaultItemSchema);

