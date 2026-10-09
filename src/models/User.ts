import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  passwordHash?: string;
  provider?: string;
  emailVerified?: Date;
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    theme: string;
    modules: Map<string, boolean>;
    taskSettings: {
      defaultView: string;
      defaultPriority: string;
      hideCompleted: boolean;
    };
    notificationSettings: {
      taskReminders: boolean;
      routineReminders: boolean;
    };
    vaultSettings?: {
      maxFailedAttempts: number;
      lockoutDurationSeconds: number;
      selfDestructAttempts?: number;
      isInitialized?: boolean;
      vaultPasswordHash?: string;
    };
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
  avatarUrl: { type: String },
  avatarPublicId: { type: String },
  passwordHash: { type: String },
  provider: { type: String, default: 'credentials' },
  emailVerified: { type: Date },
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'BDT' },
    theme: { type: String, default: 'system' },
    // Flexible map: supports any current or future module ID from SYSTEM_MODULES
    modules: { type: Map, of: Boolean, default: {} },
    taskSettings: {
      defaultView: { type: String, default: 'list' },
      defaultPriority: { type: String, default: 'Medium' },
      hideCompleted: { type: Boolean, default: false }
    },
    notificationSettings: {
      taskReminders: { type: Boolean, default: true },
      routineReminders: { type: Boolean, default: true }
    },
    vaultSettings: {
      maxFailedAttempts: { type: Number, default: 3 },
      lockoutDurationSeconds: { type: Number, default: 30 },
      selfDestructAttempts: { type: Number, default: 0 },
      isInitialized: { type: Boolean, default: false },
      vaultPasswordHash: { type: String }
    }
  },
  subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' },
    currentPeriodEnd: { type: Date }
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
