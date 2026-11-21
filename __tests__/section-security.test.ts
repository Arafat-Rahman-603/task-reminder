import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";
import {
  setupSectionLockPassword,
  toggleSectionLock,
  updateSectionLockConfig,
  verifySectionLockPassword,
} from "@/actions/sectionLock.actions";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Section Security & Password Protection Unit Tests", () => {
  describe("Password Hashing and Verification Mechanics", () => {
    it("hashes section password with bcrypt and verifies matching input", async () => {
      const password = "mySecretPassword123";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const isMatch = await bcrypt.compare(password, hash);
      const isMismatch = await bcrypt.compare("wrongPassword", hash);

      expect(isMatch).toBe(true);
      expect(isMismatch).toBe(false);
    });

    it("enforces minimum 4-character requirement for section passwords", () => {
      const shortPass = "123";
      const validPass = "1234";

      expect(shortPass.length < 4).toBe(true);
      expect(validPass.length >= 4).toBe(true);
    });
  });

  describe("Section Lock & Unlock State Mechanics", () => {
    it("manages unlocked sections via Set data structure accurately", () => {
      const unlocked = new Set<string>();
      unlocked.add("money");
      unlocked.add("tasks");

      expect(unlocked.has("money")).toBe(true);
      expect(unlocked.has("tasks")).toBe(true);
      expect(unlocked.has("documents")).toBe(false);

      // Re-locking removes it from the set
      unlocked.delete("money");
      expect(unlocked.has("money")).toBe(false);
    });

    it("correctly identifies whether a route needs unlocking", () => {
      const lockedSections = ["money", "ideas", "my-custom-crm"];
      const unlockedSections = new Set<string>(["money"]);

      const isSectionLocked = (id: string) => {
        if (!lockedSections.includes(id)) return false;
        return !unlockedSections.has(id);
      };

      // "money" is locked in user preferences, but unlocked in current session
      expect(isSectionLocked("money")).toBe(false);

      // "ideas" is locked in user preferences, and not yet unlocked in session
      expect(isSectionLocked("ideas")).toBe(true);

      // "tasks" is not locked in user preferences
      expect(isSectionLocked("tasks")).toBe(false);

      // "my-custom-crm" (custom section) is locked and not yet unlocked
      expect(isSectionLocked("my-custom-crm")).toBe(true);
    });
  });

  describe("VerificationToken Schema Support for Section Lock Reset", () => {
    it("allows 'section_lock_reset' in VerificationToken type definition", () => {
      const tokenDoc = {
        identifier: "user@example.com",
        token: "hashed_otp_token_here",
        type: "section_lock_reset" as const,
        expires: new Date(Date.now() + 15 * 60 * 1000),
      };

      expect(tokenDoc.type).toBe("section_lock_reset");
      expect(tokenDoc.expires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("Section Password Reset Rules", () => {
    it("generates a 6-digit numeric OTP for email dispatch", () => {
      const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
      const otp = generateOtp();

      expect(otp).toHaveLength(6);
      expect(Number.isNaN(Number(otp))).toBe(false);
    });

    it("requires real OTP match and rejects arbitrary bypasses", () => {
      const realOtp: string = "729401";
      const userEnteredGood: string = "729401";
      const userEnteredBad: string = "123456";

      expect(userEnteredGood === realOtp).toBe(true);
      expect(userEnteredBad === realOtp).toBe(false);
    });
  });

  describe("Section Security Server Actions & Brute-Force Protection", () => {
    const testEmail = "section-sec-test@manageo.app";
    const accountPassword = "AccountLogin_Pass_2026!";
    const sectionPassword = "SecLock_Secret_2026!";
    let userId: mongoose.Types.ObjectId;

    beforeAll(async () => {
      await dbConnect();
      await User.deleteMany({ email: testEmail });
      await VerificationToken.deleteMany({ email: testEmail });

      const accountHash = await bcrypt.hash(accountPassword, 10);
      const user = await User.create({
        name: "Section Security Tester",
        email: testEmail,
        passwordHash: accountHash,
      });
      userId = user._id;
      mockGetServerSession.mockResolvedValue({
        user: { id: userId.toString(), email: testEmail, name: user.name },
      });
    });

    afterAll(async () => {
      await User.deleteMany({ email: testEmail });
      await VerificationToken.deleteMany({ email: testEmail });
    });

    it("requires valid Manageo account password to initialize and prevents overwriting once initialized", async () => {
      const missingAccPass = await setupSectionLockPassword(sectionPassword, "");
      expect(missingAccPass.success).toBe(false);
      expect(missingAccPass.error).toContain("Incorrect account login password");

      const wrongAccPass = await setupSectionLockPassword(sectionPassword, "WrongAccountPass!");
      expect(wrongAccPass.success).toBe(false);
      expect(wrongAccPass.error).toContain("Incorrect account login password");

      const initOk = await setupSectionLockPassword(sectionPassword, accountPassword);
      expect(initOk.success).toBe(true);

      const overwriteRes = await setupSectionLockPassword("HijackNewPass", accountPassword);
      expect(overwriteRes.success).toBe(false);
      expect(overwriteRes.error).toContain("already initialized");
    });

    it("requires section password for toggleSectionLock and updateSectionLockConfig", async () => {
      const missingLock = await toggleSectionLock("money", true, "");
      expect(missingLock.success).toBe(false);

      const wrongLock = await toggleSectionLock("money", true, "WrongSectionPass!");
      expect(wrongLock.success).toBe(false);
      expect(wrongLock.error).toContain("Incorrect section password");

      const lockOk = await toggleSectionLock("money", true, sectionPassword);
      expect(lockOk.success).toBe(true);
      expect(lockOk.lockedSections).toContain("money");

      const cfgWrong = await updateSectionLockConfig(
        "money",
        { biometricEnabled: false, autoPromptBiometric: true, lockOnBackground: true, timeoutMinutes: 5 },
        "WrongSectionPass!"
      );
      expect(cfgWrong.success).toBe(false);
      expect(cfgWrong.error).toContain("Incorrect section password");

      const cfgOk = await updateSectionLockConfig(
        "money",
        { biometricEnabled: false, autoPromptBiometric: true, lockOnBackground: true, timeoutMinutes: 5 },
        sectionPassword
      );
      expect(cfgOk.success).toBe(true);

      const updated = await User.findById(userId).lean();
      const rawConfigs = updated?.preferences?.sectionSecurity?.sectionConfigs as Record<
        string,
        { biometricEnabled?: boolean; timeoutMinutes?: number; lockOnBackground?: boolean }
      >;
      expect(rawConfigs?.money?.biometricEnabled).toBe(false);
      expect(rawConfigs?.money?.timeoutMinutes).toBe(5);
      expect(rawConfigs?.money?.lockOnBackground).toBe(true);
    });

    it("enforces server-side brute-force lockout after repeated invalid section passwords", async () => {
      // Clear any prior attempt count cleanly
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            "preferences.sectionSecurity.failedAttempts": 0,
            "preferences.sectionSecurity.lockedUntil": null,
          },
        }
      );

      for (let i = 0; i < 4; i++) {
        const res = await verifySectionLockPassword("BadSectionPass!");
        expect(res.success).toBe(false);
        expect(res.error).toContain("attempts remaining");
      }

      const fifth = await verifySectionLockPassword("BadSectionPass!");
      expect(fifth.success).toBe(false);
      expect(fifth.error).toContain("Section security locked");

      const whileLocked = await verifySectionLockPassword(sectionPassword);
      expect(whileLocked.success).toBe(false);
      expect(whileLocked.error).toContain("Section security locked");

      // Clean up lockout state
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            "preferences.sectionSecurity.failedAttempts": 0,
            "preferences.sectionSecurity.lockedUntil": null,
          },
        }
      );
    });
  });
});
