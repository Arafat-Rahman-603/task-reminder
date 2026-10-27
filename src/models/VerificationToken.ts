import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationToken extends Document {
  email: string;
  token: string;
  type: 'verify' | 'reset' | 'vault_reset' | 'section_lock_reset' | 'webauthn_register_challenge' | 'webauthn_auth_challenge';
  expires: Date;
  attempts?: number;
  createdAt: Date;
}

const VerificationTokenSchema: Schema = new Schema({
  email: { type: String, required: true, index: true },
  token: { type: String, required: true },
  type: { type: String, enum: ['verify', 'reset', 'vault_reset', 'section_lock_reset', 'webauthn_register_challenge', 'webauthn_auth_challenge'], required: true },
  expires: { type: Date, required: true },
  attempts: { type: Number, default: 0 }
}, { timestamps: true });

// Compound index for querying active tokens
VerificationTokenSchema.index({ email: 1, type: 1 });
// Automatic TTL index to clean up expired tokens
VerificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.VerificationToken || mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);
