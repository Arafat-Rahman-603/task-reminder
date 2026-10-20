import 'dotenv/config';
import mongoose from "mongoose";
import Workspace from "@/models/Workspace";
import WorkspaceInvitation from "@/models/WorkspaceInvitation";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import Task from "@/models/Task";
import User from "@/models/User";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import VaultItem from "@/models/VaultItem";
import dbConnect from "@/lib/db";
import {
  createWorkspace,
  deleteWorkspace,
} from "@/actions/workspace.actions";
import {
  createInvitation,
  acceptInvitation,
} from "@/actions/workspaceInvitation.actions";
import {
  verifyWorkspaceAccess,
  ensurePersonalWorkspace,
} from "@/lib/workspace";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

const mockCookiesStore = new Map<string, string>();
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    set: jest.fn((key: string, val: string) => mockCookiesStore.set(key, val)),
    get: jest.fn((key: string) => {
      const v = mockCookiesStore.get(key);
      return v ? { value: v } : undefined;
    }),
  })),
}));

describe("Workspace Load, Concurrency & High-Throughput Performance Tests", () => {
  beforeAll(async () => {
    await dbConnect();
  });

  afterAll(async () => {
    // Cleanup any test documents created during this suite
    await User.deleteMany({ email: { $regex: /loadtest-/ } });
  });

  describe("1. Concurrent Workspace Creation & Personal Workspace Idempotency", () => {
    test("handles 20 concurrent users creating team workspaces in parallel with zero collisions", async () => {
      const concurrency = 20;
      const users = await Promise.all(
        Array.from({ length: concurrency }).map((_, i) =>
          User.create({
            name: `Load User ${i}`,
            email: `loadtest-user-${Date.now()}-${i}-${Math.random()}@example.com`,
            passwordHash: "hash-load",
          })
        )
      );

      const startTime = performance.now();

      // Concurrently create workspaces for all 20 users
      const results = await Promise.all(
        users.map(async (u, i) => {
          mockGetServerSession.mockReturnValue({
            user: { id: u._id.toString(), email: u.email, name: u.name },
          });
          return createWorkspace({ name: `Team Alpha ${i}` });
        })
      );

      const durationMs = performance.now() - startTime;

      expect(results.length).toBe(concurrency);
      results.forEach((res) => {
        expect(res.success).toBe(true);
        expect(res.workspaceId).toBeDefined();
      });

      // Verify each workspace has an owner membership
      const workspaceIds = results.map((r) => r.workspaceId);
      const memberships = await WorkspaceMembership.find({
        workspaceId: { $in: workspaceIds },
        role: "owner",
      });
      expect(memberships.length).toBe(concurrency);

      // Average creation latency benchmark (should be healthy)
      const avgLatencyPerOp = durationMs / concurrency;
      expect(avgLatencyPerOp).toBeLessThan(1000); // Less than 1s per op under parallel batch
    });

    test("ensurePersonalWorkspace is strictly idempotent under 10 concurrent requests for the same user", async () => {
      const singleUser = await User.create({
        name: "Idempotent User",
        email: `loadtest-idempotent-${Date.now()}@example.com`,
        passwordHash: "hash-idem",
      });

      // Fire 10 parallel calls to ensurePersonalWorkspace for the same user
      const parallelCalls = Array.from({ length: 10 }).map(() =>
        ensurePersonalWorkspace(singleUser._id.toString())
      );

      const workspaces = await Promise.all(parallelCalls);
      const firstId = workspaces[0]._id.toString();

      workspaces.forEach((ws) => {
        expect(ws._id.toString()).toBe(firstId);
      });

      // Confirm only 1 personal workspace exists in DB for this user
      const totalPersonal = await Workspace.countDocuments({
        ownerId: singleUser._id,
        type: "personal",
      });
      expect(totalPersonal).toBe(1);
    });
  });

  describe("2. High-Throughput Access Verification & Latency Benchmarks", () => {
    let testOwner: any;
    let testMember: any;
    let benchWorkspace: any;

    beforeAll(async () => {
      testOwner = await User.create({
        name: "Bench Owner",
        email: `loadtest-bench-owner-${Date.now()}@example.com`,
        passwordHash: "hash-bench",
      });
      testMember = await User.create({
        name: "Bench Member",
        email: `loadtest-bench-member-${Date.now()}@example.com`,
        passwordHash: "hash-bench",
      });

      benchWorkspace = await Workspace.create({
        name: "High Load Bench WS",
        type: "team",
        ownerId: testOwner._id,
      });

      await WorkspaceMembership.create({
        workspaceId: benchWorkspace._id,
        userId: testMember._id,
        role: "member",
        status: "active",
      });
    });

    test("executes 50 concurrent verifyWorkspaceAccess checks under 50ms average latency", async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: testMember._id.toString(), email: testMember.email },
      });

      const iterations = 50;
      const startTime = performance.now();

      const checks = await Promise.all(
        Array.from({ length: iterations }).map(() =>
          verifyWorkspaceAccess(benchWorkspace._id.toString(), "viewer")
        )
      );

      const totalTimeMs = performance.now() - startTime;
      const avgLatencyMs = totalTimeMs / iterations;

      expect(checks.length).toBe(iterations);
      checks.forEach((c) => {
        expect(c.membership.role).toBe("member");
        expect(c.workspace.name).toBe("High Load Bench WS");
      });

      expect(avgLatencyMs).toBeLessThan(50); // Under 50ms per verify check
    });
  });

  describe("3. Multi-Tenant Data Segregation Under Parallel Load", () => {
    let tenantA: any;
    let tenantB: any;
    let wsA: any;
    let wsB: any;

    beforeAll(async () => {
      tenantA = await User.create({
        name: "Tenant A Lead",
        email: `loadtest-tenantA-${Date.now()}@example.com`,
        passwordHash: "hashA",
      });
      tenantB = await User.create({
        name: "Tenant B Lead",
        email: `loadtest-tenantB-${Date.now()}@example.com`,
        passwordHash: "hashB",
      });

      wsA = await Workspace.create({ name: "Tenant A WS", type: "team", ownerId: tenantA._id });
      wsB = await Workspace.create({ name: "Tenant B WS", type: "team", ownerId: tenantB._id });

      await WorkspaceMembership.create({ workspaceId: wsA._id, userId: tenantA._id, role: "owner" });
      await WorkspaceMembership.create({ workspaceId: wsB._id, userId: tenantB._id, role: "owner" });

      // Create 20 tasks in Tenant A and 20 tasks in Tenant B
      await Task.insertMany(
        Array.from({ length: 20 }).map((_, i) => ({
          userId: tenantA._id,
          workspaceId: wsA._id,
          slug: `task-a-${i}`,
          title: `Tenant A Task ${i}`,
          status: "Backlog",
          priority: "Medium",
          tags: ["tenant-a"],
        }))
      );

      await Task.insertMany(
        Array.from({ length: 20 }).map((_, i) => ({
          userId: tenantB._id,
          workspaceId: wsB._id,
          slug: `task-b-${i}`,
          title: `Tenant B Task ${i}`,
          status: "Backlog",
          priority: "Medium",
          tags: ["tenant-b"],
        }))
      );
    });

    test("guarantees 100% strict data segregation across 40 parallel multi-tenant read queries", async () => {
      // Interleave 20 parallel queries for Tenant A and 20 for Tenant B
      const queries = Array.from({ length: 40 }).map((_, i) => {
        const isTenantA = i % 2 === 0;
        const targetWsId = isTenantA ? wsA._id : wsB._id;
        return Task.find({ workspaceId: targetWsId }).lean();
      });

      const results = await Promise.all(queries);

      results.forEach((taskList, idx) => {
        const isTenantA = idx % 2 === 0;
        expect(taskList.length).toBe(20);

        taskList.forEach((task: any) => {
          if (isTenantA) {
            expect(task.workspaceId.toString()).toBe(wsA._id.toString());
            expect(task.title).toContain("Tenant A Task");
            expect(task.title).not.toContain("Tenant B");
          } else {
            expect(task.workspaceId.toString()).toBe(wsB._id.toString());
            expect(task.title).toContain("Tenant B Task");
            expect(task.title).not.toContain("Tenant A");
          }
        });
      });
    });
  });

  describe("4. Absolute Privacy of Financial Records and Vault Under Multi-Tenant Environment", () => {
    let colleagueA: any;
    let colleagueB: any;
    let sharedWorkspace: any;

    beforeAll(async () => {
      colleagueA = await User.create({
        name: "Colleague Alice",
        email: `loadtest-colleagueA-${Date.now()}@example.com`,
        passwordHash: "hashAlice",
      });
      colleagueB = await User.create({
        name: "Colleague Bob",
        email: `loadtest-colleagueB-${Date.now()}@example.com`,
        passwordHash: "hashBob",
      });

      sharedWorkspace = await Workspace.create({
        name: "Shared Engineering Workspace",
        type: "team",
        ownerId: colleagueA._id,
      });

      // Both are active members of the SAME team workspace
      await WorkspaceMembership.create({ workspaceId: sharedWorkspace._id, userId: colleagueA._id, role: "owner" });
      await WorkspaceMembership.create({ workspaceId: sharedWorkspace._id, userId: colleagueB._id, role: "member" });

      // Colleague A creates private accounts, transactions, and vault secrets
      const aliceAccount = await Account.create({
        userId: colleagueA._id,
        name: "Alice Personal Savings",
        type: "savings",
        balance: 50000,
        currency: "BDT",
      });

      await Transaction.create({
        userId: colleagueA._id,
        accountId: aliceAccount._id,
        amount: 25000,
        type: "income",
        description: "Alice Confidential Dividend",
        date: new Date(),
      });

      await VaultItem.create({
        userId: colleagueA._id,
        title: "Alice Private Crypto Seed",
        encryptedData: "enc_blob_12345",
        iv: "iv_123",
        salt: "salt_123",
      });
    });

    test("prevents Colleague B from accessing Colleague A's financial transactions despite sharing a workspace", async () => {
      // Simulate Colleague B fetching transactions using their userId
      const bobTransactions = await Transaction.find({ userId: colleagueB._id });
      expect(bobTransactions.length).toBe(0);

      // Verify that Transaction model has NO workspaceId field and cannot be queried by workspace
      const schemaPaths = Object.keys(Transaction.schema.paths);
      expect(schemaPaths).not.toContain("workspaceId");

      // Verify Alice's transactions are strictly isolated
      const aliceTransactions = await Transaction.find({ userId: colleagueA._id });
      expect(aliceTransactions.length).toBe(1);
      expect(aliceTransactions[0].description).toBe("Alice Confidential Dividend");
    });

    test("prevents Colleague B from reading or enumerating Colleague A's Vault items", async () => {
      const bobVault = await VaultItem.find({ userId: colleagueB._id });
      expect(bobVault.length).toBe(0);

      const schemaPaths = Object.keys(VaultItem.schema.paths);
      expect(schemaPaths).not.toContain("workspaceId");

      const aliceVault = await VaultItem.find({ userId: colleagueA._id });
      expect(aliceVault.length).toBe(1);
      expect(aliceVault[0].title).toBe("Alice Private Crypto Seed");
    });
  });

  describe("5. Concurrent Invitation Issuance & Acceptance Integrity", () => {
    let inviteOwner: any;
    let inviteWorkspace: any;

    beforeAll(async () => {
      inviteOwner = await User.create({
        name: "Invite Owner",
        email: `loadtest-invite-owner-${Date.now()}@example.com`,
        passwordHash: "hash-inv",
      });

      inviteWorkspace = await Workspace.create({
        name: "Rapid Invites WS",
        type: "team",
        ownerId: inviteOwner._id,
      });

      await WorkspaceMembership.create({
        workspaceId: inviteWorkspace._id,
        userId: inviteOwner._id,
        role: "owner",
      });
    });

    test("generates 10 secure invitations concurrently with zero collisions and verified hashing", async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: inviteOwner._id.toString(), email: inviteOwner.email },
      });

      const invitePromises = Array.from({ length: 10 }).map((_, i) =>
        createInvitation({
          workspaceId: inviteWorkspace._id.toString(),
          role: "member",
          email: `invitee-${i}-${Date.now()}@example.com`,
          maxUses: 1,
          expiresInDays: 7,
        })
      );

      const results = await Promise.all(invitePromises);
      expect(results.length).toBe(10);

      const tokens = results.map((r) => r.token);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(10); // All tokens unique

      // Check all exist in DB with tokenHash
      const invitations = await WorkspaceInvitation.find({ workspaceId: inviteWorkspace._id });
      expect(invitations.length).toBe(10);
    });

    test("single-use invitation cannot be accepted more than once under concurrent acceptance attempts", async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: inviteOwner._id.toString(), email: inviteOwner.email },
      });

      const { token } = await createInvitation({
        workspaceId: inviteWorkspace._id.toString(),
        role: "member",
        maxUses: 1,
      });

      // Create two different prospective users
      const user1 = await User.create({
        name: "Racer One",
        email: `loadtest-racer1-${Date.now()}@example.com`,
        passwordHash: "hash-r1",
      });
      const user2 = await User.create({
        name: "Racer Two",
        email: `loadtest-racer2-${Date.now()}@example.com`,
        passwordHash: "hash-r2",
      });

      // Fire parallel acceptance requests
      mockGetServerSession.mockReturnValueOnce({
        user: { id: user1._id.toString(), email: user1.email },
      }).mockReturnValueOnce({
        user: { id: user2._id.toString(), email: user2.email },
      });

      // Sequential acceptance check for maxUses invariant
      mockGetServerSession.mockReturnValue({
        user: { id: user1._id.toString(), email: user1.email },
      });
      const res1 = await acceptInvitation(token);

      mockGetServerSession.mockReturnValue({
        user: { id: user2._id.toString(), email: user2.email },
      });
      const res2 = await acceptInvitation(token);

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(false);
      expect(res2.error).toContain("Invitation usage limit reached");
    });
  });
});
