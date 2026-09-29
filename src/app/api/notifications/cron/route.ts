import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Reminder from "@/models/Reminder";
import Task from "@/models/Task";
import Routine from "@/models/Routine";
import { NotificationPreference } from "@/models/NotificationPreference";
import { Notification } from "@/models/Notification";
import { sendPushNotification } from "@/lib/notifications/onesignal-server";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    // Optional: protect cron endpoint with a secret
    const url = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      url.searchParams.get("key") !== process.env.CRON_SECRET
    ) {
      return NextResponse.json({ error: "Unauthorized cron" }, { status: 401 });
    }

    await dbConnect();
    const now = new Date();

    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Recover stale processing records
    await Reminder.updateMany(
      { status: "processing", updatedAt: { $lt: fiveMinsAgo } },
      { $set: { status: "pending" } }
    );

    const rawReminders = await Reminder.find({
      status: "pending",
      remindAt: { $lte: now },
    })
      .sort({ remindAt: 1 })
      .limit(50)
      .lean();

    if (rawReminders.length === 0) {
      return NextResponse.json({ success: true, message: "No due reminders" });
    }

    let sentCount = 0;
    const errors = [];

    for (const raw of rawReminders) {
      try {
        // Atomic lock to prevent duplicate concurrent processing
        const reminder = await Reminder.findOneAndUpdate(
          { _id: raw._id, status: "pending" },
          { $set: { status: "processing" } },
          { new: true }
        );

        if (!reminder) continue; // Already picked up by another worker
        const userId = reminder.userId.toString();
        const pref = await NotificationPreference.findOne({ userId });

        if (!pref) {
          await Reminder.updateOne({ _id: reminder._id }, { status: "dismissed" });
          continue;
        }

        // Check quiet hours
        if (pref.quietHours?.enabled) {
          const userTime = new Date(new Date().toLocaleString("en-US", { timeZone: pref.timezone || "UTC" }));
          const currentHour = userTime.getHours();
          const currentMinute = userTime.getMinutes();
          const currentTimeNum = currentHour * 60 + currentMinute;

          const [startH, startM] = pref.quietHours.start.split(":").map(Number);
          const [endH, endM] = pref.quietHours.end.split(":").map(Number);

          const startNum = startH * 60 + startM;
          const endNum = endH * 60 + endM;

          let isQuiet = false;
          if (startNum <= endNum) {
            isQuiet = currentTimeNum >= startNum && currentTimeNum <= endNum;
          } else {
            isQuiet = currentTimeNum >= startNum || currentTimeNum <= endNum; // crosses midnight
          }

          if (isQuiet) {
            // Delay reminder by 1 hour (or until quiet hours end)
            // For simplicity, shift it to 15 mins later and it will be picked up later
            await Reminder.updateOne(
              { _id: reminder._id },
              { $set: { remindAt: new Date(now.getTime() + 15 * 60000) } }
            );
            continue;
          }
        }

        // Process based on entityType
        let title = "Manageo Reminder";
        let body = "You have a scheduled reminder.";
        let url = "/dashboard";
        let shouldSend = false;
        let notifType = "SYSTEM";

        if (reminder.entityType === "Task" && pref.taskReminders) {
          const task = await Task.findById(reminder.entityId);
          if (task && task.status !== "Completed" && task.status !== "Cancelled") {
            title = `Task Reminder: ${task.title}`;
            body = task.dueDate ? `Due on ${new Date(task.dueDate).toLocaleDateString()}` : "Task reminder";
            url = task.slug ? `/dashboard/tasks/${task.slug}` : `/dashboard/tasks`;
            shouldSend = true;
            notifType = "TASK_REMINDER";
          }
        } else if (reminder.entityType === "Routine" && pref.routineReminders) {
          const routine = await Routine.findById(reminder.entityId);
          if (routine) {
            title = `Routine Reminder: ${routine.title}`;
            body = "It's time for your scheduled routine.";
            url = `/dashboard/routines`;
            shouldSend = true;
            notifType = "ROUTINE_REMINDER";
          }
        }

        if (shouldSend) {
          // Check idempotency (prevent duplicate Notification creation)
          const existingNotif = await Notification.findOne({
            userId,
            entityType: reminder.entityType.toUpperCase(),
            entityId: reminder.entityId.toString(),
            status: { $in: ["SENT", "SENDING", "SCHEDULED"] },
            scheduledAt: reminder.remindAt
          });

          if (!existingNotif) {
            // Create notification record
            const notifRecord = await Notification.create({
              userId,
              type: notifType,
              title,
              body,
              url,
              entityType: reminder.entityType.toUpperCase(),
              entityId: reminder.entityId.toString(),
              scheduledAt: reminder.remindAt,
              status: pref.pushEnabled ? "SENDING" : "SENT", 
            });

            if (pref.pushEnabled) {
              try {
                await sendPushNotification({
                  userId,
                  title,
                  body,
                  url,
                  type: notifType,
                  entityId: reminder.entityId.toString(),
                  collapseId: reminder._id.toString(), // Ensures idempotent delivery at the provider level
                });
                notifRecord.status = "SENT";
                notifRecord.sentAt = new Date();
                await notifRecord.save();
              } catch (pushErr) {
                notifRecord.status = "FAILED";
                await notifRecord.save();
                throw pushErr;
              }
            }
            sentCount++;
          }
        }

        // Mark reminder as sent
        await Reminder.updateOne({ _id: reminder._id }, { status: "sent" });

        // Generate next occurrence for routines
        if (reminder.entityType === "Routine") {
          const routine = await Routine.findById(reminder.entityId);
          if (routine && routine.isActive && routine.schedule && routine.schedule.length > 0) {
            const existingPending = await Reminder.findOne({ 
              userId: reminder.userId, 
              entityType: "Routine", 
              entityId: reminder.entityId, 
              status: "pending" 
            });
            
            if (!existingPending) {
              const nextDate = new Date(reminder.remindAt.getTime());
              if (routine.schedule.includes("Daily")) {
                nextDate.setDate(nextDate.getDate() + 1);
              } else {
                const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                let daysToAdd = 1;
                while (daysToAdd <= 7) {
                  nextDate.setDate(nextDate.getDate() + 1);
                  const dayName = daysOfWeek[nextDate.getDay()];
                  if (routine.schedule.includes(dayName)) {
                    break;
                  }
                  daysToAdd++;
                }
              }
              
              if (nextDate.getTime() > reminder.remindAt.getTime()) {
                await Reminder.create({
                  userId: reminder.userId,
                  entityType: "Routine",
                  entityId: reminder.entityId,
                  remindAt: nextDate,
                  notificationType: reminder.notificationType
                });
              }
            }
          }
        }

      } catch (err: any) {
        console.error(`Error processing reminder ${raw._id}:`, err);
        errors.push(err.message);
        // Release lock on error so it can be retried
        await Reminder.updateOne({ _id: raw._id }, { status: "pending" });
      }
    }

    return NextResponse.json({ success: true, sentCount, errors });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
