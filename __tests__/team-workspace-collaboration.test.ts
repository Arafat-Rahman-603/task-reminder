import 'dotenv/config';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Workspace from '@/models/Workspace';
import WorkspaceMembership from '@/models/WorkspaceMembership';
import Task from '@/models/Task';
import TaskComment from '@/models/TaskComment';
import AuditLog from '@/models/AuditLog';
import { Notification } from '@/models/Notification';
import {
  toggleMemberStatus,
  transferWorkspaceOwnership,
  getWorkspaceMembers,
} from '@/actions/workspaceMember.actions';
import { getWorkspaceAuditLogs } from '@/actions/auditLog.actions';
import { createTask, updateTask, getTasks, getTaskBySlug } from '@/actions/task.actions';
import {
  addTaskComment,
  getTaskComments,
  deleteTaskComment,
} from '@/actions/taskComment.actions';

const mockFirebasePush = jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 });
const mockNotifySSE = jest.fn();

jest.mock('@/lib/notifications/firebase-server', () => ({
  sendPushNotification: (...args: unknown[]) => mockFirebasePush(...args),
}));

jest.mock('@/lib/notifications/sse-service', () => ({
  notifyUserViaSSE: (...args: unknown[]) => mockNotifySSE(...args),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

let currentMockSessionUser: any = null;
let activeWorkspaceId: string | null = null;

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => {
    if (!currentMockSessionUser) return Promise.resolve(null);
    return Promise.resolve({
      user: {
        id: currentMockSessionUser._id.toString(),
        name: currentMockSessionUser.name,
        email: currentMockSessionUser.email,
        isPlatformAdmin: Boolean(currentMockSessionUser.isPlatformAdmin),
      },
    });
  }),
}));

jest.mock('@/actions/workspace.actions', () => ({
  getActiveWorkspaceInfo: jest.fn(async () => {
    if (!activeWorkspaceId) return null;
    const ws = await Workspace.findById(activeWorkspaceId).lean();
    if (!ws) return null;
    return {
      activeWorkspace: {
        ...ws,
        _id: ws._id.toString(),
        role: (ws as any).ownerId?.toString() === currentMockSessionUser?._id?.toString() ? 'owner' : 'admin',
      },
    };
  }),
}));

describe('Team Workspace Collaboration & Management Features', () => {
  let ownerUser: any;
  let memberUser: any;
  let secondMemberUser: any;
  let teamWorkspace: any;

  beforeAll(async () => {
    await dbConnect();

    ownerUser = await User.create({
      name: 'Workspace Owner',
      email: `ws-owner-${Date.now()}@example.com`,
      passwordHash: 'hash-ws-owner',
      emailVerified: new Date(),
    });

    memberUser = await User.create({
      name: 'Team Colleague',
      email: `ws-colleague-${Date.now()}@example.com`,
      passwordHash: 'hash-colleague',
      emailVerified: new Date(),
    });

    secondMemberUser = await User.create({
      name: 'Second Teammate',
      email: `ws-teammate2-${Date.now()}@example.com`,
      passwordHash: 'hash-teammate2',
      emailVerified: new Date(),
    });

    teamWorkspace = await Workspace.create({
      name: 'Engineering Team',
      type: 'team',
      ownerId: ownerUser._id,
    });

    await WorkspaceMembership.create({
      workspaceId: teamWorkspace._id,
      userId: ownerUser._id,
      role: 'owner',
      status: 'active',
    });

    await WorkspaceMembership.create({
      workspaceId: teamWorkspace._id,
      userId: memberUser._id,
      role: 'member',
      status: 'active',
    });

    await WorkspaceMembership.create({
      workspaceId: teamWorkspace._id,
      userId: secondMemberUser._id,
      role: 'member',
      status: 'active',
    });

    activeWorkspaceId = teamWorkspace._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [ownerUser._id, memberUser._id, secondMemberUser._id] } });
    await Workspace.deleteMany({ _id: teamWorkspace._id });
    await WorkspaceMembership.deleteMany({ workspaceId: teamWorkspace._id });
    await Task.deleteMany({ workspaceId: teamWorkspace._id });
    await TaskComment.deleteMany({ workspaceId: teamWorkspace._id });
    await AuditLog.deleteMany({ workspaceId: teamWorkspace._id });
    await Notification.deleteMany({ userId: { $in: [ownerUser._id, memberUser._id, secondMemberUser._id] } });
  });

  describe('1. Member Suspend & Activate Controls', () => {
    it('allows workspace owner to suspend an active team member', async () => {
      currentMockSessionUser = ownerUser;

      const res = await toggleMemberStatus(
        teamWorkspace._id.toString(),
        memberUser._id.toString(),
        'suspended'
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe('suspended');

      const updated = await WorkspaceMembership.findOne({
        workspaceId: teamWorkspace._id,
        userId: memberUser._id,
      });
      expect(updated?.status).toBe('suspended');

      // Verify audit log
      const audit = await AuditLog.findOne({
        workspaceId: teamWorkspace._id,
        'details.action': 'MEMBER_STATUS_CHANGE',
        'details.targetUserId': memberUser._id.toString(),
      });
      expect(audit).not.toBeNull();
      expect(audit?.details?.newStatus).toBe('suspended');
    });

    it('prevents workspace owner from suspending themselves', async () => {
      currentMockSessionUser = ownerUser;

      await expect(
        toggleMemberStatus(
          teamWorkspace._id.toString(),
          ownerUser._id.toString(),
          'suspended'
        )
      ).rejects.toThrow();
    });

    it('allows owner to reactivate the suspended member', async () => {
      currentMockSessionUser = ownerUser;

      const res = await toggleMemberStatus(
        teamWorkspace._id.toString(),
        memberUser._id.toString(),
        'active'
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe('active');

      const updated = await WorkspaceMembership.findOne({
        workspaceId: teamWorkspace._id,
        userId: memberUser._id,
      });
      expect(updated?.status).toBe('active');
    });
  });

  describe('2. Workspace Ownership Transfer', () => {
    it('transfers ownership to colleague, demotes former owner to admin, and updates workspace.ownerId', async () => {
      currentMockSessionUser = ownerUser;

      const res = await transferWorkspaceOwnership(
        teamWorkspace._id.toString(),
        memberUser._id.toString()
      );

      expect(res.success).toBe(true);

      const updatedWs = await Workspace.findById(teamWorkspace._id);
      expect(updatedWs?.ownerId.toString()).toBe(memberUser._id.toString());

      const formerOwnerMem = await WorkspaceMembership.findOne({
        workspaceId: teamWorkspace._id,
        userId: ownerUser._id,
      });
      expect(formerOwnerMem?.role).toBe('admin');

      const newOwnerMem = await WorkspaceMembership.findOne({
        workspaceId: teamWorkspace._id,
        userId: memberUser._id,
      });
      expect(newOwnerMem?.role).toBe('owner');

      // Transfer back to ownerUser for remaining tests
      currentMockSessionUser = memberUser;
      await transferWorkspaceOwnership(
        teamWorkspace._id.toString(),
        ownerUser._id.toString()
      );
      currentMockSessionUser = ownerUser;
    });
  });

  describe('3. Workspace Audit & Activity Log Retrieval', () => {
    it('retrieves workspace audit logs with formatted details and actor information', async () => {
      currentMockSessionUser = ownerUser;

      const res = await getWorkspaceAuditLogs(teamWorkspace._id.toString(), 20);
      expect(res.success).toBe(true);
      expect(Array.isArray(res.logs)).toBe(true);
      expect(res.logs.length).toBeGreaterThan(0);

      const statusLog = res.logs.find(
        (l: any) => l.details?.action === 'MEMBER_STATUS_CHANGE'
      );
      expect(statusLog).toBeDefined();
      expect(statusLog!.user).toBeDefined();
      expect(statusLog!.user.name).toBe('Workspace Owner');
    });
  });

  describe('4. Task Assignee Selection & Notifications', () => {
    let createdTaskId: string;
    let createdTaskSlug: string;

    it('creates a task assigned to a team member and generates TASK_ASSIGNED notification', async () => {
      currentMockSessionUser = ownerUser;

      const res = await createTask({
        title: 'Complete Sprint 42 API Migration',
        description: 'Migrate REST endpoints to Server Actions',
        priority: 'High',
        status: 'In Progress',
        assigneeId: memberUser._id.toString(),
      });

      expect(res.success).toBe(true);
      expect(res.task).toBeDefined();
      expect(res.task.assigneeId).toBe(memberUser._id.toString());
      createdTaskId = res.task._id;
      createdTaskSlug = res.task.slug;

      // Verify notification for assigned user
      const notif = await Notification.findOne({
        userId: memberUser._id,
        type: 'TASK_ASSIGNED',
        entityId: createdTaskId,
      });
      expect(notif).not.toBeNull();
      expect(notif?.title).toContain('Task Assigned');
    });

    it('retrieves tasks with populated assignee object in getTasks and getTaskBySlug', async () => {
      currentMockSessionUser = ownerUser;

      const { tasks } = await getTasks();
      const myTask = tasks.find((t: any) => t._id.toString() === createdTaskId);
      expect(myTask).toBeDefined();
      expect(myTask!.assigneeId).toBeDefined();
      expect(myTask!.assigneeId.name).toBe('Team Colleague');

      const bySlug = await getTaskBySlug(createdTaskSlug);
      expect(bySlug).not.toBeNull();
      expect(bySlug!.assigneeId.name).toBe('Team Colleague');
    });

    it('reassigns task to second member and sends reassignment notification', async () => {
      currentMockSessionUser = ownerUser;

      const res = await updateTask(createdTaskId, {
        assigneeId: secondMemberUser._id.toString(),
      });

      expect(res.success).toBe(true);

      const notif = await Notification.findOne({
        userId: secondMemberUser._id,
        type: 'TASK_ASSIGNED',
        entityId: createdTaskId,
      });
      expect(notif).not.toBeNull();
    });
  });

  describe('5. Task Comments & Team Discussions', () => {
    let testTaskId: string;
    let createdCommentId: string;

    beforeAll(async () => {
      const task = await Task.create({
        userId: ownerUser._id,
        workspaceId: teamWorkspace._id,
        title: 'Discussion Feature Test Task',
        slug: `disc-test-${Date.now()}`,
        assigneeId: memberUser._id,
        status: 'In Progress',
        priority: 'Medium',
      });
      testTaskId = task._id.toString();
    });

    it('allows a team member to comment on a task, notifying the creator and assignee', async () => {
      currentMockSessionUser = secondMemberUser;

      const res = await addTaskComment({
        taskId: testTaskId,
        content: 'I reviewed the initial PR and left notes on the schema.',
      });

      expect(res.success).toBe(true);
      expect(res.comment).toBeDefined();
      expect(res.comment!.content).toBe('I reviewed the initial PR and left notes on the schema.');
      expect(res.comment!.user.name).toBe('Second Teammate');
      createdCommentId = res.comment!._id;

      // Both owner and assignee should receive TASK_COMMENT notifications
      const ownerNotif = await Notification.findOne({
        userId: ownerUser._id,
        type: 'TASK_COMMENT',
        title: { $regex: /New Comment/ },
      });
      expect(ownerNotif).not.toBeNull();

      const assigneeNotif = await Notification.findOne({
        userId: memberUser._id,
        type: 'TASK_COMMENT',
        title: { $regex: /New Comment/ },
      });
      expect(assigneeNotif).not.toBeNull();

      expect(mockNotifySSE).toHaveBeenCalled();
      expect(mockFirebasePush).toHaveBeenCalled();
    });

    it('loads comments for a task populated with author information', async () => {
      currentMockSessionUser = memberUser;

      const res = await getTaskComments(testTaskId);
      expect(res.success).toBe(true);
      expect(res.comments.length).toBeGreaterThan(0);
      expect(res.comments[0].user.name).toBe('Second Teammate');
    });

    it('allows comment author or workspace owner to delete the comment', async () => {
      currentMockSessionUser = secondMemberUser; // author

      const res = await deleteTaskComment(createdCommentId);
      expect(res.success).toBe(true);

      const check = await TaskComment.findById(createdCommentId);
      expect(check).toBeNull();
    });
  });
});
