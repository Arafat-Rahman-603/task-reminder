import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  provider?: string;
  emailVerified?: Date;
  preferences: {
    currency: string;
    theme: string;
    modules: Map<string, boolean>;
  };
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  provider: { type: String, default: 'credentials' },
  emailVerified: { type: Date },
  preferences: {
    currency: { type: String, default: 'BDT' },
    theme: { type: String, default: 'system' },
    // Flexible map: supports any current or future module ID from SYSTEM_MODULES
    modules: { type: Map, of: Boolean, default: {} },
  },
  subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' },
    currentPeriodEnd: { type: Date }
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
