import 'dotenv/config';
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import VaultItem from "@/models/VaultItem";
import VerificationToken from "@/models/VerificationToken";
import dbConnect from "@/lib/db";
import { 
  createVaultItem, 
  updateVaultItem, 
  deleteVaultItem, 
  getVaultItems 
} from "@/actions/vault.actions";
import { 
  unlockVault, 
  verifyCustomPassword, 
  resetCustomPassword, 
  resetVaultPassword 
} from "@/actions/vault.auth";

// Mock next-auth getServerSession
const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Helper to decrypt AES-256-GCM data using Node crypto (same math as client WebCrypto)
function decryptVaultData(encryptedB64: string, ivB64: string, saltB64: string, vaultKey: string): string {
  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const ciphertextWithTag = Buffer.from(encryptedB64, 'base64');
  
  // GCM auth tag is the last 16 bytes
  const authTag = ciphertextWithTag.subarray(ciphertextWithTag.length - 16);
  const encryptedText = ciphertextWithTag.subarray(0, ciphertextWithTag.length - 16);

  const key = crypto.pbkdf2Sync(vaultKey, salt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
}

describe("Vault Cryptographic & Multi-Tenant Security Tests", () => {
  let userA: any;
  let userB: any;
  const userAPassword = "UserA_Password_123!";
  const userAVaultPassword = "VaultA_Secret_Pin_99";
  const nextAuthSecret = process.env.NEXTAUTH_SECRET || "manageo-isolated-test-secret-salt-2026";

  beforeAll(async () => {
    await dbConnect();
    await User.deleteMany({});
    await VaultItem.deleteMany({});
    await VerificationToken.deleteMany({});

    const passwordHashA = await bcrypt.hash(userAPassword, 10);
    const vaultHashA = await bcrypt.hash(userAVaultPassword, 10);

    userA = await User.create({
      name: "Security User A",
      email: "usera-security@manageo.test",
      passwordHash: passwordHashA,
      preferences: {
        vaultSettings: {
          isInitialized: true,
          vaultPasswordHash: vaultHashA,
          maxFailedAttempts: 3,
          lockoutDurationSeconds: 30,
        }
      }
    });

    const passwordHashB = await bcrypt.hash("UserB_Password_456!", 10);
    userB = await User.create({
      name: "Security User B",
      email: "userb-security@manageo.test",
      passwordHash: passwordHashB,
      preferences: {
        vaultSettings: {
          isInitialized: true,
          vaultPasswordHash: await bcrypt.hash("VaultB_Secret_Pin_77", 10),
          maxFailedAttempts: 3,
          lockoutDurationSeconds: 30,
        }
      }
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await VaultItem.deleteMany({});
    await VerificationToken.deleteMany({});
  });

  describe("1. Cryptographic Invariants & Tamper Resistance (AES-256-GCM)", () => {
    it("encrypts and decrypts secret fields without leaking plaintext to the database", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userA._id.toString(), email: userA.email }
      });

      const secretPayload = {
        fields: [
          { id: "1", name: "Username", type: "text", value: "superadmin" },
          { id: "2", name: "Password", type: "password", value: "SuperSecretKey#2026" }
        ]
      };

      const res = await createVaultItem({
        title: "Test Banking Login",
        category: "Login",
        encryptedData: "placeholder",
        iv: "placeholder",
        salt: "placeholder",
        plaintextData: JSON.stringify(secretPayload),
      });

      expect(res.success).toBe(true);
      expect(res.item).toBeDefined();

      // Verify that database record does NOT contain plaintext
      const dbRecord = await VaultItem.findById(res.item._id).lean();
      expect(dbRecord).toBeDefined();
      expect(JSON.stringify(dbRecord)).not.toContain("superadmin");
      expect(JSON.stringify(dbRecord)).not.toContain("SuperSecretKey#2026");

      // Verify it can be decrypted using the deterministic user vault key
      const vaultKey = crypto.createHash('sha256').update(userA._id.toString() + nextAuthSecret).digest('hex');
      const decrypted = decryptVaultData(dbRecord.encryptedData, dbRecord.iv, dbRecord.salt, vaultKey);
      const parsed = JSON.parse(decrypted);

      expect(parsed.fields[0].value).toBe("superadmin");
      expect(parsed.fields[1].value).toBe("SuperSecretKey#2026");
    });

    it("fails decryption if ciphertext or auth tag is tampered with by even 1 byte", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userA._id.toString(), email: userA.email }
      });

      const res = await createVaultItem({
        title: "Tamper Test",
        category: "Other",
        encryptedData: "placeholder",
        iv: "placeholder",
        salt: "placeholder",
        plaintextData: JSON.stringify({ secret: "cannot-tamper-me" }),
      });

      const dbRecord = await VaultItem.findById(res.item._id).lean();
      const vaultKey = crypto.createHash('sha256').update(userA._id.toString() + nextAuthSecret).digest('hex');

      // Tamper with the ciphertext
      const buffer = Buffer.from(dbRecord.encryptedData, 'base64');
      buffer[0] = buffer[0] ^ 0xFF; // Flip bits in first byte
      const tamperedBase64 = buffer.toString('base64');

      expect(() => {
        decryptVaultData(tamperedBase64, dbRecord.iv, dbRecord.salt, vaultKey);
      }).toThrow();
    });

    it("produces distinct IVs and distinct ciphertexts for identical plaintext updates", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userA._id.toString(), email: userA.email }
      });

      const payload = JSON.stringify({ note: "identical secret" });

      const item1 = await createVaultItem({
        title: "Secret 1",
        category: "Secure Note",
        encryptedData: "placeholder",
        iv: "placeholder",
        salt: "placeholder",
        plaintextData: payload,
      });

      const item2 = await createVaultItem({
        title: "Secret 2",
        category: "Secure Note",
        encryptedData: "placeholder",
        iv: "placeholder",
        salt: "placeholder",
        plaintextData: payload,
      });

      expect(item1.item.iv).not.toBe(item2.item.iv);
      expect(item1.item.salt).not.toBe(item2.item.salt);
      expect(item1.item.encryptedData).not.toBe(item2.item.encryptedData);
    });
  });

  describe("2. Multi-Tenant IDOR Protection & User Scoping", () => {
    let itemOfUserA: any;

    beforeEach(async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userA._id.toString(), email: userA.email }
      });

      const res = await createVaultItem({
        title: "User A Confidential",
        category: "Login",
        encryptedData: "placeholder",
        iv: "placeholder",
        salt: "placeholder",
        plaintextData: JSON.stringify({ info: "private A" }),
      });
      itemOfUserA = res.item;
    });

    it("does not allow User B to fetch User A's vault items", async () => {
      // Act as User B
      mockGetServerSession.mockResolvedValue({
        user: { id: userB._id.toString(), email: userB.email }
      });

      const res = await getVaultItems();
      expect(res.success).toBe(true);
      const userAItemInBList = res.items?.find((i: any) => i._id === itemOfUserA._id);
      expect(userAItemInBList).toBeUndefined();
    });

    it("prevents User B from updating User A's vault items (IDOR update rejection)", async () => {
      // Act as User B
      mockGetServerSession.mockResolvedValue({
        user: { id: userB._id.toString(), email: userB.email }
      });

      const res = await updateVaultItem(itemOfUserA._id, {
        title: "Hacked by User B",
        plaintextData: JSON.stringify({ info: "malicious overwrite" }),
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Item not found");

      // Verify item title was NOT changed in DB
      const record = await VaultItem.findById(itemOfUserA._id);
      expect(record.title).toBe("User A Confidential");
    });

    it("prevents User B from deleting User A's vault items (IDOR delete rejection)", async () => {
      // Act as User B
      mockGetServerSession.mockResolvedValue({
        user: { id: userB._id.toString(), email: userB.email }
      });

      const res = await deleteVaultItem(itemOfUserA._id);
      expect(res.success).toBe(false);
      expect(res.error).toBe("Item not found");

      // Verify item still exists
      const record = await VaultItem.findById(itemOfUserA._id);
      expect(record).not.toBeNull();
    });

    it("rejects vault actions when unauthenticated (null session)", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const resGet = await getVaultItems();
      expect(resGet.success).toBe(false);
      expect(resGet.error).toBe("Unauthorized");

      const resCreate = await createVaultItem({
        title: "Anon",
        category: "Login",
        encryptedData: "p",
        iv: "p",
        salt: "p",
      });
      expect(resCreate.success).toBe(false);
      expect(resCreate.error).toBe("Unauthorized");

      const resUpdate = await updateVaultItem(itemOfUserA._id, { title: "Anon Update" });
      expect(resUpdate.success).toBe(false);
      expect(resUpdate.error).toBe("Unauthorized");

      const resDelete = await deleteVaultItem(itemOfUserA._id);
      expect(resDelete.success).toBe(false);
      expect(resDelete.error).toBe("Unauthorized");
    });
  });

  describe("3. Custom Password Isolation & Password Hashing Security", () => {
    it("hashes custom passwords with bcrypt and never stores them in plaintext", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userA._id.toString(), email: userA.email }
      });

      const customPlain = "IsolatedCustomPass_789!";
      const res = await createVaultItem({
        title: "Custom Pass Secret",
        category: "Login",
        encryptedData: "placeholder",
        iv: "placeholder",
        salt: "placeholder",
        isCustomPassword: true,
        customPasswordPlaintext: customPlain,
        plaintextData: JSON.stringify({ token: "custom-pass-content" }),
      });

      expect(res.success).toBe(true);
      const dbItem = await VaultItem.findById(res.item._id).lean();
      
      // Hash is present and valid bcrypt
      expect(dbItem.customPasswordHash).toBeDefined();
      expect(dbItem.customPasswordHash).not.toBe(customPlain);
      expect(await bcrypt.compare(customPlain, dbItem.customPasswordHash)).toBe(true);

      // Verify custom password verification endpoint
      const correctAuth = await verifyCustomPassword(res.item._id, customPlain);
      expect(correctAuth.success).toBe(true);

      const wrongAuth = await verifyCustomPassword(res.item._id, "WrongPassword_999");
      expect(wrongAuth.success).toBe(false);
    });

    it("purges customPasswordHash from database when custom password is removed", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userA._id.toString(), email: userA.email }
      });

      const resCreate = await createVaultItem({
        title: "Toggle Custom Pass Item",
        category: "Login",
        encryptedData: "placeholder",
        iv: "placeholder",
        salt: "placeholder",
        isCustomPassword: true,
        customPasswordPlaintext: "InitialPass123",
        plaintextData: JSON.stringify({ val: 123 }),
      });

      // Update to disable custom password
      const resUpdate = await updateVaultItem(resCreate.item._id, {
        isCustomPassword: false,
      });

      expect(resUpdate.success).toBe(true);
      expect(resUpdate.item.isCustomPassword).toBe(false);

      const dbItem = await VaultItem.findById(resCreate.item._id).lean();
      expect(dbItem.customPasswordHash).toBeUndefined();
    });
  });

  describe("4. Vault Reset OTP Security & Verification", () => {
    it("rejects expired or unverified OTPs and requires website account password", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userA._id.toString(), email: userA.email }
      });

      // Setup expired OTP in VerificationToken
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      await VerificationToken.create({
        email: userA.email.toLowerCase(),
        token: "847291",
        type: "vault_reset",
        expires: expiredDate,
      });

      const resExpired = await resetVaultPassword("847291", userAPassword, "NewVaultPass_123");
      expect(resExpired.success).toBe(false);
      if (!resExpired.success) {
        expect(resExpired.error).toContain("expired");
      }

      // Setup valid OTP but provide WRONG account password
      const validDate = new Date(Date.now() + 15 * 60 * 1000);
      await VerificationToken.create({
        email: userA.email.toLowerCase(),
        token: "938210",
        type: "vault_reset",
        expires: validDate,
      });

      const resWrongAccountPass = await resetVaultPassword("938210", "WrongAccountPass!", "NewVaultPass_123");
      expect(resWrongAccountPass.success).toBe(false);
      if (!resWrongAccountPass.success) {
        expect(resWrongAccountPass.error).toContain("Incorrect website account password");
      }

      // Now provide correct OTP and correct account password -> Success
      const resSuccess = await resetVaultPassword("938210", userAPassword, "NewVaultPass_123");
      expect(resSuccess.success).toBe(true);

      // Verify OTP is consumed and deleted (single-use token protection)
      const consumedToken = await VerificationToken.findOne({ token: "938210", type: "vault_reset" });
      expect(consumedToken).toBeNull();
    });
  });

  describe("8. Fail-Closed Secret Validation and Configuration Security", () => {
    const testSecretPass = "VaultTest_Secret_Pass_88";

    beforeEach(async () => {
      const vaultHash = await bcrypt.hash(testSecretPass, 10);
      await User.updateOne(
        { _id: userA._id },
        {
          $set: {
            "preferences.vaultSettings.vaultPasswordHash": vaultHash,
            "preferences.vaultSettings.failedAttempts": 0,
            "preferences.vaultSettings.lockedUntil": null,
          },
        }
      );
    });

    it("fails closed when NEXTAUTH_SECRET is missing, refusing to release vaultKey", async () => {
      const originalSecret = process.env.NEXTAUTH_SECRET;
      try {
        delete process.env.NEXTAUTH_SECRET;
        const res = await unlockVault(testSecretPass);
        expect(res.success).toBe(false);
        expect((res as any).error).toContain("NEXTAUTH_SECRET is not configured");
        expect((res as any).vaultKey).toBeUndefined();
      } finally {
        process.env.NEXTAUTH_SECRET = originalSecret;
      }
    });

    it("fails closed when NEXTAUTH_SECRET is only whitespace", async () => {
      const originalSecret = process.env.NEXTAUTH_SECRET;
      try {
        process.env.NEXTAUTH_SECRET = "   ";
        const res = await unlockVault(testSecretPass);
        expect(res.success).toBe(false);
        expect((res as any).error).toContain("NEXTAUTH_SECRET is not configured");
        expect((res as any).vaultKey).toBeUndefined();
      } finally {
        process.env.NEXTAUTH_SECRET = originalSecret;
      }
    });

    it("preserves exact key derivation and decrypts existing records when secret is configured", async () => {
      const res = await unlockVault(testSecretPass);
      expect(res.success).toBe(true);
      expect((res as any).vaultKey).toBeDefined();
      const expectedKey = crypto.createHash("sha256").update(userA._id.toString() + process.env.NEXTAUTH_SECRET).digest("hex");
      expect((res as any).vaultKey).toBe(expectedKey);
    });
  });
});
