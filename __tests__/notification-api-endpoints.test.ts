import 'dotenv/config';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { Notification } from '@/models/Notification';
import { NotificationPreference } from '@/models/NotificationPreference';
import { PushRegistration } from '@/models/PushRegistration';
import Reminder from '@/models/Reminder';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth';

// Mock dependencies
const mockSendPushNotification = jest.fn().mockResolvedValue({
  successCount: 1,
  failureCount: 0,
});
jest.mock('@/lib/notifications/firebase-server', () => ({
  sendPushNotification: (...args: unknown[]) => mockSendPushNotification(...args),
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { GET as getNotifications, POST as postNotification, PATCH as patchNotification, DELETE as deleteNotification } from '@/app/api/notifications/route';
import { GET as getPreferences, PUT as putPreferences } from '@/app/api/notifications/preferences/route';
import { GET as getHealth } from '@/app/api/notifications/health/route';
import { POST as syncSubscription } from '@/app/api/notifications/sync-subscription/route';
import { POST as testNotification } from '@/app/api/notifications/test/route';
import { GET as cronRoute } from '@/app/api/notifications/cron/route';

describe('Notification API Endpoints Comprehensive Verification', () => {
  jest.setTimeout(35000);
  let testUserId: mongoose.Types.ObjectId;
  let testUser: any;

  beforeAll(async () => {
    await dbConnect();
  }, 30000);

  afterAll(async () => {
    try {
      if (testUserId) {
        await Promise.all([
          Notification.deleteMany({ userId: testUserId }),
          NotificationPreference.deleteMany({ userId: { $in: [testUserId, testUserId.toString()] } }),
          PushRegistration.deleteMany({ userId: testUserId }),
          Reminder.deleteMany({ userId: testUserId }),
          Task.deleteMany({ userId: testUserId }),
          User.deleteMany({ _id: testUserId }),
        ]);
      }
    } finally {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    testUserId = new mongoose.Types.ObjectId();

    testUser = await User.create({
      _id: testUserId,
      name: 'Notification Tester',
      email: `notif-tester-${Date.now()}@example.com`,
      passwordHash: 'dummy-hash',
      preferences: { timezone: 'UTC' },
    });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUserId.toString(), email: testUser.email, name: testUser.name },
    });
  });

  afterEach(async () => {
    if (testUserId) {
      await Promise.all([
        Notification.deleteMany({ userId: testUserId }),
        NotificationPreference.deleteMany({ userId: { $in: [testUserId, testUserId.toString()] } }),
        PushRegistration.deleteMany({ userId: testUserId }),
        Reminder.deleteMany({ userId: testUserId }),
        Task.deleteMany({ userId: testUserId }),
        User.deleteMany({ _id: testUserId }),
      ]);
    }
  });

  describe('1. CRUD /api/notifications', () => {
    it('creates notification via POST with idempotency check', async () => {
      const payload = {
        title: 'FCM Task Due',
        body: 'Your high priority task is due now',
        type: 'TASK_REMINDER',
        entityId: new mongoose.Types.ObjectId().toString(),
        notificationId: `notif-${Date.now()}`,
        url: '/dashboard/tasks',
      };

      const req1 = new Request('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res1 = await postNotification(req1);
      const data1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data1.id).toBeDefined();

      // Second identical POST should be idempotent and skip duplicate creation
      const req2 = new Request('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res2 = await postNotification(req2);
      const data2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(data2.exists).toBe(true);
      expect(data2.id).toBe(data1.id);

      const count = await Notification.countDocuments({ userId: testUserId });
      expect(count).toBe(1);
    });

    it('retrieves notifications via GET and formats correctly', async () => {
      await Notification.create({
        userId: testUserId,
        type: 'TASK_REMINDER',
        title: 'Test Notification 1',
        body: 'Details 1',
        url: '/dashboard/tasks',
        status: 'SENT',
        sentAt: new Date(),
        metadata: { priority: 'high' },
      });

      const res = await getNotifications();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.notifications)).toBe(true);
      expect(data.notifications.length).toBe(1);
      expect(data.notifications[0].title).toBe('Test Notification 1');
      expect(data.notifications[0].priority).toBe('high');
      expect(data.notifications[0].read).toBe(false);
      expect(data.notifications[0].link).toBe('/dashboard/tasks');
    });

    it('updates read status and marks all read via PATCH', async () => {
      const notif1 = await Notification.create({
        userId: testUserId,
        type: 'SYSTEM',
        title: 'Unread 1',
        body: 'Body 1',
        status: 'SENT',
      });
      const notif2 = await Notification.create({
        userId: testUserId,
        type: 'SYSTEM',
        title: 'Unread 2',
        body: 'Body 2',
        status: 'SENT',
      });

      // Toggle single read
      const reqSingle = new Request('http://localhost:3000/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif1._id.toString(), read: true }),
      });
      const resSingle = await patchNotification(reqSingle);
      expect(resSingle.status).toBe(200);

      const check1 = await Notification.findById(notif1._id);
      expect(check1?.readAt).toBeDefined();

      // Mark all read
      const reqAll = new Request('http://localhost:3000/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      const resAll = await patchNotification(reqAll);
      expect(resAll.status).toBe(200);

      const unreadCount = await Notification.countDocuments({ userId: testUserId, readAt: { $exists: false } });
      expect(unreadCount).toBe(0);
    });

    it('deletes single notification and all notifications via DELETE', async () => {
      const notif1 = await Notification.create({
        userId: testUserId,
        type: 'SYSTEM',
        title: 'To Delete 1',
        body: 'Body',
        status: 'SENT',
      });
      const notif2 = await Notification.create({
        userId: testUserId,
        type: 'SYSTEM',
        title: 'To Delete 2',
        body: 'Body',
        status: 'SENT',
      });

      // Delete single
      const reqSingle = new Request(`http://localhost:3000/api/notifications?id=${notif1._id}`, {
        method: 'DELETE',
      });
      const resSingle = await deleteNotification(reqSingle);
      expect(resSingle.status).toBe(200);

      const remainingAfterSingle = await Notification.find({ userId: testUserId });
      expect(remainingAfterSingle.length).toBe(1);
      expect(remainingAfterSingle[0]._id.toString()).toBe(notif2._id.toString());

      // Delete all
      const reqAll = new Request('http://localhost:3000/api/notifications?action=deleteAll', {
        method: 'DELETE',
      });
      const resAll = await deleteNotification(reqAll);
      expect(resAll.status).toBe(200);

      const remainingTotal = await Notification.countDocuments({ userId: testUserId });
      expect(remainingTotal).toBe(0);
    });
  });

  describe('2. Preferences /api/notifications/preferences', () => {
    it('creates default preferences on GET if none exist', async () => {
      const req = new Request('http://localhost:3000/api/notifications/preferences?timezone=Asia/Dhaka');
      const res = await getPreferences(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.preferences).toBeDefined();
      expect(data.preferences.taskReminders).toBe(true);
      expect(data.preferences.routineReminders).toBe(true);
      expect(data.preferences.dailyOverview.enabled).toBe(true);
      expect(data.preferences.morningSummary.enabled).toBe(true);
      expect(data.preferences.timezone).toBe('Asia/Dhaka');
    });

    it('updates preferences via PUT and syncs timezone to User model', async () => {
      const req = new Request('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pushEnabled: true,
          quietHours: { enabled: true, start: '23:00', end: '07:00' },
          timezone: 'America/New_York',
        }),
      });

      const res = await putPreferences(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.preferences.pushEnabled).toBe(true);
      expect(data.preferences.quietHours.enabled).toBe(true);
      expect(data.preferences.timezone).toBe('America/New_York');

      const userAfter = await User.findById(testUserId);
      expect(userAfter?.preferences?.timezone).toBe('America/New_York');
    });
  });

  describe('3. Sync Subscription & Health Status Flow', () => {
    it('returns NOT_CONFIGURED when user has no preference record', async () => {
      const res = await getHealth();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.status).toBe('NOT_CONFIGURED');
    });

    it('returns DISABLED when push is disabled in preferences', async () => {
      await NotificationPreference.create({
        userId: testUserId,
        pushEnabled: false,
      });

      const res = await getHealth();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.status).toBe('DISABLED');
    });

    it('returns SERVER_SYNC_PROBLEM when push is enabled but no FCM registration', async () => {
      await NotificationPreference.create({
        userId: testUserId,
        pushEnabled: true,
      });

      const res = await getHealth();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.status).toBe('SERVER_SYNC_PROBLEM');
    });

    it('syncs subscription and returns HEALTHY after FCM token registration', async () => {
      const syncReq = new Request('http://localhost:3000/api/notifications/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fcmToken: 'test-fcm-device-token-12345',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          platform: 'Win32',
        }),
      });

      const syncRes = await syncSubscription(syncReq);
      const syncData = await syncRes.json();

      expect(syncRes.status).toBe(200);
      expect(syncData.success).toBe(true);

      const reg = await PushRegistration.findOne({ fcmToken: 'test-fcm-device-token-12345' });
      expect(reg).toBeDefined();
      expect(reg?.isActive).toBe(true);
      expect(reg?.userId.toString()).toBe(testUserId.toString());

      // Health should now report HEALTHY
      const healthRes = await getHealth();
      const healthData = await healthRes.json();
      expect(healthRes.status).toBe(200);
      expect(healthData.status).toBe('HEALTHY');
      expect(healthData.subscribed).toBe(true);
      expect(healthData.serviceWorkerReady).toBe(true);
    });
  });

  describe('4. Test Notification /api/notifications/test', () => {
    it('returns 400 if push is disabled', async () => {
      await NotificationPreference.create({
        userId: testUserId,
        pushEnabled: false,
      });

      const res = await testNotification();
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('not enabled');
    });

    it('sends test notification via Firebase server when enabled and registered', async () => {
      await NotificationPreference.create({
        userId: testUserId,
        pushEnabled: true,
      });
      await PushRegistration.create({
        userId: testUserId,
        fcmToken: 'token-for-test-notif',
        isActive: true,
        lastSeenAt: new Date(),
      });

      const res = await testNotification();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId.toString(),
          title: 'Manageo Test Notification',
        })
      );
    });
  });

  describe('5. Cron Worker /api/notifications/cron', () => {
    it('executes processDueReminders and returns statistics', async () => {
      await NotificationPreference.create({
        userId: testUserId,
        pushEnabled: true,
        taskReminders: true,
      });

      const task = await Task.create({
        userId: testUserId,
        title: 'Cron Scheduled Task',
        slug: `cron-task-${Date.now()}`,
        status: 'In Progress',
      });

      await Reminder.create({
        userId: testUserId,
        entityType: 'Task',
        entityId: task._id,
        remindAt: new Date(Date.now() - 10000),
        status: 'pending',
      });

      // Verify that unauthorized request is rejected if CRON_SECRET is configured
      if (process.env.CRON_SECRET) {
        const unauthReq = new Request('http://localhost:3000/api/notifications/cron');
        const unauthRes = await cronRoute(unauthReq);
        expect(unauthRes.status).toBe(401);
      }

      // Authorized request
      const cronUrl = process.env.CRON_SECRET 
        ? `http://localhost:3000/api/notifications/cron?key=${process.env.CRON_SECRET}` 
        : 'http://localhost:3000/api/notifications/cron';
      const req = new Request(cronUrl);
      const res = await cronRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processedCount).toBeGreaterThanOrEqual(1);
      expect(data.sentCount).toBeGreaterThanOrEqual(1);

      const notifs = await Notification.find({ userId: testUserId });
      console.log('Cron generated notifications:', notifs.map(n => ({ type: n.type, title: n.title })));
      const taskNotif = notifs.find(n => n.type === 'TASK_REMINDER');
      expect(taskNotif).toBeDefined();
      expect(taskNotif?.title).toBe('Task Reminder ⏰');
    });
  });
});
