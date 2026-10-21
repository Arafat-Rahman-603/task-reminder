import 'dotenv/config';
import mongoose from "mongoose";
import Workspace from "@/models/Workspace";
import WorkspaceInvitation from "@/models/WorkspaceInvitation";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import WorkspaceRole from "@/models/WorkspaceRole";
import User from "@/models/User";
import Task from "@/models/Task";
import dbConnect from "@/lib/db";
import { 
  createWorkspaceRole, 
  getWorkspaceRoles, 
  updateWorkspaceRole, 
  deleteWorkspaceRole 
} from "@/actions/workspaceRole.actions";
import {
  updateMemberRole,
  getWorkspaceMembers,
} from "@/actions/workspaceMember.actions";
import {
  createInvitation,
  acceptInvitation,
} from "@/actions/workspaceInvitation.actions";
import { getWorkspaceMemberPerformance } from "@/actions/workspaceAnalytics.actions";

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

describe("Workspace Custom Roles & Team Performance Analytics", () => {
  let ownerUser: any;
  let adminUser: any;
  let memberUser: any;
  let teamWorkspace: any;
  let customRoleDoc: any;

  beforeAll(async () => {
    await dbConnect();

    // 1. Create Workspace Owner
    ownerUser = await User.create({
      name: "Owner Olivia",
      email: `owner-perf-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "team_owner",
    });

    // 2. Create Workspace Admin
    adminUser = await User.create({
      name: "Admin Arthur",
      email: `admin-perf-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "individual",
    });

    // 3. Create Team Member
    memberUser = await User.create({
      name: "Member Matthew",
      email: `member-perf-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "individual",
    });

    // 4. Create Collaborative Team Workspace
    teamWorkspace = await Workspace.create({
      name: "Axiom Innovations",
      type: "team",
      ownerId: ownerUser._id,
      subscription: { plan: "enterprise", status: "active" },
    });

    // 5. Create Memberships
    await WorkspaceMembership.create([
      {
        workspaceId: teamWorkspace._id,
        userId: ownerUser._id,
        role: "owner",
        status: "active",
      },
      {
        workspaceId: teamWorkspace._id,
        userId: adminUser._id,
        role: "admin",
        status: "active",
      },
      {
        workspaceId: teamWorkspace._id,
        userId: memberUser._id,
        role: "member",
        status: "active",
      },
    ]);
  });

  afterAll(async () => {
    if (teamWorkspace) {
      await WorkspaceRole.deleteMany({ workspaceId: teamWorkspace._id });
      await Task.deleteMany({ workspaceId: teamWorkspace._id });
      await WorkspaceMembership.deleteMany({ workspaceId: teamWorkspace._id });
      await WorkspaceInvitation.deleteMany({ workspaceId: teamWorkspace._id });
      await Workspace.deleteOne({ _id: teamWorkspace._id });
    }
    if (ownerUser) await User.deleteOne({ _id: ownerUser._id });
    if (adminUser) await User.deleteOne({ _id: adminUser._id });
    if (memberUser) await User.deleteOne({ _id: memberUser._id });
    await mongoose.connection.close();
  });

  describe("Custom Roles Lifecycle", () => {
    it("prevents regular members from creating custom roles", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: memberUser._id.toString(), email: memberUser.email },
      });

      await expect(
        createWorkspaceRole({
          workspaceId: teamWorkspace._id.toString(),
          name: "Finance Manager",
          baseRole: "member",
          permissions: { tasks: { view: true, create: true } },
        })
      ).rejects.toThrow(/Unauthorized/);
    });

    it("allows owner to create a custom role (e.g. Finance Manager)", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email },
      });

      const res = await createWorkspaceRole({
        workspaceId: teamWorkspace._id.toString(),
        name: "Finance Manager",
        description: "Manages financial schedules and accounts",
        color: "emerald",
        baseRole: "member",
        permissions: {
          tasks: { view: true, create: true, edit: true, delete: false },
          routines: { view: true, manage: true },
          finance: { view: true, manage: true },
        },
      });

      expect(res.success).toBe(true);
      expect(res.role.name).toBe("Finance Manager");
      expect(res.role.color).toBe("emerald");
      expect(res.role.permissions.finance.manage).toBe(true);
      customRoleDoc = res.role;
    });

    it("prevents duplicate custom role names in the same workspace", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: adminUser._id.toString(), email: adminUser.email },
      });

      await expect(
        createWorkspaceRole({
          workspaceId: teamWorkspace._id.toString(),
          name: "Finance Manager",
          baseRole: "member",
          permissions: {},
        })
      ).rejects.toThrow(/already exists/i);
    });

    it("lists custom roles with member count", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: adminUser._id.toString(), email: adminUser.email },
      });

      const roles = await getWorkspaceRoles(teamWorkspace._id.toString());
      expect(roles.length).toBeGreaterThanOrEqual(1);
      const financeRole = roles.find((r: any) => r.name === "Finance Manager");
      expect(financeRole).toBeDefined();
      expect(financeRole.memberCount).toBe(0);
    });

    it("allows assigning a member to a custom role", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email },
      });

      const res = await updateMemberRole(
        teamWorkspace._id.toString(),
        memberUser._id.toString(),
        "member",
        undefined,
        customRoleDoc._id
      );

      expect(res.success).toBe(true);

      const membership = await WorkspaceMembership.findOne({
        workspaceId: teamWorkspace._id,
        userId: memberUser._id,
      });

      expect(membership.customRoleId.toString()).toBe(customRoleDoc._id.toString());
      expect(membership.customRoleName).toBe("Finance Manager");
      expect(membership.permissions.tasks.create).toBe(true);
    });

    it("synchronizes member permissions when custom role is updated", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: adminUser._id.toString(), email: adminUser.email },
      });

      const updated = await updateWorkspaceRole({
        workspaceId: teamWorkspace._id.toString(),
        roleId: customRoleDoc._id,
        name: "Lead Finance Officer",
        description: "Updated description",
        color: "amber",
        permissions: {
          tasks: { view: true, create: true, edit: true, delete: true },
        },
      });

      expect(updated.success).toBe(true);
      expect(updated.role.name).toBe("Lead Finance Officer");

      const memberDoc = await WorkspaceMembership.findOne({
        workspaceId: teamWorkspace._id,
        userId: memberUser._id,
      });

      expect(memberDoc.customRoleName).toBe("Lead Finance Officer");
      expect(memberDoc.permissions.tasks.delete).toBe(true);
    });
  });

  describe("Team Member Performance & Analytics", () => {
    beforeAll(async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // Task 1: Finished ON-TIME by Matthew (due tomorrow, completed yesterday)
      await Task.create({
        workspaceId: teamWorkspace._id,
        userId: ownerUser._id,
        assigneeId: memberUser._id,
        title: "Q3 Balance Sheet Audit",
        slug: `perf-task-1-${Date.now()}`,
        status: "Completed",
        priority: "High",
        dueDate: tomorrow,
        completedAt: yesterday,
      });

      // Task 2: Finished LATE by Matthew (due 3 days ago, completed yesterday)
      await Task.create({
        workspaceId: teamWorkspace._id,
        userId: ownerUser._id,
        assigneeId: memberUser._id,
        title: "Monthly Expense Report",
        slug: `perf-task-2-${Date.now()}`,
        status: "Done",
        priority: "Medium",
        dueDate: threeDaysAgo,
        completedAt: yesterday,
      });

      // Task 3: Currently OVERDUE for Matthew (due yesterday, still In Progress)
      await Task.create({
        workspaceId: teamWorkspace._id,
        userId: ownerUser._id,
        assigneeId: memberUser._id,
        title: "Vendor Tax Invoices",
        slug: `perf-task-3-${Date.now()}`,
        status: "In Progress",
        priority: "Urgent",
        dueDate: yesterday,
      });

      // Task 4: In Progress on track for Admin Arthur (due tomorrow)
      await Task.create({
        workspaceId: teamWorkspace._id,
        userId: ownerUser._id,
        assigneeId: adminUser._id,
        title: "Platform Security Review",
        slug: `perf-task-4-${Date.now()}`,
        status: "In Progress",
        priority: "High",
        dueDate: tomorrow,
      });
    });

    it("rejects non-admins/non-owners from viewing performance analytics", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: memberUser._id.toString(), email: memberUser.email },
      });

      const res = await getWorkspaceMemberPerformance(teamWorkspace._id.toString());
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/);
    });

    it("calculates accurate on-time, late, and overdue metrics for team members", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email },
      });

      const res = await getWorkspaceMemberPerformance(teamWorkspace._id.toString());
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();

      const summary = res.data!;
      expect(summary.totalTasks).toBe(4);
      expect(summary.totalCompleted).toBe(2);
      expect(summary.totalPending).toBe(2);
      expect(summary.totalCurrentlyOverdue).toBe(1);

      // Verify Matthew's stats
      const matthewMetric = summary.members.find(
        (m) => m.userId === memberUser._id.toString()
      );
      expect(matthewMetric).toBeDefined();
      expect(matthewMetric!.assignedCount).toBe(3);
      expect(matthewMetric!.completedCount).toBe(2);
      expect(matthewMetric!.pendingCount).toBe(1);
      expect(matthewMetric!.onTimeCompletedCount).toBe(1);
      expect(matthewMetric!.lateCompletedCount).toBe(1);
      expect(matthewMetric!.currentlyOverdueCount).toBe(1);
      // 1 on-time out of 2 completed = 50%
      expect(matthewMetric!.onTimeRate).toBe(50);
      expect(matthewMetric!.customRoleName).toBe("Lead Finance Officer");

      // Verify task statuses in drill-down
      const overdueTask = matthewMetric!.tasks.find(
        (t) => t.title === "Vendor Tax Invoices"
      );
      expect(overdueTask?.performanceStatus).toBe("overdue");

      const onTimeTask = matthewMetric!.tasks.find(
        (t) => t.title === "Q3 Balance Sheet Audit"
      );
      expect(onTimeTask?.performanceStatus).toBe("on_time");

      const lateTask = matthewMetric!.tasks.find(
        (t) => t.title === "Monthly Expense Report"
      );
      expect(lateTask?.performanceStatus).toBe("late");
    });
  });

  describe("Custom Role Deletion Safety", () => {
    it("safely reverts members to base role when custom role is deleted", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email },
      });

      const res = await deleteWorkspaceRole(
        teamWorkspace._id.toString(),
        customRoleDoc._id
      );
      expect(res.success).toBe(true);

      const memberDoc = await WorkspaceMembership.findOne({
        workspaceId: teamWorkspace._id,
        userId: memberUser._id,
      });

      expect(memberDoc.customRoleId).toBeFalsy();
      expect(memberDoc.customRoleName).toBeFalsy();
      expect(memberDoc.role).toBe("member");
    });
  });
});
