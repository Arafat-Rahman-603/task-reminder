import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';
import dbConnect from '@/lib/db';
import {
  signAuthGrant,
  verifyAuthGrant,
  verifyWebAuthnSignature,
  WebAuthnJWK,
} from '@/lib/webauthn';
import {
  getBiometricRegistrationChallenge,
  getBiometricAuthChallenge,
  verifyAccountPasswordForAppLock,
  updateAppLockSettings,
  updateBiometricSettings,
  removeBiometricCredential,
} from '@/actions/biometric.actions';
import { unlockVaultWithBiometrics } from '@/actions/vault.auth';
import { unlockSectionWithBiometrics } from '@/actions/sectionLock.actions';

// Mock next-auth
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: () => mockGetServerSession(),
}));

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('App Lock & Biometric Authentication Security Tests', () => {
  let testUser: any;
  const rawPassword = 'SecurePassword_123!';
  const testUserId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await dbConnect();
    await User.deleteMany({ email: 'applock-test@manageo.app' });
    await VerificationToken.deleteMany({ email: { $regex: 'applock-test@manageo.app' } });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    testUser = await User.create({
      _id: testUserId,
      name: 'AppLock Tester',
      email: 'applock-test@manageo.app',
      passwordHash,
      preferences: {
        appLockSettings: {
          isEnabled: false,
          authMethod: 'password',
          timeoutMinutes: 5,
          lockOnBackground: true,
          requireBiometricWithoutFallback: false,
          strictSharedDeviceMode: false,
        },
        biometricSettings: {
          isEnabled: false,
          requireForVault: true,
          requireForSections: true,
          requireForAppLock: true,
          allowPasswordFallback: true,
          strictSharedDeviceProtection: false,
        },
        vaultSettings: {
          isInitialized: true,
          masterPasswordHash: passwordHash,
        },
        sectionLockSettings: {
          isInitialized: true,
          passwordHash,
          lockedSections: ['money', 'investments'],
        },
      },
    });

    mockGetServerSession.mockResolvedValue({
      user: {
        id: testUser._id.toString(),
        email: testUser.email,
        name: testUser.name,
      },
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'applock-test@manageo.app' });
    await VerificationToken.deleteMany({ email: { $regex: 'applock-test@manageo.app' } });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe('1. App Lock Configuration & Account Password Unlock', () => {
    it('verifies correct account password for app unlock and generates a scoped grant token', async () => {
      const successResult = await verifyAccountPasswordForAppLock(rawPassword);
      expect(successResult.success).toBe(true);
      expect(successResult.grantToken).toBeDefined();

      // Verify the generated grant token is cryptographically valid
      const isValid = verifyAuthGrant(successResult.grantToken!, testUser._id.toString(), 'app_lock');
      expect(isValid).toBe(true);

      const failResult = await verifyAccountPasswordForAppLock('wrong-password-999');
      expect(failResult.success).toBe(false);
      expect(failResult.error).toContain('Incorrect Manageo account password');
    });

    it('updates App Lock settings successfully', async () => {
      const updateRes = await updateAppLockSettings({
        isEnabled: true,
        authMethod: 'biometric',
        timeoutMinutes: 10,
        lockOnBackground: true,
      });

      expect(updateRes.success).toBe(true);

      const refreshed = await User.findById(testUser._id).lean();
      expect(refreshed?.preferences?.appLockSettings?.isEnabled).toBe(true);
      expect(refreshed?.preferences?.appLockSettings?.authMethod).toBe('biometric');
      expect(refreshed?.preferences?.appLockSettings?.timeoutMinutes).toBe(10);
    });

    it('enforces strict biometric policy by rejecting password unlock when requireBiometricWithoutFallback is true', async () => {
      await updateAppLockSettings({ requireBiometricWithoutFallback: true });

      const res = await verifyAccountPasswordForAppLock(rawPassword);
      expect(res.success).toBe(false);
      expect(res.error).toContain('strictly requires biometric verification');

      // Revert setting
      await updateAppLockSettings({ requireBiometricWithoutFallback: false });
    });
  });

  describe('2. WebAuthn Cryptographic Grants & Scoped Token Integrity', () => {
    it('signs and verifies valid scoped authentication grants', () => {
      const grant = signAuthGrant(testUser._id.toString(), 'vault', 300000);
      expect(typeof grant).toBe('string');

      const isValid = verifyAuthGrant(grant, testUser._id.toString(), 'vault');
      expect(isValid).toBe(true);
    });

    it('rejects expired grant tokens', () => {
      // Create a grant with negative TTL
      const grant = signAuthGrant(testUser._id.toString(), 'app_lock', -1000);
      const isValid = verifyAuthGrant(grant, testUser._id.toString(), 'app_lock');
      expect(isValid).toBe(false);
    });

    it('rejects tampered grant tokens', () => {
      const grant = signAuthGrant(testUser._id.toString(), 'finance', 300000);
      const parts = grant.split('.');
      
      // Tamper with payload
      const tamperedPayload = Buffer.from(`${new mongoose.Types.ObjectId()}:finance:${Date.now() + 300000}`).toString('base64url');
      const tamperedGrant = `${tamperedPayload}.${parts[1]}`;

      const isValid = verifyAuthGrant(tamperedGrant, testUser._id.toString(), 'finance');
      expect(isValid).toBe(false);
    });

    it('rejects scope mismatch (privilege escalation prevention)', () => {
      const financeGrant = signAuthGrant(testUser._id.toString(), 'section:money', 300000);

      // Attempting to use section:money grant to unlock vault
      const isValidForVault = verifyAuthGrant(financeGrant, testUser._id.toString(), 'vault');
      expect(isValidForVault).toBe(false);
    });
  });

  describe('3. WebAuthn ECDSA Signature Verification Mathematics', () => {
    it('verifies genuine ECDSA P-256 signatures generated with authenticating device key', () => {
      // Generate standard P-256 (prime256v1) key pair simulating a WebAuthn authenticator
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
      });

      const jwk = publicKey.export({ format: 'jwk' }) as WebAuthnJWK;
      expect(jwk.kty).toBe('EC');
      expect(jwk.crv).toBe('P-256');
      expect(jwk.x).toBeDefined();
      expect(jwk.y).toBeDefined();

      const authData = crypto.randomBytes(37);
      const clientDataJSON = JSON.stringify({
        type: 'webauthn.get',
        challenge: 'test-challenge-123',
        origin: 'https://manageo.app',
      });

      const clientDataHash = crypto.createHash('sha256').update(clientDataJSON).digest();
      const signedData = Buffer.concat([authData, clientDataHash]);

      // Sign with private key
      const signature = crypto.sign('sha256', signedData, privateKey);

      // Verify using our webauthn verification utility
      const verified = verifyWebAuthnSignature(jwk, clientDataJSON, authData, signature);
      expect(verified).toBe(true);

      // Tampered client data must fail
      const tamperedClientData = JSON.stringify({
        type: 'webauthn.get',
        challenge: 'hacked-challenge-456',
        origin: 'https://manageo.app',
      });
      const tamperedVerify = verifyWebAuthnSignature(jwk, tamperedClientData, authData, signature);
      expect(tamperedVerify).toBe(false);
    });
  });

  describe('4. Biometric Registration & Auth Challenge Endpoints', () => {
    it('generates registration challenge and stores verification token', async () => {
      const regChallenge = await getBiometricRegistrationChallenge();
      expect(regChallenge.success).toBe(true);
      expect(regChallenge.challenge).toBeDefined();

      const tokenDoc = await VerificationToken.findOne({
        email: testUser.email.toLowerCase().trim(),
        type: 'webauthn_register_challenge',
      });
      expect(tokenDoc).not.toBeNull();
      expect(tokenDoc?.token).toBe(regChallenge.challenge);
    });

    it('rejects auth challenge generation when biometrics is not yet enrolled', async () => {
      const authChallenge = await getBiometricAuthChallenge('app_lock');
      expect(authChallenge.success).toBe(false);
      expect(authChallenge.error).toContain('not enrolled');
    });

    it('generates auth challenge when biometrics is enrolled', async () => {
      // Simulate enrolled credential in user document
      await User.updateOne(
        { _id: testUser._id },
        {
          $set: {
            'preferences.biometricSettings.isEnabled': true,
            'preferences.biometricSettings.credentialId': 'mock-cred-id-abc',
            'preferences.biometricSettings.publicKey': JSON.stringify({ kty: 'EC', crv: 'P-256', x: 'a', y: 'b' }),
          },
        }
      );

      const authChallenge = await getBiometricAuthChallenge('vault');
      expect(authChallenge.success).toBe(true);
      expect(authChallenge.challenge).toBeDefined();
      expect(authChallenge.credentialId).toBe('mock-cred-id-abc');
    });
  });

  describe('5. Biometric Unlock Protection Endpoints', () => {
    it('rejects Vault biometric unlock when missing assertion data', async () => {
      const res = await unlockVaultWithBiometrics({
        authData: '',
        clientDataJSON: '',
        signature: '',
      });
      expect(res.success).toBe(false);
      expect((res as any).error).toContain('Missing cryptographic assertion data');
    });

    it('rejects Section biometric unlock when missing assertion data', async () => {
      const res = await unlockSectionWithBiometrics('money', {
        authData: '',
        clientDataJSON: '',
        signature: '',
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain('Missing cryptographic assertion data');
    });
  });

  describe('6. Biometric Credential Lifecycle & Removal', () => {
    it('removes biometric credential and disables biometrics', async () => {
      const removeRes = await removeBiometricCredential();
      expect(removeRes.success).toBe(true);

      const updated = await User.findById(testUser._id).lean();
      expect(updated?.preferences?.biometricSettings?.credentialId).toBeUndefined();
      expect(updated?.preferences?.biometricSettings?.publicKey).toBeUndefined();
      expect(updated?.preferences?.biometricSettings?.isEnabled).toBe(false);
    });

    it('updates biometric settings (e.g. strictSharedDeviceProtection and allowPasswordFallback)', async () => {
      const res = await updateBiometricSettings({
        allowPasswordFallback: false,
        strictSharedDeviceProtection: true,
      });
      expect(res.success).toBe(true);

      const updated = await User.findById(testUser._id).lean();
      expect(updated?.preferences?.biometricSettings?.allowPasswordFallback).toBe(false);
      expect(updated?.preferences?.biometricSettings?.strictSharedDeviceProtection).toBe(true);
    });
  });

  describe('7. Server-Side Biometric Lockout & Security Policies', () => {
    beforeEach(async () => {
      await User.updateOne(
        { _id: testUser._id },
        {
          $set: {
            'preferences.biometricSettings.isEnabled': true,
            'preferences.biometricSettings.credentialId': 'mock-cred-id-abc',
            'preferences.biometricSettings.publicKey': JSON.stringify({ kty: 'EC', crv: 'P-256', x: 'a', y: 'b' }),
            'preferences.biometricSettings.requireForVault': true,
          },
        }
      );
    });
    it('rejects Vault biometric unlock when user account is server-locked', async () => {
      // Simulate lockout
      const future = new Date(Date.now() + 60000);
      await User.updateOne({ _id: testUser._id }, { $set: { 'preferences.vaultSettings.lockedUntil': future } });

      const res = await unlockVaultWithBiometrics({
        authData: Buffer.from([0x01]).toString('base64'),
        clientDataJSON: Buffer.from(JSON.stringify({ type: 'webauthn.get' })).toString('base64'),
        signature: Buffer.from([0x02]).toString('base64'),
      });

      expect(res.success).toBe(false);
      expect((res as any).error).toContain('Vault account locked');

      // Clear lockout
      await User.updateOne({ _id: testUser._id }, { $set: { 'preferences.vaultSettings.lockedUntil': null } });
    });

    it('rejects biometric unlock when user has disabled biometric for that scope', async () => {
      await User.updateOne({ _id: testUser._id }, { $set: { 'preferences.biometricSettings.requireForVault': false } });

      const res = await unlockVaultWithBiometrics({
        authData: Buffer.from([0x01]).toString('base64'),
        clientDataJSON: Buffer.from(JSON.stringify({ type: 'webauthn.get' })).toString('base64'),
        signature: Buffer.from([0x02]).toString('base64'),
      });

      expect(res.success).toBe(false);
      expect((res as any).error).toContain('disabled for Vault');

      // Re-enable
      await User.updateOne({ _id: testUser._id }, { $set: { 'preferences.biometricSettings.requireForVault': true } });
    });
  });

  describe('8. Verification of Authentication Tiers & Distinctions', () => {
    it('distinguishes between WebAuthn User Verification flag and User Presence', async () => {
      const rpIdHash = crypto.randomBytes(32);
      const signCount = Buffer.from([0, 0, 0, 1]);

      // Only User Presence (UP bit 0 set, UV bit 2 NOT set) -> flags = 0x01
      const authDataUPOnly = Buffer.concat([rpIdHash, Buffer.from([0x01]), signCount]);
      const flagsUP = authDataUPOnly[32];
      const isUP = (flagsUP & 0x01) !== 0;
      const isUV = (flagsUP & 0x04) !== 0;
      expect(isUP).toBe(true);
      expect(isUV).toBe(false);

      // User Verified (UP bit 0 set AND UV bit 2 set) -> flags = 0x05
      const authDataUV = Buffer.concat([rpIdHash, Buffer.from([0x05]), signCount]);
      const flagsUV = authDataUV[32];
      expect((flagsUV & 0x01) !== 0).toBe(true);
      expect((flagsUV & 0x04) !== 0).toBe(true);
    });

    it('verifies Manageo account password against User passwordHash independently from WebAuthn', async () => {
      const valid = await verifyAccountPasswordForAppLock(rawPassword);
      expect(valid.success).toBe(true);
      expect(valid.grantToken).toBeDefined();

      const invalid = await verifyAccountPasswordForAppLock('wrong-password');
      expect(invalid.success).toBe(false);
      expect(invalid.error).toContain('Incorrect');
    });

    it('detects native biometric bridge capabilities vs standard WebAuthn', async () => {
      const { detectBiometricCapabilities } = await import('@/lib/biometric-bridge');
      // In NodeJS (non-browser / window undefined)
      const capNode = await detectBiometricCapabilities();
      expect(capNode.supported).toBe(false);
      expect(capNode.canEnforceStrictBiometricWithoutPIN).toBe(false);
    });
  });

});