"use server";

import dbConnect from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { Notification } from "@/models/Notification";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import { sendEmail } from "@/lib/email/resend";
import { sendPushNotification as sendFirebasePush } from "@/lib/notifications/firebase-server";
import { sendPushNotification as sendOneSignalPush } from "@/lib/notifications/onesignal-server";
import { notifyUserViaSSE } from "@/lib/notifications/sse-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function requireUserSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized: Authentication required");
  }
  const userId = session.user.id;
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (user.isSuspended) throw new Error("Your account has been suspended by administration.");
  return { user, session };
}

async function requireSupportOrAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized: Authentication required");
  }
  // @ts-ignore
  const userId = session.user.id;
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (!user.isPlatformAdmin && !user.isSupportTeam) {
    throw new Error("Unauthorized: Support team access required");
  }
  return { user, session };
}

// 1. Create a Support Ticket (User)
export async function createSupportTicket(data: {
  subject: string;
  category: "billing" | "technical" | "account" | "feature_request" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  message: string;
  attachments?: { url: string; publicId: string; originalFilename?: string }[];
}) {
  const { user } = await requireUserSession();
  await dbConnect();

  const count = await SupportTicket.countDocuments();
  const ticketNumber = `TICK-${1000 + count + 1}`;

  const ticket = await SupportTicket.create({
    ticketNumber,
    userId: user._id,
    subject: data.subject.trim(),
    category: data.category || "general",
    priority: data.priority || "medium",
    status: "open",
    userHasUnread: false,
    staffHasUnread: true,
    messages: [
      {
        senderId: user._id,
        senderName: user.name || "Customer",
        senderRole: user.isPlatformAdmin ? "admin" : "user",
        message: data.message.trim(),
        attachments: data.attachments || [],
        createdAt: new Date(),
      },
    ],
    lastReplyAt: new Date(),
  });

  // Notify Support Team and Admins via In-App, SSE, and Web Push
  try {
    const agents = await User.find({
      $or: [{ isPlatformAdmin: true }, { isSupportTeam: true }],
    }).select("_id email name");

    for (const agent of agents) {
      const notif = await Notification.create({
        userId: agent._id,
        type: "SUPPORT_REPLY",
        title: `New Support Ticket [${ticketNumber}]`,
        body: `${user.name} opened ticket: "${data.subject}" (Priority: ${data.priority.toUpperCase()})`,
        message: `${user.name} opened ticket: "${data.subject}" (Priority: ${data.priority.toUpperCase()})`,
        url: `/dashboard/support/agent`,
        link: `/dashboard/support/agent`,
        status: "SENT",
        sentAt: new Date(),
        isRead: false,
      });

      try {
        notifyUserViaSSE(agent._id.toString(), {
          type: "support_new_ticket",
          notificationId: notif._id.toString(),
          title: `New Support Ticket [${ticketNumber}]`,
          message: `${user.name}: "${data.subject}"`,
        });
      } catch {}

      try {
        await sendFirebasePush({
          userId: agent._id.toString(),
          title: `New Support Ticket [${ticketNumber}]`,
          body: `${user.name}: "${data.subject}" (Priority: ${data.priority.toUpperCase()})`,
          url: `/dashboard/support/agent`,
          type: "support_new_ticket",
          entityId: ticket._id.toString(),
        });
      } catch {}
    }
  } catch {
    // Non-blocking
  }

  return { success: true, ticketNumber, ticketId: ticket._id.toString() };
}

// 2. Get User's Own Support Tickets
export async function getUserSupportTickets() {
  const { user } = await requireUserSession();
  await dbConnect();

  const tickets = await SupportTicket.find({ userId: user._id })
    .populate("assignedTo", "name email avatarUrl")
    .sort({ lastReplyAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(tickets));
}

// 3. Get Support Ticket Details (User or Agent)
export async function getTicketDetails(ticketId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // @ts-ignore
  const currentUserId = session.user.id;
  await dbConnect();

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) throw new Error("User not found");

  const ticket = await SupportTicket.findById(ticketId)
    .populate("userId", "name email avatarUrl accountType")
    .populate("assignedTo", "name email avatarUrl isSupportTeam isPlatformAdmin")
    .lean();

  if (!ticket) throw new Error("Ticket not found");

  // Verify access: user must be the ticket owner OR support agent/admin
  const isOwner = ticket.userId?._id?.toString() === currentUserId;
  const isStaff = currentUser.isPlatformAdmin || currentUser.isSupportTeam;

  if (!isOwner && !isStaff) {
    throw new Error("Access denied: You do not have permission to view this ticket");
  }

  return JSON.parse(JSON.stringify(ticket));
}

// 4. Reply to a Support Ticket
export async function replyToSupportTicket(
  ticketId: string,
  dataOrMessage:
    | string
    | {
        message: string;
        attachments?: { url: string; publicId: string; originalFilename?: string }[];
      }
) {
  const data =
    typeof dataOrMessage === "string"
      ? { message: dataOrMessage, attachments: [] }
      : dataOrMessage;

  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // @ts-ignore
  const currentUserId = session.user.id;
  await dbConnect();

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) throw new Error("User not found");

  const ticket = await SupportTicket.findById(ticketId).populate("userId").populate("assignedTo");
  if (!ticket) throw new Error("Ticket not found");

  const isOwner = ticket.userId?._id?.toString() === currentUserId;
  const isStaff = currentUser.isPlatformAdmin || currentUser.isSupportTeam;

  if (!isOwner && !isStaff) {
    throw new Error("Access denied");
  }

  const senderRole = currentUser.isPlatformAdmin
    ? "admin"
    : currentUser.isSupportTeam
    ? "support"
    : "user";

  ticket.messages.push({
    senderId: currentUser._id,
    senderName: currentUser.name || (isStaff ? "Support Specialist" : "User"),
    senderRole,
    message: data.message.trim(),
    attachments: data.attachments || [],
    createdAt: new Date(),
  });

  ticket.lastReplyAt = new Date();

  // If staff replies, move to in_progress if open and set userHasUnread = true
  if (isStaff) {
    ticket.userHasUnread = true;
    ticket.staffHasUnread = false;
    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }
  } else {
    ticket.staffHasUnread = true;
    ticket.userHasUnread = false;
    if (ticket.status === "resolved" || ticket.status === "closed") {
      ticket.status = "open"; // Re-open if user replies
    }
  }

  await ticket.save();

  // Multi-Channel Notification: In-App, SSE, and PWA Web Push
  try {
    if (isStaff) {
      const recipientId = ticket.userId._id
        ? ticket.userId._id.toString()
        : ticket.userId.toString();

      // 1. In-App Notification Record
      const notif = await Notification.create({
        userId: recipientId,
        type: "SUPPORT_REPLY",
        title: `Reply on Support Ticket [${ticket.ticketNumber}]`,
        body: `${currentUser.name || "Support Specialist"} has replied: "${data.message.substring(0, 80)}..."`,
        message: `${currentUser.name || "Support Specialist"} has replied: "${data.message.substring(0, 80)}..."`,
        url: `/dashboard/support`,
        link: `/dashboard/support`,
        status: "SENT",
        sentAt: new Date(),
        isRead: false,
      });

      // 2. Real-time SSE Broadcast (instant UI refresh without polling)
      try {
        notifyUserViaSSE(recipientId, {
          type: "support_reply",
          notificationId: notif._id.toString(),
          title: `Reply on Ticket [${ticket.ticketNumber}]`,
          message: `${currentUser.name || "Support Specialist"}: "${data.message.substring(0, 80)}"`,
          link: `/dashboard/support`,
        });
      } catch {}

      // 3. Native PWA & Web Push (Firebase FCM)
      try {
        await sendFirebasePush({
          userId: recipientId,
          title: `Support Reply [${ticket.ticketNumber}]`,
          body: `${currentUser.name || "Support Specialist"}: "${data.message.substring(0, 100)}"`,
          url: `/dashboard/support`,
          type: "support_reply",
          entityId: ticket._id.toString(),
        });
      } catch {}

      // 4. OneSignal Push Notification
      try {
        await sendOneSignalPush({
          userId: recipientId,
          title: `Support Reply [${ticket.ticketNumber}]`,
          body: `${currentUser.name || "Support Specialist"}: "${data.message.substring(0, 100)}"`,
          url: `/dashboard/support`,
          type: "support_reply",
          entityId: ticket._id.toString(),
        });
      } catch {}

      // 5. Transactional Email via Resend
      if (ticket.userId.email) {
        await sendEmail({
          to: ticket.userId.email,
          subject: `Update on Ticket ${ticket.ticketNumber}: ${ticket.subject}`,
          htmlContent: `<div style="font-family: sans-serif; padding: 20px;">
            <h3>Update on Ticket #${ticket.ticketNumber}</h3>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p><strong>Response from ${currentUser.name || "Support Specialist"}:</strong></p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #0284c7; margin: 16px 0;">
              <p style="white-space: pre-wrap; margin: 0;">${data.message}</p>
            </div>
            <p><a href="${process.env.NEXTAUTH_URL || 'https://manageo.app'}/dashboard/support" style="display: inline-block; padding: 10px 18px; background: #0284c7; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Support Desk</a></p>
          </div>`,
        });
      }
    } else {
      // Customer replied -> notify assigned agent or all active support staff
      const targetAgentId = ticket.assignedTo?._id
        ? ticket.assignedTo._id.toString()
        : ticket.assignedTo?.toString();

      const agentsToNotify: string[] = targetAgentId
        ? [targetAgentId]
        : (
            await User.find({
              $or: [{ isPlatformAdmin: true }, { isSupportTeam: true }],
            }).select("_id")
          ).map((u) => u._id.toString());

      for (const agentId of agentsToNotify) {
        const notif = await Notification.create({
          userId: agentId,
          type: "SUPPORT_REPLY",
          title: `Customer replied on Ticket [${ticket.ticketNumber}]`,
          body: `${currentUser.name} replied on "${ticket.subject}"`,
          message: `${currentUser.name} replied on "${ticket.subject}"`,
          url: `/dashboard/support/agent`,
          link: `/dashboard/support/agent`,
          status: "SENT",
          sentAt: new Date(),
          isRead: false,
        });

        try {
          notifyUserViaSSE(agentId, {
            type: "support_customer_reply",
            notificationId: notif._id.toString(),
            title: `Reply on [${ticket.ticketNumber}]`,
            message: `${currentUser.name}: "${data.message.substring(0, 80)}"`,
            link: `/dashboard/support/agent`,
          });
        } catch {}

        try {
          await sendFirebasePush({
            userId: agentId,
            title: `Customer Reply: [${ticket.ticketNumber}]`,
            body: `${currentUser.name}: "${data.message.substring(0, 100)}"`,
            url: `/dashboard/support/agent`,
            type: "support_customer_reply",
            entityId: ticket._id.toString(),
          });
        } catch {}
      }
    }
  } catch {
    // Non-blocking
  }

  return { success: true, ticket: JSON.parse(JSON.stringify(ticket)) };
}

// 5. Admin / Staff: Get All Tickets with Metrics & Filters
export async function getAdminSupportTickets(filters?: {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  search?: string;
}) {
  await requireSupportOrAdminSession();
  await dbConnect();

  const query: Record<string, unknown> = {};
  if (filters?.status && filters.status !== "all") query.status = filters.status;
  if (filters?.priority && filters.priority !== "all") query.priority = filters.priority;
  if (filters?.category && filters.category !== "all") query.category = filters.category;
  if (filters?.assignedTo && filters.assignedTo !== "all") {
    if (filters.assignedTo === "unassigned") {
      query.assignedTo = { $exists: false };
    } else {
      query.assignedTo = filters.assignedTo;
    }
  }
  if (filters?.search) {
    query.$or = [
      { ticketNumber: { $regex: filters.search, $options: "i" } },
      { subject: { $regex: filters.search, $options: "i" } },
    ];
  }

  const [tickets, totalCount, openCount, inProgressCount, resolvedCount] = await Promise.all([
    SupportTicket.find(query)
      .populate("userId", "name email avatarUrl accountType")
      .populate("assignedTo", "name email avatarUrl isSupportTeam isPlatformAdmin")
      .sort({ lastReplyAt: -1 })
      .lean(),
    SupportTicket.countDocuments(),
    SupportTicket.countDocuments({ status: "open" }),
    SupportTicket.countDocuments({ status: "in_progress" }),
    SupportTicket.countDocuments({ status: "resolved" }),
  ]);

  return {
    tickets: JSON.parse(JSON.stringify(tickets)),
    metrics: {
      total: totalCount,
      open: openCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
    },
  };
}

// 6. Admin: Assign Ticket to Support Agent
export async function assignSupportTicket(ticketId: string, agentId: string | null) {
  const { user: currentAdmin } = await requireSupportOrAdminSession();
  await dbConnect();

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found");

  if (agentId) {
    const agent = await User.findById(agentId);
    if (!agent) throw new Error("Agent user not found");
    ticket.assignedTo = agent._id;
    if (ticket.status === "open") ticket.status = "in_progress";

    // Notify assigned agent
    try {
      await Notification.create({
        userId: agent._id,
        type: "SYSTEM_ALERT",
        title: `Ticket Assigned: [${ticket.ticketNumber}]`,
        message: `You were assigned to support ticket "${ticket.subject}" by ${currentAdmin.name}`,
        link: `/admin?tab=support&ticketId=${ticket._id}`,
        isRead: false,
      });
    } catch {}
  } else {
    ticket.assignedTo = undefined;
  }

  await ticket.save();

  try {
    await AuditLog.create({
      userId: currentAdmin._id,
      action: "UPDATE",
      entityType: "SupportTicket",
      entityId: ticket._id,
      details: { action: "ASSIGN_AGENT", agentId, ticketNumber: ticket.ticketNumber },
    });
  } catch {}

  return { success: true };
}

// 7. Update Ticket Status (Open, In Progress, Resolved, Closed)
export async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "resolved" | "closed"
) {
  const { user: _currentAdmin } = await requireSupportOrAdminSession();
  await dbConnect();

  const ticket = await SupportTicket.findById(ticketId).populate("userId");
  if (!ticket) throw new Error("Ticket not found");

  ticket.status = status;
  if (status === "resolved") ticket.resolvedAt = new Date();
  if (status === "closed") ticket.closedAt = new Date();
  await ticket.save();

  // Notify User of resolution
  try {
    if (ticket.userId?._id && (status === "resolved" || status === "closed")) {
      await Notification.create({
        userId: ticket.userId._id,
        type: "SYSTEM_ALERT",
        title: `Ticket ${status === "resolved" ? "Resolved" : "Closed"}: [${ticket.ticketNumber}]`,
        message: `Your ticket "${ticket.subject}" has been marked as ${status}. Thank you for using Manageo Support.`,
        link: `/dashboard/support`,
        isRead: false,
      });
    }
  } catch {}

  return { success: true, status };
}

// 8. Get Support Agents List for Assignment Dropdowns
export async function getSupportAgentsList() {
  await requireSupportOrAdminSession();
  await dbConnect();

  const agents = await User.find({
    $or: [{ isPlatformAdmin: true }, { isSupportTeam: true }],
  })
    .select("_id name email avatarUrl isSupportTeam isPlatformAdmin")
    .sort({ name: 1 })
    .lean();

  return JSON.parse(JSON.stringify(agents));
}

// 9. Support Agent Operations Center: Complete Dashboard Data
export async function getSupportAgentDashboardData() {
  const { user } = await requireSupportOrAdminSession();
  await dbConnect();

  const [
    tickets,
    totalCount,
    openCount,
    inProgressCount,
    resolvedCount,
    closedCount,
    myAssignedCount,
    myOpenCount,
    unassignedCount,
    totalCustomersCount,
    agents,
  ] = await Promise.all([
    SupportTicket.find()
      .populate("userId", "name email avatarUrl accountType subscription")
      .populate("assignedTo", "name email avatarUrl isSupportTeam isPlatformAdmin")
      .sort({ lastReplyAt: -1 })
      .lean(),
    SupportTicket.countDocuments(),
    SupportTicket.countDocuments({ status: "open" }),
    SupportTicket.countDocuments({ status: "in_progress" }),
    SupportTicket.countDocuments({ status: "resolved" }),
    SupportTicket.countDocuments({ status: "closed" }),
    SupportTicket.countDocuments({ assignedTo: user._id }),
    SupportTicket.countDocuments({
      assignedTo: user._id,
      status: { $in: ["open", "in_progress"] },
    }),
    SupportTicket.countDocuments({
      $or: [{ assignedTo: { $exists: false } }, { assignedTo: null }],
    }),
    User.countDocuments({
      isPlatformAdmin: { $ne: true },
      isSupportTeam: { $ne: true },
    }),
    User.find({
      $or: [{ isPlatformAdmin: true }, { isSupportTeam: true }],
    })
      .select("_id name email avatarUrl isSupportTeam isPlatformAdmin")
      .sort({ name: 1 })
      .lean(),
  ]);

  return {
    currentAgent: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isPlatformAdmin: !!user.isPlatformAdmin,
      isSupportTeam: !!user.isSupportTeam,
    },
    metrics: {
      total: totalCount,
      open: openCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      closed: closedCount,
      myAssigned: myAssignedCount,
      myOpen: myOpenCount,
      unassigned: unassignedCount,
      totalCustomers: totalCustomersCount,
    },
    tickets: JSON.parse(JSON.stringify(tickets)),
    agents: JSON.parse(JSON.stringify(agents)),
  };
}

// 10. Support Agent: Customer Directory with Workspaces and Ticket History
export async function getSupportCustomerDirectory(filters?: {
  search?: string;
  plan?: string;
}) {
  await requireSupportOrAdminSession();
  await dbConnect();

  const query: Record<string, unknown> = {};
  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
    ];
  }
  if (filters?.plan && filters.plan !== "all") {
    if (filters.plan === "free") {
      query["subscription.plan"] = { $in: ["free", null, ""] };
    } else {
      query["subscription.plan"] = filters.plan;
    }
  }

  const users = await User.find(query)
    .select(
      "name email avatarUrl accountType subscription createdAt isSuspended isPlatformAdmin isSupportTeam"
    )
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const userIds = users.map((u) => u._id);

  // Get ticket counts per user
  const ticketCounts = await SupportTicket.aggregate([
    { $match: { userId: { $in: userIds } } },
    {
      $group: {
        _id: "$userId",
        totalTickets: { $sum: 1 },
        openTickets: {
          $sum: {
            $cond: [{ $in: ["$status", ["open", "in_progress"]] }, 1, 0],
          },
        },
      },
    },
  ]);

  const ticketCountMap = new Map(
    ticketCounts.map((tc: { _id: { toString(): string }; totalTickets: number; openTickets: number }) => [
      tc._id.toString(),
      { total: tc.totalTickets, open: tc.openTickets },
    ])
  );

  // Get workspaces for these users
  const memberships = await WorkspaceMembership.find({ userId: { $in: userIds } })
    .populate("workspaceId", "name type")
    .lean();

  interface UserWsItem { workspaceId?: string; name?: string; type?: string; role: string; }
  const workspaceMap = new Map<string, UserWsItem[]>();
  for (const m of memberships) {
    const uid = m.userId.toString();
    const ws = m.workspaceId as { _id?: { toString(): string }; name?: string; type?: string } | null;
    if (ws) {
      const list = workspaceMap.get(uid) || [];
      list.push({
        workspaceId: ws._id?.toString(),
        name: ws.name,
        type: ws.type,
        role: m.role || "member",
      });
      workspaceMap.set(uid, list);
    }
  }

  const result = users.map((u) => {
    const uid = u._id.toString();
    const stats = ticketCountMap.get(uid) || { total: 0, open: 0 };
    const ws = workspaceMap.get(uid) || [];
    return {
      _id: uid,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      accountType: u.accountType || "individual",
      plan: u.subscription?.plan || "free",
      createdAt: u.createdAt,
      isSuspended: !!u.isSuspended,
      isPlatformAdmin: !!u.isPlatformAdmin,
      isSupportTeam: !!u.isSupportTeam,
      totalTickets: stats.total,
      openTickets: stats.open,
      workspaces: ws,
    };
  });

  return JSON.parse(JSON.stringify(result));
}

// 11. Support Agent: Claim Ticket (One-click Assign to Self)
export async function claimSupportTicket(ticketId: string) {
  const { user } = await requireSupportOrAdminSession();
  await dbConnect();

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found");

  ticket.assignedTo = user._id;
  if (ticket.status === "open") {
    ticket.status = "in_progress";
  }
  await ticket.save();

  try {
    await AuditLog.create({
      userId: user._id,
      action: "UPDATE",
      entityType: "SupportTicket",
      entityId: ticket._id,
      details: { action: "CLAIM_TICKET", ticketNumber: ticket.ticketNumber },
    });
  } catch {}

  return { success: true };
}

// 12. Support Agent: Send Direct Message / Email to Customer
export async function sendDirectAgentEmail(data: {
  userId: string;
  subject: string;
  message: string;
}) {
  const { user } = await requireSupportOrAdminSession();
  await dbConnect();

  const recipient = await User.findById(data.userId);
  if (!recipient || !recipient.email) throw new Error("Recipient user or email not found");

  try {
    await sendEmail({
      to: recipient.email,
      subject: `[Manageo Support] ${data.subject}`,
      htmlContent: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
        <h3 style="color: #0284c7; margin-top: 0;">Message from Manageo Support Specialist</h3>
        <p>Hello <strong>${recipient.name || "Customer"}</strong>,</p>
        <div style="background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #38bdf8; margin: 16px 0;">
          <p style="white-space: pre-wrap; margin: 0;">${data.message}</p>
        </div>
        <p style="color: #64748b; font-size: 13px;">Specialist: <strong>${user.name}</strong> (${user.email})</p>
        <p><a href="${process.env.NEXTAUTH_URL || "https://manageo.app"}/dashboard/support" style="display: inline-block; padding: 10px 18px; background: #0284c7; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Access Support Desk</a></p>
      </div>`,
    });
  } catch {
    // Non-blocking email
  }

  try {
    await Notification.create({
      userId: recipient._id,
      type: "SYSTEM_ALERT",
      title: `Support Message: ${data.subject}`,
      message: `${user.name} (Support) sent you an official update: "${data.message.substring(0, 100)}..."`,
      link: `/dashboard/support`,
      isRead: false,
    });
  } catch {}

  return { success: true };
}

// 13. Customer: Mark Ticket as Read (Clears Red Unread Badge)
export async function markTicketReadByUser(ticketId: string) {
  const { user } = await requireUserSession();
  await dbConnect();

  await SupportTicket.updateOne(
    { _id: ticketId, userId: user._id },
    { $set: { userHasUnread: false } }
  );

  return { success: true };
}

// 14. Support Specialist / Admin: Mark Ticket Read by Staff
export async function markTicketReadByStaff(ticketId: string) {
  await requireSupportOrAdminSession();
  await dbConnect();

  await SupportTicket.updateOne(
    { _id: ticketId },
    { $set: { staffHasUnread: false } }
  );

  return { success: true };
}

// 15. Real-time Unread Support Ticket Counts for Nav Badges
export async function getUnreadSupportCounts() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { unreadSupportCount: 0, staffUnreadSupportCount: 0 };
  }
  // @ts-ignore
  const userId = session.user.id;
  await dbConnect();

  const user = await User.findById(userId).select("isPlatformAdmin isSupportTeam");
  if (!user) return { unreadSupportCount: 0, staffUnreadSupportCount: 0 };

  const [unreadSupportCount, staffUnreadSupportCount] = await Promise.all([
    SupportTicket.countDocuments({ userId: user._id, userHasUnread: true }),
    user.isPlatformAdmin || user.isSupportTeam
      ? SupportTicket.countDocuments({
          staffHasUnread: true,
          status: { $in: ["open", "in_progress"] },
        })
      : 0,
  ]);

  return {
    unreadSupportCount,
    staffUnreadSupportCount,
  };
}


