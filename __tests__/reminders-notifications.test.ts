import 'dotenv/config';
import mongoose from 'mongoose';
import Reminder from '@/models/Reminder';
import Task from '@/models/Task';
import Routine from '@/models/Routine';
import { Notification } from '@/models/Notification';
import { NotificationPreference } from '@/models/NotificationPreference';
import { processDueReminders, processDailySummaries } from '@/lib/notifications/reminder-processor';

// Mock Firebase Push Notification delivery
const mockSendPushNotification = jest.fn().mockResolvedValue({
  successCount: 1,
  failureCount: 0,
});
jest.mock('@/lib/notifications/firebase-server', () => ({
  sendPushNotification: (...args: unknown[]) => mockSendPushNotification(...args),
}));

import dbConnect from '@/lib/db';

describe('Reminder & Notification Integration Tests', () => {
  let testUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await dbConnect();
  }, 30000);

  afterAll(async () => {
    try {
      if (testUserId) {
        await Reminder.deleteMany({ userId: testUserId });
        await Task.deleteMany({ userId: testUserId });
        await Routine.deleteMany({ userId: testUserId });
        await Notification.deleteMany({ userId: testUserId });
        await NotificationPreference.deleteMany({ userId: testUserId.toString() });
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

    await NotificationPreference.create({
      userId: testUserId.toString(),
      pushEnabled: true,
      taskReminders: true,
      routineReminders: true,
      dailyOverview: { enabled: false },
      morningSummary: { enabled: false },
      quietHours: { enabled: false },
      timezone: 'UTC',
    });
  });

  afterEach(async () => {
    if (testUserId) {
      await Reminder.deleteMany({ userId: testUserId });
      await Task.deleteMany({ userId: testUserId });
      await Routine.deleteMany({ userId: testUserId });
      await Notification.deleteMany({ userId: testUserId });
      await NotificationPreference.deleteMany({ userId: testUserId.toString() });
    }
  });

  describe('1. Real Task Reminder Flow & Persistence', () => {
    it('persists exactly ONE Notification record in DB when a task reminder is due', async () => {
      const task = await Task.create({
        userId: testUserId,
        title: 'Review Quarterly Budget',
        slug: `budget-${Date.now()}`,
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(Date.now() + 86400000),
      });

      const remindAt = new Date(Date.now() - 60000);
      const reminder = await Reminder.create({
        userId: testUserId,
        entityType: 'Task',
        entityId: task._id,
        remindAt,
        status: 'pending',
        notificationType: 'in-app',
      });

      const result = await processDueReminders({ userId: testUserId.toString() });

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(result.sentCount).toBe(1);

      const notifications = await Notification.find({ userId: testUserId });
      expect(notifications.length).toBe(1);

      const notif = notifications[0];
      expect(notif.type).toBe('TASK_REMINDER');
      expect(notif.title).toBe('Task Reminder ⏰');
      expect(notif.body).toContain('Review Quarterly Budget');
      expect(notif.url).toBe(`/dashboard/tasks/${task.slug}`);
      expect(notif.entityType).toBe('TASK');
      expect(notif.entityId).toBe(task._id.toString());
      expect(notif.status).toBe('SENT');
      expect(notif.metadata?.reminderId).toBe(reminder._id.toString());
      expect(notif.metadata?.priority).toBe('high');

      const updatedReminder = await Reminder.findById(reminder._id);
      expect(updatedReminder.status).toBe('sent');

      expect(mockSendPushNotification).toHaveBeenCalledTimes(1);
    });

    it('is idempotent: repeated scheduler runs NEVER create duplicate notifications', async () => {
      const task = await Task.create({
        userId: testUserId,
        title: 'Submit Tax Documents',
        slug: `tax-${Date.now()}`,
        status: 'In Progress',
        priority: 'Medium',
      });

      const remindAt = new Date(Date.now() - 120000);
      const reminder = await Reminder.create({
        userId: testUserId,
        entityType: 'Task',
        entityId: task._id,
        remindAt,
        status: 'pending',
      });

      const result1 = await processDueReminders({ userId: testUserId.toString() });
      expect(result1.processedCount).toBe(1);

      const result2 = await processDueReminders({ userId: testUserId.toString() });
      expect(result2.processedCount).toBe(0);

      // Simulate retry with status set back to pending
      await Reminder.updateOne({ _id: reminder._id }, { $set: { status: 'pending' } });
      const result3 = await processDueReminders({ userId: testUserId.toString() });

      expect(result3.processedCount).toBe(1);
      expect(result3.sentCount).toBe(0); // Duplicate prevented

      const notifications = await Notification.find({ userId: testUserId });
      expect(notifications.length).toBe(1);
    });
  });

  describe('2. Real Routine Reminder Flow', () => {
    it('persists Routine notification and schedules next recurring occurrence', async () => {
      const routine = await Routine.create({
        userId: testUserId,
        name: 'Morning Routine',
        schedule: ['Daily'],
        isActive: true,
      });

      const remindAt = new Date(Date.now() - 30000);
      await Reminder.create({
        userId: testUserId,
        entityType: 'Routine',
        entityId: routine._id,
        remindAt,
        status: 'pending',
        metadata: { isMainReminder: true },
      });

      const result = await processDueReminders({ userId: testUserId.toString() });
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);

      const notifs = await Notification.find({ userId: testUserId });
      expect(notifs.length).toBe(1);
      expect(notifs[0].type).toBe('ROUTINE_REMINDER');
      expect(notifs[0].title).toBe('Routine Time 🔁');
      expect(notifs[0].body).toContain('Morning Routine');
      expect(notifs[0].url).toBe('/dashboard/routines');

      const pendingReminders = await Reminder.find({
        userId: testUserId,
        entityType: 'Routine',
        entityId: routine._id,
        status: 'pending',
        'metadata.isMainReminder': true,
      });
      expect(pendingReminders.length).toBe(1);
      expect(pendingReminders[0].remindAt.getTime()).toBeGreaterThan(remindAt.getTime());
    });
  });

  describe('3. Concurrency Safety', () => {
    it('concurrent workers processing the same reminder create exactly ONE notification', async () => {
      const task = await Task.create({
        userId: testUserId,
        title: 'Concurrent Test Task',
        slug: `concurrent-${Date.now()}`,
        status: 'In Progress',
      });

      const remindAt = new Date(Date.now() - 50000);
      await Reminder.create({
        userId: testUserId,
        entityType: 'Task',
        entityId: task._id,
        remindAt,
        status: 'pending',
      });

      await Promise.all([
        processDueReminders({ userId: testUserId.toString() }),
        processDueReminders({ userId: testUserId.toString() }),
        processDueReminders({ userId: testUserId.toString() }),
      ]);

      const notifications = await Notification.find({ userId: testUserId });
      expect(notifications.length).toBe(1);
    });
  });

  describe('4. User Preference Filtering', () => {
    it('does not send task reminders if user disabled task reminders in preferences', async () => {
      await NotificationPreference.updateOne(
        { userId: testUserId.toString() },
        { $set: { taskReminders: false } }
      );

      const task = await Task.create({
        userId: testUserId,
        title: 'Ignored Task',
        slug: `ignored-${Date.now()}`,
        status: 'In Progress',
      });

      await Reminder.create({
        userId: testUserId,
        entityType: 'Task',
        entityId: task._id,
        remindAt: new Date(Date.now() - 10000),
        status: 'pending',
      });

      await processDueReminders({ userId: testUserId.toString() });

      const notifications = await Notification.find({ userId: testUserId });
      expect(notifications.length).toBe(0);
    });

    it('creates in-app Notification even when push is disabled (in-app fallback)', async () => {
      await NotificationPreference.updateOne(
        { userId: testUserId.toString() },
        { $set: { pushEnabled: false } }
      );

      const task = await Task.create({
        userId: testUserId,
        title: 'In-App Only Task',
        slug: `inapp-${Date.now()}`,
        status: 'In Progress',
      });

      await Reminder.create({
        userId: testUserId,
        entityType: 'Task',
        entityId: task._id,
        remindAt: new Date(Date.now() - 10000),
        status: 'pending',
      });

      await processDueReminders({ userId: testUserId.toString() });

      const notifications = await Notification.find({ userId: testUserId });
      expect(notifications.length).toBe(1);
      expect(notifications[0].status).toBe('SENT');
      expect(notifications[0].title).toBe('Task Reminder ⏰');
      expect(notifications[0].body).toContain('In-App Only Task');
      expect(mockSendPushNotification).not.toHaveBeenCalled();
    });
  });

  describe('5. Midnight Overview & Morning Summary Integration', () => {
    it('generates Midnight Daily Overview at 12:00 AM user-local time idempotently', async () => {
      const midnightUser = new mongoose.Types.ObjectId();
      await NotificationPreference.create({
        userId: midnightUser,
        pushEnabled: false,
        dailyOverview: { enabled: true, time: '00:00' },
        timezone: 'Asia/Dhaka',
      });

      await Task.create({
        userId: midnightUser,
        slug: 'midnight-task',
        title: 'Midnight Prep Task',
        status: 'Planned',
        dueDate: new Date(),
      });

      const result1 = await processDailySummaries({
        userId: midnightUser.toString(),
        forceType: 'MIDNIGHT_OVERVIEW',
      });
      expect(result1.midnightSent).toBe(1);

      const notifs = await Notification.find({
        userId: midnightUser,
        type: 'DAILY_SUMMARY',
      });
      expect(notifs.length).toBe(1);
      expect(notifs[0].title).toBe('Your Day Overview is Ready 🌙');
      expect(notifs[0].body).toContain('1 task');

      // Idempotency: second run NEVER creates duplicate
      const result2 = await processDailySummaries({
        userId: midnightUser.toString(),
        forceType: 'MIDNIGHT_OVERVIEW',
      });
      expect(result2.midnightSent).toBe(0);

      const notifsAfter = await Notification.find({
        userId: midnightUser,
        type: 'DAILY_SUMMARY',
      });
      expect(notifsAfter.length).toBe(1);
    });

    it('generates Morning Summary with real data and custom configured time', async () => {
      const morningUser = new mongoose.Types.ObjectId();
      await NotificationPreference.create({
        userId: morningUser,
        pushEnabled: false,
        morningSummary: { enabled: true, time: '08:30' },
        timezone: 'Asia/Dhaka',
      });

      await Task.create({
        userId: morningUser,
        slug: 'morning-task',
        title: 'Morning Code Review',
        status: 'Planned',
        dueDate: new Date(),
        dueTime: '09:00',
      });

      const result1 = await processDailySummaries({
        userId: morningUser.toString(),
        forceType: 'MORNING_SUMMARY',
      });
      expect(result1.morningSent).toBe(1);

      const notifs = await Notification.find({
        userId: morningUser,
        type: 'MORNING_SUMMARY',
      });
      expect(notifs.length).toBe(1);
      expect(notifs[0].title).toContain('Good morning');
      expect(notifs[0].body).toContain('Start with your 9:00 AM task');

      // Idempotency: second run NEVER creates duplicate
      const result2 = await processDailySummaries({
        userId: morningUser.toString(),
        forceType: 'MORNING_SUMMARY',
      });
      expect(result2.morningSent).toBe(0);

      const notifsAfter = await Notification.find({
        userId: morningUser,
        type: 'MORNING_SUMMARY',
      });
      expect(notifsAfter.length).toBe(1);
    });
  });
});
