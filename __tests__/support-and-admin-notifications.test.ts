import 'dotenv/config';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import SupportTicket from '@/models/SupportTicket';
import { Notification } from '@/models/Notification';
import {
  createSupportTicket,
  replyToSupportTicket,
  markTicketReadByUser,
  markTicketReadByStaff,
  getUnreadSupportCounts,
} from '@/actions/ticket.actions';
import {
  sendTargetedAdminMessage,
  broadcastPlatformNotification,
  sendDirectUserMessage,
} from '@/actions/admin.actions';

// Mock dependencies
const mockFirebasePush = jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 });
const mockOneSignalPush = jest.fn().mockResolvedValue({ id: 'os-123', recipients: 1 });
const mockSendEmail = jest.fn().mockResolvedValue({ id: 'email-123' });
const mockNotifySSE = jest.fn();

jest.mock('@/lib/notifications/firebase-server', () => ({
  sendPushNotification: (...args: unknown[]) => mockFirebasePush(...args),
}));

jest.mock('@/lib/notifications/onesignal-server', () => ({
  sendPushNotification: (...args: unknown[]) => mockOneSignalPush(...args),
}));

jest.mock('@/lib/email/resend', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

jest.mock('@/lib/notifications/sse-service', () => ({
  notifyUserViaSSE: (...args: unknown[]) => mockNotifySSE(...args),
}));

let currentMockSessionUser: any = null;

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => {
    if (!currentMockSessionUser) return null;
    return {
      user: {
        id: currentMockSessionUser._id.toString(),
        email: currentMockSessionUser.email,
        name: currentMockSessionUser.name,
      },
    };
  }),
}));

describe('Support & Admin Multi-Channel Notifications Verification', () => {
  jest.setTimeout(35000);

  let customerUser: any;
  let supportStaffUser: any;
  let platformAdminUser: any;
  let secondaryCustomer: any;

  beforeAll(async () => {
    await dbConnect();

    // Setup test users
    customerUser = await User.create({
      name: 'Customer Arafat',
      email: `customer-${Date.now()}@example.com`,
      passwordHash: 'hashed_pw',
      emailVerified: new Date(),
      subscription: { plan: 'free', status: 'active' },
    });

    secondaryCustomer = await User.create({
      name: 'Customer Bilkis',
      email: `customer-bilkis-${Date.now()}@example.com`,
      passwordHash: 'hashed_pw',
      emailVerified: new Date(),
      subscription: { plan: 'pro', status: 'active' },
    });

    supportStaffUser = await User.create({
      name: 'Agent Sarah',
      email: `agent-${Date.now()}@example.com`,
      passwordHash: 'hashed_pw',
      emailVerified: new Date(),
      isSupportTeam: true,
    });

    platformAdminUser = await User.create({
      name: 'Admin Boss',
      email: `admin-${Date.now()}@example.com`,
      passwordHash: 'hashed_pw',
      emailVerified: new Date(),
      isPlatformAdmin: true,
    });
  });

  afterAll(async () => {
    try {
      const userIds = [
        customerUser?._id,
        secondaryCustomer?._id,
        supportStaffUser?._id,
        platformAdminUser?._id,
      ].filter(Boolean);

      await Promise.all([
        SupportTicket.deleteMany({ userId: { $in: userIds } }),
        Notification.deleteMany({ userId: { $in: userIds } }),
        User.deleteMany({ _id: { $in: userIds } }),
      ]);
    } finally {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Customer creates support ticket -> sets staffHasUnread=true and notifies staff', async () => {
    currentMockSessionUser = customerUser;

    const res = await createSupportTicket({
      subject: 'Login OTP Issue',
      category: 'account',
      priority: 'high',
      message: 'I cannot receive the login OTP code in my inbox.',
    });

    expect(res.success).toBe(true);
    expect(res.ticketId).toBeDefined();

    const ticket = await SupportTicket.findById(res.ticketId);
    expect(ticket).toBeTruthy();
    expect(ticket?.staffHasUnread).toBe(true);
    expect(ticket?.userHasUnread).toBe(false);

    // Staff unread count should reflect 1 unread ticket
    currentMockSessionUser = supportStaffUser;
    const counts = await getUnreadSupportCounts();
    expect(counts.staffUnreadSupportCount).toBeGreaterThanOrEqual(1);
  });

  test('Staff replies to support ticket -> triggers Multi-Channel Notifications (In-App, SSE, FCM, OneSignal, Email)', async () => {
    // Fetch customer's ticket
    const ticket = await SupportTicket.findOne({ userId: customerUser._id });
    expect(ticket).toBeTruthy();

    // Switch session to support agent
    currentMockSessionUser = supportStaffUser;

    const replyRes = await replyToSupportTicket(ticket!._id.toString(), {
      message: 'Hello! Please check your spam folder as the OTP might have landed there.',
    });

    expect(replyRes.success).toBe(true);

    // Verify ticket state updated
    const updatedTicket = await SupportTicket.findById(ticket!._id);
    expect(updatedTicket?.userHasUnread).toBe(true);
    expect(updatedTicket?.staffHasUnread).toBe(false);

    // Check In-App Notification created for the customer
    const notif = await Notification.findOne({
      userId: customerUser._id,
      title: new RegExp(ticket!.ticketNumber),
    });
    expect(notif).toBeTruthy();
    expect(notif?.body || notif?.message).toContain('Please check your spam folder');

    // Verify SSE real-time broadcast was sent
    expect(mockNotifySSE).toHaveBeenCalledWith(
      customerUser._id.toString(),
      expect.objectContaining({
        type: 'support_reply',
        link: '/dashboard/support',
      })
    );

    // Verify Native Web Push (Firebase FCM) was triggered
    expect(mockFirebasePush).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: customerUser._id.toString(),
        type: 'support_reply',
        url: '/dashboard/support',
      })
    );

    // Verify OneSignal Push was triggered
    expect(mockOneSignalPush).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: customerUser._id.toString(),
        type: 'support_reply',
        url: '/dashboard/support',
      })
    );

    // Verify Transactional Email was dispatched
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: customerUser.email,
        subject: expect.stringContaining(ticket!.ticketNumber),
      })
    );
  });

  test('Customer reading ticket marks userHasUnread=false and clears unread count', async () => {
    currentMockSessionUser = customerUser;

    // Check counts before reading
    let counts = await getUnreadSupportCounts();
    expect(counts.unreadSupportCount).toBeGreaterThanOrEqual(1);

    const ticket = await SupportTicket.findOne({ userId: customerUser._id });
    expect(ticket?.userHasUnread).toBe(true);

    // Mark as read by customer
    await markTicketReadByUser(ticket!._id.toString());

    // Verify db updated
    const refreshed = await SupportTicket.findById(ticket!._id);
    expect(refreshed?.userHasUnread).toBe(false);

    // Check counts after reading
    counts = await getUnreadSupportCounts();
    expect(counts.unreadSupportCount).toBe(0);
  });

  test('Admin sends targeted notice to Selected Accounts -> triggers In-App, SSE, and Push', async () => {
    currentMockSessionUser = platformAdminUser;

    const res = await sendTargetedAdminMessage({
      targetType: 'selected',
      targetIds: [customerUser._id.toString(), secondaryCustomer._id.toString()],
      subject: 'Critical Platform Maintenance Notice',
      message: 'System upgrade scheduled tonight at 12:00 AM UTC.',
      sendEmailToUsers: true,
      sendNotificationToUsers: true,
    });

    expect(res.success).toBe(true);
    expect(res.recipientCount).toBe(2);
    expect(res.notifCount).toBe(2);

    // Verify notifications exist in DB
    const notifications = await Notification.find({
      userId: { $in: [customerUser._id, secondaryCustomer._id] },
      title: 'Critical Platform Maintenance Notice',
    });
    expect(notifications.length).toBe(2);

    // Verify SSE was pushed to both users
    expect(mockNotifySSE).toHaveBeenCalledWith(
      customerUser._id.toString(),
      expect.objectContaining({ title: 'Critical Platform Maintenance Notice' })
    );
    expect(mockNotifySSE).toHaveBeenCalledWith(
      secondaryCustomer._id.toString(),
      expect.objectContaining({ title: 'Critical Platform Maintenance Notice' })
    );

    // Verify Push notifications triggered for both
    expect(mockFirebasePush).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: customerUser._id.toString(),
        title: 'Critical Platform Maintenance Notice',
      })
    );
  });

  test('Admin sends direct individual message -> triggers Multi-Channel delivery', async () => {
    currentMockSessionUser = platformAdminUser;

    const res = await sendDirectUserMessage({
      userId: customerUser._id.toString(),
      subject: 'Account Verification Approved',
      message: 'Your account has been verified by the administrator.',
      sendEmailToUser: true,
      sendNotificationToUser: true,
    });

    expect(res.success).toBe(true);
    expect(res.notificationCreated).toBe(true);

    const notif = await Notification.findOne({
      userId: customerUser._id,
      title: 'Account Verification Approved',
    });
    expect(notif).toBeTruthy();

    expect(mockNotifySSE).toHaveBeenCalledWith(
      customerUser._id.toString(),
      expect.objectContaining({
        type: 'direct_message',
        title: 'Account Verification Approved',
      })
    );

    expect(mockFirebasePush).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: customerUser._id.toString(),
        title: 'Account Verification Approved',
      })
    );
  });
});
