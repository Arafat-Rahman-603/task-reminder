import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Reminder from "@/models/Reminder";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Fetch overdue tasks
    const overdueTasks = await Task.find({
      userId,
      status: { $in: ["Inbox", "Planned", "In Progress"] },
      dueDate: { $lt: startOfToday }
    }).sort({ dueDate: -1 }).lean();

    // 2. Fetch tasks due today
    const todayTasks = await Task.find({
      userId,
      status: { $in: ["Inbox", "Planned", "In Progress"] },
      dueDate: { $gte: startOfToday, $lte: endOfToday }
    }).sort({ dueDate: 1 }).lean();

    // 3. Fetch active reminders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeReminders: any[] = [];
    try {
      activeReminders = await Reminder.find({
        userId,
        status: "pending",
        remindAt: { $lte: endOfToday }
      }).sort({ remindAt: -1 }).lean();
    } catch (e) {
      console.warn("Reminder collection missing or schema issues", e);
    }

    interface NotificationItem {
      id: string;
      type: string;
      priority: string;
      title: string;
      message: string;
      link: string | null;
      date: Date;
    }
    
    const notifications: NotificationItem[] = [];

    // Map overdue tasks
    overdueTasks.forEach(t => {
      if (t.dueDate) {
        notifications.push({
          id: t._id.toString(),
          type: 'task',
          priority: 'high',
          title: "Overdue Task",
          message: `Task "${t.title}" was due on ${new Date(t.dueDate).toLocaleDateString()}`,
          link: t.slug ? `/dashboard/tasks/${t.slug}` : `/dashboard/tasks`,
          date: t.dueDate
        });
      }
    });

    // Map today's tasks
    todayTasks.forEach(t => {
      if (t.dueDate) {
        notifications.push({
          id: t._id.toString(),
          type: 'task',
          priority: 'medium',
          title: "Task Due Today",
          message: `Task "${t.title}" is due today`,
          link: t.slug ? `/dashboard/tasks/${t.slug}` : `/dashboard/tasks`,
          date: t.dueDate
        });
      }
    });

    // Map reminders
    activeReminders.forEach(r => {
      notifications.push({
        id: r._id.toString(),
        type: 'reminder',
        priority: 'medium',
        title: `Reminder: ${r.entityType}`,
        message: `You have a scheduled reminder for your ${r.entityType}.`,
        link: r.entityType ? `/dashboard/${r.entityType.toLowerCase()}s` : null,
        date: r.remindAt
      });
    });

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
