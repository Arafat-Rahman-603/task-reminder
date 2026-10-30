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
      failedAttempts?: number;
      lockedUntil?: Date | null;
    };
    sectionSecurity?: {
      isInitialized?: boolean;
      passwordHash?: string;
      lockedSections?: string[];
      maxFailedAttempts?: number;
      lockoutDurationSeconds?: number;
    };
    appLockSettings?: {
      isEnabled: boolean;
      authMethod: 'password' | 'biometric' | 'both';
      timeoutMinutes: number;
      lockOnBackground: boolean;
      requireBiometricWithoutFallback?: boolean;
      strictSharedDeviceMode?: boolean;
      appLockPinHash?: string | null;
      hasCustomPin?: boolean;
    };
    biometricSettings?: {
      isEnabled: boolean;
      credentialId?: string;
      publicKey?: string;
      counter?: number;
      transports?: string[];
      enrolledAt?: Date;
      credentials?: Array<{
        credentialId: string;
        publicKey: string;
        deviceName?: string;
        counter?: number;
        transports?: string[];
        enrolledAt: Date;
      }>;
      requireForVault: boolean;
      requireForSections: boolean;
      requireForAppLock: boolean;
      allowPasswordFallback: boolean;
      strictSharedDeviceProtection: boolean;
    };
  };
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd?: Date;
  };
  isPlatformAdmin?: boolean;
  isSupportTeam?: boolean;
  isSuspended?: boolean;
  status?: "active" | "suspended";
  accountType?: "individual" | "team_owner";
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
  accountType: { type: String, enum: ["individual", "team_owner"], default: "individual" },
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
      vaultPasswordHash: { type: String },
      failedAttempts: { type: Number, default: 0 },
      lockedUntil: { type: Date, default: null }
    },
    sectionSecurity: {
      isInitialized: { type: Boolean, default: false },
      passwordHash: { type: String },
      lockedSections: { type: [String], default: [] },
      maxFailedAttempts: { type: Number, default: 5 },
      lockoutDurationSeconds: { type: Number, default: 30 }
    },
    appLockSettings: {
      isEnabled: { type: Boolean, default: false },
      authMethod: { type: String, enum: ['password', 'biometric', 'both'], default: 'password' },
      timeoutMinutes: { type: Number, default: 5 },
      lockOnBackground: { type: Boolean, default: true },
      requireBiometricWithoutFallback: { type: Boolean, default: false },
      strictSharedDeviceMode: { type: Boolean, default: false },
      appLockPinHash: { type: String, default: null }
    },
    biometricSettings: {
      isEnabled: { type: Boolean, default: false },
      credentialId: { type: String },
      publicKey: { type: String },
      counter: { type: Number, default: 0 },
      transports: { type: [String], default: [] },
      enrolledAt: { type: Date },
      credentials: [{
        credentialId: { type: String, required: true },
        publicKey: { type: String, required: true },
        deviceName: { type: String },
        counter: { type: Number, default: 0 },
        transports: { type: [String], default: [] },
        enrolledAt: { type: Date, default: Date.now },
      }],
      requireForVault: { type: Boolean, default: true },
      requireForSections: { type: Boolean, default: true },
      requireForAppLock: { type: Boolean, default: true },
      allowPasswordFallback: { type: Boolean, default: true },
      strictSharedDeviceProtection: { type: Boolean, default: false }
    }
  },
  subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' },
    currentPeriodEnd: { type: Date }
  },
  isPlatformAdmin: { type: Boolean, default: false },
  isSupportTeam: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "suspended"], default: "active" }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
