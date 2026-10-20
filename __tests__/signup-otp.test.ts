import 'dotenv/config';
import User from '@/models/User';
import Workspace from '@/models/Workspace';
import WorkspaceMembership from '@/models/WorkspaceMembership';
import VerificationToken from '@/models/VerificationToken';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as sendOtpHandler } from '@/app/api/auth/register/send-otp/route';
import dbConnect from '@/lib/db';

jest.mock('@/lib/email/resend', () => ({
  sendEmail: jest.fn().mockResolvedValue({ id: 'email-mock-123', success: true }),
}));

describe('Signup Email OTP Verification Tests', () => {
  beforeAll(async () => {
    await dbConnect();
  });

  afterEach(async () => {
    await User.deleteMany({ email: { $regex: /@otptest\.com$/ } });
    await Workspace.deleteMany({ name: { $regex: /OTP/ } });
    await WorkspaceMembership.deleteMany({});
    await VerificationToken.deleteMany({ email: { $regex: /@otptest\.com$/ } });
  });

  function createRequest(url: string, body: any) {
    return new Request(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  describe('POST /api/auth/register/send-otp', () => {
    it('should reject requests with invalid or missing email', async () => {
      const req = createRequest('http://localhost:3000/api/auth/register/send-otp', {
        email: 'invalid-email',
      });
      const res = await sendOtpHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toMatch(/valid email/i);
    });

    it('should reject OTP request if user email already exists', async () => {
      const email = 'existing@otptest.com';
      await User.create({
        name: 'Existing User',
        email,
        passwordHash: 'dummyhash123',
      });

      const req = createRequest('http://localhost:3000/api/auth/register/send-otp', {
        email,
      });
      const res = await sendOtpHandler(req);
      expect(res.status).toBe(409);
    });

    it('should create a 6-digit verify token in database and return success', async () => {
      const email = 'newuser@otptest.com';
      const req = createRequest('http://localhost:3000/api/auth/register/send-otp', {
        email,
        name: 'New User',
      });

      const res = await sendOtpHandler(req);
      expect(res.status).toBe(200);

      const tokenRecord = await VerificationToken.findOne({ email, type: 'verify' });
      expect(tokenRecord).toBeTruthy();
      expect(tokenRecord!.token).toMatch(/^\d{6}$/);
      expect(tokenRecord!.expires.getTime()).toBeGreaterThan(Date.now());
    });

    it('should rate-limit duplicate requests within 60 seconds', async () => {
      const email = 'ratelimit@otptest.com';
      await VerificationToken.create({
        email,
        token: '123456',
        type: 'verify',
        expires: new Date(Date.now() + 15 * 60 * 1000),
      });

      const req = createRequest('http://localhost:3000/api/auth/register/send-otp', {
        email,
      });

      const res = await sendOtpHandler(req);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.message).toMatch(/wait/i);
    });
  });

  describe('POST /api/auth/register with OTP', () => {
    it('should reject registration if invalid OTP is provided', async () => {
      const email = 'verifyfail@otptest.com';
      await VerificationToken.create({
        email,
        token: '987654',
        type: 'verify',
        expires: new Date(Date.now() + 15 * 60 * 1000),
      });

      const req = createRequest('http://localhost:3000/api/auth/register', {
        name: 'Verify Fail',
        email,
        password: 'password123',
        accountType: 'individual',
        otp: '000000', // incorrect OTP
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toMatch(/invalid or expired/i);
    });

    it('should reject registration if OTP is expired', async () => {
      const email = 'expired@otptest.com';
      await VerificationToken.create({
        email,
        token: '112233',
        type: 'verify',
        expires: new Date(Date.now() - 1000), // expired 1s ago
      });

      const req = createRequest('http://localhost:3000/api/auth/register', {
        name: 'Expired OTP',
        email,
        password: 'password123',
        accountType: 'individual',
        otp: '112233',
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(400);
    });

    it('should successfully register user when valid OTP is provided', async () => {
      const email = 'success@otptest.com';
      const validOtp = '654321';
      await VerificationToken.create({
        email,
        token: validOtp,
        type: 'verify',
        expires: new Date(Date.now() + 15 * 60 * 1000),
      });

      const req = createRequest('http://localhost:3000/api/auth/register', {
        name: 'Success User',
        email,
        password: 'password123',
        accountType: 'individual',
        otp: validOtp,
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(201);

      // Verify user was created in DB
      const user = await User.findOne({ email });
      expect(user).toBeTruthy();
      expect(user!.emailVerified).toBeInstanceOf(Date);

      // Verify personal workspace was provisioned
      const workspace = await Workspace.findOne({ ownerId: user!._id });
      expect(workspace).toBeTruthy();
      expect(workspace!.type).toBe('personal');

      // Verify token was deleted after registration
      const remainingToken = await VerificationToken.findOne({ email, type: 'verify' });
      expect(remainingToken).toBeNull();
    });

    it('should prevent reusing the same OTP a second time', async () => {
      const email = 'reuse@otptest.com';
      const validOtp = '555666';
      await VerificationToken.create({
        email,
        token: validOtp,
        type: 'verify',
        expires: new Date(Date.now() + 15 * 60 * 1000),
      });

      const req1 = createRequest('http://localhost:3000/api/auth/register', {
        name: 'Reuse User',
        email,
        password: 'password123',
        accountType: 'individual',
        otp: validOtp,
      });

      const res1 = await registerHandler(req1);
      expect(res1.status).toBe(201);

      // Try registering again with the exact same OTP
      const req2 = createRequest('http://localhost:3000/api/auth/register', {
        name: 'Reuse User 2',
        email,
        password: 'password123',
        accountType: 'individual',
        otp: validOtp,
      });

      const res2 = await registerHandler(req2);
      expect(res2.status).toBe(409); // Email already in use
    });
  });
});
