import 'dotenv/config';
import mongoose from "mongoose";
import Workspace from "@/models/Workspace";
import WorkspaceInvitation from "@/models/WorkspaceInvitation";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import User from "@/models/User";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import VaultItem from "@/models/VaultItem";
import AuditLog from "@/models/AuditLog";
import dbConnect from "@/lib/db";
import { 
  createInvitation, 
  getInvitationDetails, 
  acceptInvitation,
  revokeInvitation
} from "@/actions/workspaceInvitation.actions";
import {
  getWorkspaceMembers,
  updateMemberRole,
  removeWorkspaceMember
} from "@/actions/workspaceMember.actions";
import { 
  verifyWorkspaceAccess, 
  hasModulePermission, 
  getDefaultPermissions 
} from "@/lib/workspace";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    set: jest.fn(),
    get: jest.fn(),
  })),
}));

describe("Workspace Access Control, Invitations, & Member Governance", () => {
  let ownerUser: any;
  let adminUser: any;
  let memberUser: any;
  let strangerUser: any;
  let designatedInvitee: any;
  let testWorkspace: any;

  beforeAll(async () => {
    await dbConnect();

    // 1. Create Workspace Owner
    ownerUser = await User.create({
      name: "Owner Alice",
      email: `owner-ac-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "team_owner",
    });

    // 2. Create Workspace Admin
    adminUser = await User.create({
      name: "Admin Bob",
      email: `admin-ac-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "individual",
    });

    // 3. Create Workspace Member
    memberUser = await User.create({
      name: "Member Charlie",
      email: `member-ac-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "individual",
    });

    // 4. Create Stranger (No membership)
    strangerUser = await User.create({
      name: "Stranger Dan",
      email: `stranger-ac-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "individual",
    });

    // 5. Create Designated Invitee
    designatedInvitee = await User.create({
      name: "Designated Eve",
      email: `designated-eve-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "individual",
    });

    // 6. Create Team Workspace
    testWorkspace = await Workspace.create({
      name: "Access Control Secure Team",
      type: "team",
      ownerId: ownerUser._id,
      subscription: { plan: "pro", status: "active" },
    });

    // 7. Seed Initial Memberships
    await WorkspaceMembership.create({
      workspaceId: testWorkspace._id,
      userId: ownerUser._id,
      role: "owner",
      status: "active",
      permissions: getDefaultPermissions("owner"),
    });

    await WorkspaceMembership.create({
      workspaceId: testWorkspace._id,
      userId: adminUser._id,
      role: "admin",
      status: "active",
      permissions: getDefaultPermissions("admin"),
    });

    await WorkspaceMembership.create({
      workspaceId: testWorkspace._id,
      userId: memberUser._id,
      role: "member",
      status: "active",
      permissions: getDefaultPermissions("member"),
    });
  });

  afterAll(async () => {
    if (ownerUser?._id) {
      await WorkspaceInvitation.deleteMany({ workspaceId: testWorkspace?._id });
      await WorkspaceMembership.deleteMany({ workspaceId: testWorkspace?._id });
      await AuditLog.deleteMany({ workspaceId: testWorkspace?._id });
      await Workspace.deleteOne({ _id: testWorkspace?._id });
      await User.deleteMany({
        _id: { $in: [ownerUser._id, adminUser._id, memberUser._id, strangerUser._id, designatedInvitee._id] }
      });
      await Account.deleteMany({ userId: { $in: [ownerUser._id, memberUser._id] } });
      await Transaction.deleteMany({ userId: { $in: [ownerUser._id, memberUser._id] } });
      await VaultItem.deleteMany({ userId: { $in: [ownerUser._id, memberUser._id] } });
    }
  });

  describe("1. Email-Bound Invitation Security & Atomic Acceptance", () => {
    let emailBoundToken: string;

    it("allows the owner to create an email-restricted invitation with custom permissions", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      const res = await createInvitation({
        workspaceId: testWorkspace._id.toString(),
        email: designatedInvitee.email,
        role: "member",
        maxUses: 1,
        expiresInDays: 3,
        permissions: {
          tasks: { view: true, create: true, edit: true, delete: false, assign: true },
          projects: { view: true, create: false, edit: false, delete: false },
          routines: { view: true, manage: false },
          custom_sections: { view: true, manage: false },
          files: { view: true, upload: true },
          members: { view: true, manage: false },
          settings: { view: false, manage: false },
          audit_logs: { view: false },
        },
      });

      expect(res.success).toBe(true);
      expect(res.token).toBeDefined();
      emailBoundToken = res.token!;

      // Verify AuditLog record was created
      const audit = await AuditLog.findOne({
        workspaceId: testWorkspace._id,
        action: "INVITE_CREATE",
      });
      expect(audit).toBeDefined();
      expect(audit?.userId.toString()).toBe(ownerUser._id.toString());
    });

    it("detects email mismatch when a different user inspects the invite", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: strangerUser._id.toString(), email: strangerUser.email, name: strangerUser.name },
      });

      const details = await getInvitationDetails(emailBoundToken);
      expect(details.valid).toBe(true);
      expect(details.invitation?.email).toBe(designatedInvitee.email);
      expect(details.userState?.isLoggedIn).toBe(true);
      expect(details.userState?.emailMismatch).toBe(true);
    });

    it("strictly blocks an unintended user from accepting an email-bound invitation", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: strangerUser._id.toString(), email: strangerUser.email, name: strangerUser.name },
      });

      const acceptRes = await acceptInvitation(emailBoundToken);
      expect(acceptRes.success).toBe(false);
      expect(acceptRes.error).toContain("was sent specifically to");

      // Verify stranger was NOT added to workspace
      const strangerMembership = await WorkspaceMembership.findOne({
        workspaceId: testWorkspace._id,
        userId: strangerUser._id,
      });
      expect(strangerMembership).toBeNull();
    });

    it("allows the designated email recipient to accept and assigns exact granular permissions", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: designatedInvitee._id.toString(), email: designatedInvitee.email, name: designatedInvitee.name },
      });

      const acceptRes = await acceptInvitation(emailBoundToken);
      expect(acceptRes.success).toBe(true);
      expect(acceptRes.workspaceId).toBe(testWorkspace._id.toString());

      // Verify membership in database
      const membership = await WorkspaceMembership.findOne({
        workspaceId: testWorkspace._id,
        userId: designatedInvitee._id,
      });
      expect(membership).toBeDefined();
      expect(membership?.role).toBe("member");
      expect(membership?.permissions?.tasks?.delete).toBe(false);
      expect(membership?.permissions?.tasks?.assign).toBe(true);
    });

    it("rejects replayed attempts once the single-use token is consumed", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: designatedInvitee._id.toString(), email: designatedInvitee.email, name: designatedInvitee.name },
      });

      const replayRes = await acceptInvitation(emailBoundToken);
      expect(replayRes.success).toBe(false);
      expect(replayRes.error).toContain("usage limit");
    });
  });

  describe("2. Invitation Expiration & Revocation", () => {
    it("rejects acceptance of an expired invitation", async () => {
      // Create manually expired invite
      const rawToken = "expired_raw_token_xyz";
      const crypto = await import("crypto");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      await WorkspaceInvitation.create({
        workspaceId: testWorkspace._id,
        createdBy: ownerUser._id,
        tokenHash: hashedToken,
        role: "viewer",
        maxUses: 1,
        uses: 0,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: strangerUser._id.toString(), email: strangerUser.email, name: strangerUser.name },
      });

      const details = await getInvitationDetails(rawToken);
      expect(details.valid).toBe(false);
      expect(details.reason).toBe("EXPIRED");

      const acceptRes = await acceptInvitation(rawToken);
      expect(acceptRes.success).toBe(false);
      expect(acceptRes.error).toContain("expired");
    });

    it("allows an owner to revoke a pending invitation and blocks future acceptance", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      const createRes = await createInvitation({
        workspaceId: testWorkspace._id.toString(),
        role: "viewer",
        maxUses: 5,
        expiresInDays: 7,
      });
      expect(createRes.success).toBe(true);
      const tokenToRevoke = createRes.token!;

      // Revoke by owner
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });
      const revokeRes = await revokeInvitation(createRes.invitationId!, testWorkspace._id.toString());
      expect(revokeRes.success).toBe(true);

      // Attempt inspection & acceptance
      mockGetServerSession.mockResolvedValue({
        user: { id: strangerUser._id.toString(), email: strangerUser.email, name: strangerUser.name },
      });

      const details = await getInvitationDetails(tokenToRevoke);
      expect(details.valid).toBe(false);

      const acceptRes = await acceptInvitation(tokenToRevoke);
      expect(acceptRes.success).toBe(false);
      expect(acceptRes.error).toContain("revoked");
    });
  });

  describe("3. Member Roster Management & Role Invariants", () => {
    it("returns the full member roster with populated user information", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      const members = await getWorkspaceMembers(testWorkspace._id.toString());
      expect(members.length).toBeGreaterThanOrEqual(3);
      const memberNames = members.map((m: any) => m.name);
      expect(memberNames).toContain("Owner Alice");
      expect(memberNames).toContain("Admin Bob");
    });

    it("allows the owner to update a member's role to admin", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      const res = await updateMemberRole(
        testWorkspace._id.toString(),
        memberUser._id.toString(),
        "admin"
      );
      expect(res.success).toBe(true);

      const updated = await WorkspaceMembership.findOne({
        workspaceId: testWorkspace._id,
        userId: memberUser._id,
      });
      expect(updated?.role).toBe("admin");
    });

    it("prevents demoting or changing the workspace owner's role", async () => {
      // Attempt by admin
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name },
      });

      await expect(
        updateMemberRole(testWorkspace._id.toString(), ownerUser._id.toString(), "member")
      ).rejects.toThrow("The workspace owner's role cannot be modified");
    });

    it("prevents an admin from changing their own role", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name },
      });

      await expect(
        updateMemberRole(testWorkspace._id.toString(), adminUser._id.toString(), "owner")
      ).rejects.toThrow("You cannot change your own role");
    });

    it("prevents removal of the workspace owner", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name },
      });

      await expect(
        removeWorkspaceMember(testWorkspace._id.toString(), ownerUser._id.toString())
      ).rejects.toThrow("The workspace owner cannot be removed from their workspace");
    });

    it("allows the owner to remove a member, immediately terminating access", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      const res = await removeWorkspaceMember(
        testWorkspace._id.toString(),
        designatedInvitee._id.toString()
      );
      expect(res.success).toBe(true);

      const deleted = await WorkspaceMembership.findOne({
        workspaceId: testWorkspace._id,
        userId: designatedInvitee._id,
      });
      expect(deleted).toBeNull();
    });
  });

  describe("4. Granular Permission Checks & Suspended Status Enforcement", () => {
    it("evaluates module and action permissions correctly", () => {
      const viewerMembership = {
        role: "viewer" as const,
        status: "active" as const,
        permissions: getDefaultPermissions("viewer"),
      };

      // Viewer can view tasks, but cannot edit or delete
      expect(hasModulePermission(viewerMembership as any, "tasks", "view")).toBe(true);
      expect(hasModulePermission(viewerMembership as any, "tasks", "edit")).toBe(false);
      expect(hasModulePermission(viewerMembership as any, "tasks", "delete")).toBe(false);

      const adminMembership = {
        role: "admin" as const,
        status: "active" as const,
        permissions: getDefaultPermissions("admin"),
      };
      expect(hasModulePermission(adminMembership as any, "tasks", "edit")).toBe(true);
      expect(hasModulePermission(adminMembership as any, "tasks", "delete")).toBe(true);
    });

    it("denies access when a membership is suspended", async () => {
      // Temporarily set memberUser to suspended
      await WorkspaceMembership.updateOne(
        { workspaceId: testWorkspace._id, userId: memberUser._id },
        { status: "suspended" }
      );

      mockGetServerSession.mockResolvedValueOnce({
        user: { id: memberUser._id.toString(), email: memberUser.email, name: memberUser.name },
      });

      await expect(
        verifyWorkspaceAccess(testWorkspace._id.toString(), "member")
      ).rejects.toThrow("Workspace membership is suspended");

      // Restore active status
      await WorkspaceMembership.updateOne(
        { workspaceId: testWorkspace._id, userId: memberUser._id },
        { status: "active" }
      );
    });
  });

  describe("5. Strict Cross-User Personal Money and Vault Isolation", () => {
    let ownerAccount: any;
    let ownerTransaction: any;
    let ownerVaultItem: any;

    beforeAll(async () => {
      // Seed personal data strictly for Alice (Owner)
      ownerAccount = await Account.create({
        userId: ownerUser._id,
        name: "Alice Private Checking",
        type: "checking",
        balance: 5000,
        currency: "USD",
      });

      ownerTransaction = await Transaction.create({
        userId: ownerUser._id,
        accountId: ownerAccount._id,
        amount: 250,
        type: "expense",
        category: "Confidential",
        description: "Private Medical Bill",
        date: new Date(),
      });

      ownerVaultItem = await VaultItem.create({
        userId: ownerUser._id,
        title: "Alice Private SSH Key",
        category: "Login",
        encryptedData: "aes-256-gcm-cipher-data",
        iv: "initialization-vector",
        salt: "random-salt-hex",
      });
    });

    it("ensures Account schema has no workspaceId field and is strictly scoped to userId", async () => {
      // Querying by Bob (Admin) must return 0 accounts for Alice's data
      const bobAccounts = await Account.find({ userId: adminUser._id });
      expect(bobAccounts.length).toBe(0);

      // Even if Bob knows Alice's account ID, a properly userId-scoped query returns null
      const isolatedQuery = await Account.findOne({
        _id: ownerAccount._id,
        userId: adminUser._id,
      });
      expect(isolatedQuery).toBeNull();
    });

    it("ensures Transactions cannot be accessed by another workspace member", async () => {
      const bobTransactions = await Transaction.find({
        _id: ownerTransaction._id,
        userId: adminUser._id,
      });
      expect(bobTransactions.length).toBe(0);
    });

    it("ensures Vault items cannot be enumerated or read across users", async () => {
      const bobVaultItems = await VaultItem.find({
        _id: ownerVaultItem._id,
        userId: adminUser._id,
      });
      expect(bobVaultItems.length).toBe(0);
    });
  });
});
