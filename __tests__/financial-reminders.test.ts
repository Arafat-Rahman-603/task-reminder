import 'dotenv/config';
import mongoose from 'mongoose';
import FinancialReminder from '@/models/FinancialReminder';
import Reminder from '@/models/Reminder';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import { Notification } from '@/models/Notification';
import { NotificationPreference } from '@/models/NotificationPreference';
import { processDueReminders } from '@/lib/notifications/reminder-processor';
import {
  createFinancialReminder,
  updateFinancialReminder,
  deleteFinancialReminder,
  completeFinancialReminderOccurrence,
  snoozeFinancialReminder,
  togglePauseFinancialReminder,
  skipFinancialReminderOccurrence,
  getFinancialReminders,
} from '@/actions/financialReminder.actions';
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

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import dbConnect from '@/lib/db';

describe('Financial Reminders & Upcoming Payments Test Suite', () => {
  jest.setTimeout(35000);

  let userAId: mongoose.Types.ObjectId;
  let userBId: mongoose.Types.ObjectId;
  let accountA: any;
  let accountB: any;

  beforeAll(async () => {
    await dbConnect();
  }, 30000);

  afterAll(async () => {
    try {
      if (userAId) {
        await Promise.all([
          FinancialReminder.deleteMany({ userId: { $in: [userAId, userBId] } }),
          Reminder.deleteMany({ userId: { $in: [userAId, userBId] } }),
          Account.deleteMany({ userId: { $in: [userAId, userBId] } }),
          Transaction.deleteMany({ userId: { $in: [userAId, userBId] } }),
          Notification.deleteMany({ userId: { $in: [userAId, userBId] } }),
          NotificationPreference.deleteMany({ userId: { $in: [userAId.toString(), userBId.toString()] } }),
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
    userAId = new mongoose.Types.ObjectId();
    userBId = new mongoose.Types.ObjectId();

    // Set default session to User A
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: userAId.toString(), email: 'usera@example.com' },
    });

    // Create accounts
    accountA = await Account.create({
      userId: userAId,
      name: 'User A Checking',
      balance: mongoose.Types.Decimal128.fromString('50000'),
      currency: 'BDT',
      type: 'checking',
      isActive: true,
      lowBalanceThreshold: mongoose.Types.Decimal128.fromString('5000'),
    });

    accountB = await Account.create({
      userId: userBId,
      name: 'User B Checking',
      balance: mongoose.Types.Decimal128.fromString('20000'),
      currency: 'BDT',
      type: 'checking',
      isActive: true,
    });

    // Create preferences
    await NotificationPreference.create({
      userId: userAId.toString(),
      pushEnabled: true,
      financialReminders: true,
      investmentReminders: true,
      taskReminders: true,
      routineReminders: true,
      quietHours: { enabled: false },
      timezone: 'UTC',
    });

    await NotificationPreference.create({
      userId: userBId.toString(),
      pushEnabled: true,
      financialReminders: true,
      investmentReminders: true,
      quietHours: { enabled: false },
      timezone: 'UTC',
    });
  });

  afterEach(async () => {
    if (userAId && userBId) {
      await Promise.all([
        FinancialReminder.deleteMany({ userId: { $in: [userAId, userBId] } }),
        Reminder.deleteMany({ userId: { $in: [userAId, userBId] } }),
        Account.deleteMany({ userId: { $in: [userAId, userBId] } }),
        Transaction.deleteMany({ userId: { $in: [userAId, userBId] } }),
        Notification.deleteMany({ userId: { $in: [userAId, userBId] } }),
        NotificationPreference.deleteMany({ userId: { $in: [userAId.toString(), userBId.toString()] } }),
      ]);
    }
  });

  describe('A. Reminder CRUD Operations', () => {
    it('creates a valid one-time bill reminder with scheduled notifications', async () => {
      const dueDate = new Date(Date.now() + 86400000 * 5); // 5 days in future
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const res = await createFinancialReminder({
        title: 'Electricity Bill',
        category: 'bill_utility',
        dueDate: dueDateStr,
        amount: 2500,
        currency: 'BDT',
        accountId: accountA._id.toString(),
        recurrence: 'none',
        advanceDays: [0, 1, 3],
      });

      expect(res.success).toBe(true);
      expect(res.reminder).toBeDefined();
      expect(res.reminder.title).toBe('Electricity Bill');
      expect(res.reminder.category).toBe('bill_utility');

      // Verify DB record
      const dbRecord = await FinancialReminder.findById(res.reminder._id);
      expect(dbRecord).not.toBeNull();
      expect(dbRecord.userId.toString()).toBe(userAId.toString());

      // Verify scheduled Reminder records generated for advance days
      const scheduled = await Reminder.find({
        userId: userAId,
        entityType: 'FinancialReminder',
        entityId: dbRecord._id,
      });
      expect(scheduled.length).toBe(3); // 0d, 1d, 3d
    });

    it('creates a recurring monthly subscription reminder', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const res = await createFinancialReminder({
        title: 'Cloudflare Workers Subscription',
        category: 'subscription',
        dueDate: dueDateStr,
        amount: 5,
        currency: 'USD',
        recurrence: 'monthly',
        recurrenceInterval: 1,
        advanceDays: [0, 1],
      });

      expect(res.success).toBe(true);
      expect(res.reminder.recurrence).toBe('monthly');
      expect(res.reminder.status).toBe('active');
    });

    it('updates an existing reminder and reconciles scheduled notifications', async () => {
      const dueDateStr = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
      const created = await createFinancialReminder({
        title: 'Internet Bill',
        category: 'bill_utility',
        dueDate: dueDateStr,
        amount: 1200,
        currency: 'BDT',
        advanceDays: [0, 1],
      });

      const updated = await updateFinancialReminder(created.reminder._id, {
        title: 'High-speed Fiber Internet',
        amount: 1500,
        advanceDays: [0, 1, 3],
      });

      expect(updated.success).toBe(true);
      expect(updated.reminder.title).toBe('High-speed Fiber Internet');
      expect(parseFloat(updated.reminder.amount)).toBe(1500);

      // Verify advance reminders were resynchronized to 3 items
      const scheduled = await Reminder.find({
        userId: userAId,
        entityType: 'FinancialReminder',
        entityId: created.reminder._id,
      });
      expect(scheduled.length).toBe(3);
    });

    it('deletes a reminder and cleans up all pending scheduled notifications', async () => {
      const dueDateStr = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
      const created = await createFinancialReminder({
        title: 'Gym Membership',
        category: 'subscription',
        dueDate: dueDateStr,
        advanceDays: [0, 1],
      });

      const delRes = await deleteFinancialReminder(created.reminder._id);
      expect(delRes.success).toBe(true);

      const dbRecord = await FinancialReminder.findById(created.reminder._id);
      expect(dbRecord).toBeNull();

      const remainingReminders = await Reminder.find({
        entityType: 'FinancialReminder',
        entityId: created.reminder._id,
      });
      expect(remainingReminders.length).toBe(0);
    });
  });

  describe('B. Recurrence Logic & Schedule Advancements', () => {
    it('advances monthly recurrence correctly and records occurrence history', async () => {
      // Due today
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const created = await createFinancialReminder({
        title: 'Apartment Rent',
        category: 'rent_housing',
        dueDate: todayStr,
        amount: 25000,
        currency: 'BDT',
        recurrence: 'monthly',
        recurrenceInterval: 1,
        advanceDays: [0, 1],
      });

      const reminderId = created.reminder._id;

      // Complete current occurrence without creating transaction
      const compRes = await completeFinancialReminderOccurrence(reminderId, {
        recordTransaction: false,
        notes: 'Paid via bank portal directly',
      });

      expect(compRes.success).toBe(true);
      expect(compRes.reminder.status).toBe('active'); // Still active because recurring
      expect(compRes.reminder.occurrenceCount).toBe(1);
      expect(compRes.reminder.history.length).toBe(1);

      // Next due date should be next month
      const nextDue = new Date(compRes.reminder.nextDueDate);
      const expectedMonth = (today.getMonth() + 1) % 12;
      expect(nextDue.getMonth()).toBe(expectedMonth);
    });

    it('terminates recurrence when after_occurrences limit is reached', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const created = await createFinancialReminder({
        title: 'Short Term Loan Installment',
        category: 'loan_installment',
        dueDate: todayStr,
        amount: 5000,
        recurrence: 'monthly',
        recurrenceEnd: {
          type: 'after_occurrences',
          occurrences: 2,
        },
      });

      const reminderId = created.reminder._id;

      // 1st completion
      await completeFinancialReminderOccurrence(reminderId, { recordTransaction: false });
      let record = await FinancialReminder.findById(reminderId);
      expect(record.status).toBe('active');
      expect(record.occurrenceCount).toBe(1);

      // 2nd completion
      await completeFinancialReminderOccurrence(reminderId, { recordTransaction: false });
      record = await FinancialReminder.findById(reminderId);
      expect(record.status).toBe('completed');
      expect(record.occurrenceCount).toBe(2);
    });

    it('allows pausing, resuming, and skipping an occurrence', async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const created = await createFinancialReminder({
        title: 'Weekly Cleaning Service',
        category: 'subscription',
        dueDate: todayStr,
        recurrence: 'weekly',
        recurrenceInterval: 1,
      });

      const reminderId = created.reminder._id;

      // Pause
      const pauseRes = await togglePauseFinancialReminder(reminderId);
      expect(pauseRes.success).toBe(true);
      expect(pauseRes.reminder.status).toBe('paused');

      // Pending reminders should be paused
      const pausedReminders = await Reminder.find({ entityId: reminderId });
      expect(pausedReminders.every((r) => r.status === 'paused')).toBe(true);

      // Resume
      const resumeRes = await togglePauseFinancialReminder(reminderId);
      expect(resumeRes.success).toBe(true);
      expect(resumeRes.reminder.status).toBe('active');

      // Skip occurrence
      const skipRes = await skipFinancialReminderOccurrence(reminderId);
      expect(skipRes.success).toBe(true);
      const advancedDue = new Date(skipRes.reminder.nextDueDate);
      expect(advancedDue.getTime()).toBeGreaterThan(today.getTime());
    });
  });

  describe('C. Financial Record Integration & Payment Completion', () => {
    it('creates an Expense transaction and updates account balance when paying a bill', async () => {
      const initialBalance = 50000;
      const billAmount = 3500;
      const todayStr = new Date().toISOString().split('T')[0];

      const created = await createFinancialReminder({
        title: 'Internet Service Provider',
        category: 'bill_utility',
        dueDate: todayStr,
        amount: billAmount,
        currency: 'BDT',
        accountId: accountA._id.toString(),
        recurrence: 'none',
      });

      const compRes = await completeFinancialReminderOccurrence(created.reminder._id, {
        recordTransaction: true,
        actualAmount: billAmount,
        accountId: accountA._id.toString(),
        paidDate: todayStr,
        notes: 'Monthly fiber internet bill paid',
      });

      expect(compRes.success).toBe(true);
      expect(compRes.transactionId).toBeDefined();

      // Verify transaction created
      const tx = await Transaction.findById(compRes.transactionId);
      expect(tx).not.toBeNull();
      expect(parseFloat(tx.amount.toString())).toBe(billAmount);
      expect(tx.type).toBe('expense');
      expect(tx.accountId.toString()).toBe(accountA._id.toString());
      expect(tx.userId.toString()).toBe(userAId.toString());

      // Verify account balance deducted correctly
      const updatedAccount = await Account.findById(accountA._id);
      expect(parseFloat(updatedAccount.balance.toString())).toBe(initialBalance - billAmount);
    });

    it('does NOT create a transaction when recordTransaction is false', async () => {
      const initialBalance = 50000;
      const todayStr = new Date().toISOString().split('T')[0];

      const created = await createFinancialReminder({
        title: 'Student Loan Payment',
        category: 'loan_installment',
        dueDate: todayStr,
        amount: 8000,
        currency: 'BDT',
        accountId: accountA._id.toString(),
        recurrence: 'none',
      });

      const compRes = await completeFinancialReminderOccurrence(created.reminder._id, {
        recordTransaction: false,
      });

      expect(compRes.success).toBe(true);
      expect(compRes.transactionId).toBeUndefined();

      // Account balance remains unchanged
      const updatedAccount = await Account.findById(accountA._id);
      expect(parseFloat(updatedAccount.balance.toString())).toBe(initialBalance);
    });
  });

  describe('D. Notification Processing & Idempotency', () => {
    it('generates exactly ONE notification when due and does not duplicate on repeat scheduler runs', async () => {
      // Create a financial reminder due right now
      const now = new Date();
      const pastDue = new Date(now.getTime() - 1000);

      const finReminder = await FinancialReminder.create({
        userId: userAId,
        title: 'Fixed Deposit Maturity Review',
        category: 'investment_maturity',
        dueDate: pastDue,
        nextDueDate: pastDue,
        amount: mongoose.Types.Decimal128.fromString('100000'),
        currency: 'BDT',
        recurrence: 'none',
        advanceDays: [0],
        status: 'active',
      });

      // Insert scheduled Reminder record
      await Reminder.create({
        userId: userAId,
        entityType: 'FinancialReminder',
        entityId: finReminder._id,
        title: 'Maturity Due: Fixed Deposit Maturity Review',
        remindAt: pastDue,
        status: 'pending',
      });

      // First run of due reminders processor
      await processDueReminders();

      // Verify Notification was created
      const notifs = await Notification.find({
        userId: userAId,
        entityType: 'FINANCIAL_REMINDER',
        entityId: finReminder._id.toString(),
      });
      expect(notifs.length).toBe(1);
      expect(notifs[0].title).toBe('Investment Matures Today 🎯');
      expect(notifs[0].body).toContain('Fixed Deposit Maturity Review');
      expect(notifs[0].body).toContain('100000');

      // Scheduled Reminder should now be 'sent'
      const schedRecord = await Reminder.findOne({ entityId: finReminder._id });
      expect(schedRecord.status).toBe('sent');

      // Second run: Simulate immediate retry or second worker
      await processDueReminders();

      // Must remain exactly 1 notification
      const notifsAfterRetry = await Notification.find({
        userId: userAId,
        entityType: 'FINANCIAL_REMINDER',
        entityId: finReminder._id.toString(),
      });
      expect(notifsAfterRetry.length).toBe(1);
    });

    it('respects user preference and skips delivery if financialReminders is disabled', async () => {
      // Disable financialReminders in preference
      await NotificationPreference.updateOne(
        { userId: userAId.toString() },
        { financialReminders: false }
      );

      const pastDue = new Date(Date.now() - 5000);
      const finReminder = await FinancialReminder.create({
        userId: userAId,
        title: 'Car Insurance Renewal',
        category: 'insurance_premium',
        dueDate: pastDue,
        nextDueDate: pastDue,
        recurrence: 'none',
        advanceDays: [0],
        status: 'active',
      });

      await Reminder.create({
        userId: userAId,
        entityType: 'FinancialReminder',
        entityId: finReminder._id,
        title: 'Car Insurance Renewal',
        remindAt: pastDue,
        status: 'pending',
      });

      await processDueReminders();

      const notifs = await Notification.find({
        userId: userAId,
        entityId: finReminder._id.toString(),
      });
      expect(notifs.length).toBe(0);
    });
  });

  describe('E. Security & Personal Financial Isolation', () => {
    it('prevents User A from reading User B reminders', async () => {
      // Create reminder for User B
      await FinancialReminder.create({
        userId: userBId,
        title: "User B's Private Salary",
        category: 'salary_income',
        dueDate: new Date(),
        nextDueDate: new Date(),
        amount: mongoose.Types.Decimal128.fromString('90000'),
        currency: 'BDT',
        recurrence: 'monthly',
        status: 'active',
      });

      // User A queries reminders
      const res = await getFinancialReminders({ status: 'all' });
      expect(res.success).toBe(true);
      expect(res.reminders.some((r: any) => r.title.includes("User B's Private Salary"))).toBe(false);
    });

    it('prevents User A from modifying or deleting User B reminder', async () => {
      const userBReminder = await FinancialReminder.create({
        userId: userBId,
        title: "User B's Secret Dividend",
        category: 'dividend_interest',
        dueDate: new Date(),
        nextDueDate: new Date(),
        recurrence: 'none',
        status: 'active',
      });

      // User A attempts to update User B's reminder
      const updateRes = await updateFinancialReminder(userBReminder._id.toString(), {
        title: 'Hacked Title',
      });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toMatch(/not found/i);

      // User A attempts to delete User B's reminder
      const delRes = await deleteFinancialReminder(userBReminder._id.toString());
      expect(delRes.success).toBe(false);
      expect(delRes.error).toMatch(/not found/i);

      // Verify User B's reminder remains unchanged
      const intact = await FinancialReminder.findById(userBReminder._id);
      expect(intact).not.toBeNull();
      expect(intact.title).toBe("User B's Secret Dividend");
    });

    it('prevents linking a reminder to an account owned by another user', async () => {
      // User A attempts to create a reminder linked to User B's account
      const res = await createFinancialReminder({
        title: 'Malicious Link Attempt',
        category: 'bill_utility',
        dueDate: new Date().toISOString().split('T')[0],
        accountId: accountB._id.toString(), // Account belongs to User B!
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/access denied/i);
    });
  });
});
