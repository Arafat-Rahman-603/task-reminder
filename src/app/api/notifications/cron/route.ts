export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Reminder from "@/models/Reminder";
import Task from "@/models/Task";
import Routine from "@/models/Routine";
import CustomSection from "@/models/custom/CustomSection";
import CustomRecord from "@/models/custom/CustomRecord";
import CalendarEvent from "@/models/CalendarEvent";
import Habit from "@/models/Habit";
import Goal from "@/models/Goal";
import Idea from "@/models/Idea";
import Subscription from "@/models/Subscription";
import DocumentModel from "@/models/Document";
import { NotificationPreference } from "@/models/NotificationPreference";
import { Notification } from "@/models/Notification";
import { sendPushNotification } from "@/lib/notifications/firebase-server";
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
          { returnDocument: 'after' }
        );

        if (!reminder) continue; // Already picked up by another worker
        const userId = reminder.userId.toString();
        let pref = await NotificationPreference.findOne({ userId });

        if (!pref) {
          pref = {
            pushEnabled: false,
            taskReminders: true,
            routineReminders: true,
            quietHours: { enabled: false },
            timezone: "UTC"
          };
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
          if (task) {
            if (reminder.metadata?.isCompletionCongrats) {
              title = `Congratulations! ðŸŽ‰`;
              body = `You completed "${task.title}" today! Great job!`;
              url = task.slug ? `/dashboard/tasks/${task.slug}` : `/dashboard/tasks`;
              shouldSend = true;
              notifType = "TASK_REMINDER";
            } else if (task.status !== "Completed" && task.status !== "Cancelled") {
              title = `Task Reminder: ${task.title}`;
              body = task.dueDate ? `Due on ${new Date(task.dueDate).toLocaleDateString()}` : "Task reminder";
              url = task.slug ? `/dashboard/tasks/${task.slug}` : `/dashboard/tasks`;
              shouldSend = true;
              notifType = "TASK_REMINDER";
            }
          }
        } else if (reminder.entityType === "Routine" && pref.routineReminders) {
          const routine = await Routine.findById(reminder.entityId);
          if (routine && routine.isActive) {
            if (reminder.metadata?.isStepReminder) {
              const stepIndex = reminder.metadata.stepIndex;
              const stepType = reminder.metadata.type;
              const stepTitle = reminder.metadata.title;
              const isCompleted = routine.items && routine.items[stepIndex]?.isCompleted;
              
              if (stepType === 'start') {
                title = `Step Starting: ${stepTitle}`;
                body = `It's time to start "${stepTitle}" in your routine "${routine.name}".`;
                shouldSend = true;
              } else if (stepType === 'end') {
                if (isCompleted) {
                  title = `Congratulations!`;
                  body = `You completed "${stepTitle}". Great job!`;
                } else {
                  title = `Step Time Up: ${stepTitle}`;
                  body = `Did you finish "${stepTitle}"? Don't forget to mark it as complete.`;
                }
                shouldSend = true;
              }
              url = `/dashboard/routines`;
              notifType = "ROUTINE_REMINDER";
            } else {
              title = `Routine Reminder: ${routine.name}`;
              body = "It's time for your scheduled routine.";
              url = `/dashboard/routines`;
              shouldSend = true;
              notifType = "ROUTINE_REMINDER";
              
              // Reset routine items for the new occurrence
              if (routine.items && routine.items.length > 0) {
                let updated = false;
                routine.items.forEach((item: any) => {
                  if (item.isCompleted) {
                    item.isCompleted = false;
                    updated = true;
                  }
                });
                if (updated) {
                  routine.markModified('items');
                  await routine.save();
                }
              }
            }
          }
        } else if (reminder.entityType === "Idea") {
          if (reminder.metadata?.isDailySummary) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const ideasToday = await Idea.find({
              userId,
              createdAt: { $gte: today }
            });

            if (ideasToday.length > 0) {
              const statusCounts = ideasToday.reduce((acc: Record<string, number>, idea: any) => {
                acc[idea.status] = (acc[idea.status] || 0) + 1;
                return acc;
              }, {});

              const statusStr = Object.entries(statusCounts)
                .map(([status, count]) => `${count} ${status}`)
                .join(", ");

              title = `Daily Idea Summary ðŸ’¡`;
              body = `You captured ${ideasToday.length} ideas today! (${statusStr})`;
              url = `/dashboard/ideas`;
              shouldSend = true;
              notifType = "IDEA_REMINDER";
            }
          }
        } else if (reminder.entityType === "CustomRecord") {
          const record = await CustomRecord.findById(reminder.entityId).populate('sectionId');
          if (record && record.sectionId) {
            title = `Custom Reminder: ${record.sectionId.name}`;
            body = "You have a scheduled reminder for a custom item.";
            url = `/dashboard/custom/${record.sectionId.slug}`;
            shouldSend = true;
            notifType = "CUSTOM_REMINDER";
          }
        } else if (reminder.entityType === "Event") {
          const event = await CalendarEvent.findById(reminder.entityId);
          if (event) {
            title = `Event Reminder: ${event.title}`;
            body = `Event starts at ${new Date(event.startAt).toLocaleTimeString()}`;
            url = `/dashboard/calendar`;
            shouldSend = true;
            notifType = "EVENT_REMINDER";
          }
        } else if (reminder.entityType === "Habit") {
          const habit = await Habit.findById(reminder.entityId);
          if (habit) {
            title = `Habit Reminder: ${habit.name}`;
            body = "Don't forget to complete your habit today!";
            url = `/dashboard/habits`;
            shouldSend = true;
            notifType = "HABIT_REMINDER";
          }
        } else if (reminder.entityType === "Goal") {
          const goal = await Goal.findById(reminder.entityId);
          if (goal && goal.status !== "Completed") {
            title = `Goal Reminder: ${goal.title}`;
            body = "Keep working towards your goal!";
            url = `/dashboard/goals`;
            shouldSend = true;
            notifType = "GOAL_REMINDER";
          }
        } else if (reminder.entityType === "Subscription") {
          const sub = await Subscription.findById(reminder.entityId);
          if (sub && sub.status === "active") {
            title = `Subscription Reminder: ${sub.name}`;
            body = `Your subscription is renewing soon.`;
            url = `/dashboard/finances/subscriptions`;
            shouldSend = true;
            notifType = "SUBSCRIPTION_REMINDER";
          }
        } else if (reminder.entityType === "Document") {
          const doc = await DocumentModel.findById(reminder.entityId);
          if (doc) {
            title = `Document Reminder: ${doc.title}`;
            body = "You have a reminder for this document.";
            url = `/dashboard/documents`;
            shouldSend = true;
            notifType = "DOCUMENT_REMINDER";
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
                console.log('[Cron] Attempting to send notification:', {
                  reminderId: reminder._id.toString(),
                  userId,
                  notificationType: notifType,
                  externalId: userId,
                  prefMetadata: pref.metadata
                });
                
                await sendPushNotification({
                  userId,
                  title,
                  body,
                  url,
                  type: notifType,
                  entityId: reminder.entityId.toString(),
                  collapseId: notifRecord._id.toString(), // Ensures idempotent delivery and allows frontend to mark this exact notification as read
                });
                
                console.log('[Cron] Notification sent successfully:', {
                  reminderId: reminder._id.toString(),
                  notificationId: notifRecord._id.toString(),
                  userId
                });
                
                notifRecord.status = "SENT";
                notifRecord.sentAt = new Date();
                await notifRecord.save();
              } catch (pushErr: any) {
                console.error('[Cron] Failed to send push notification:', {
                  reminderId: reminder._id.toString(),
                  userId,
                  error: pushErr?.message || pushErr,
                  prefMetadata: pref.metadata
                });
                
                // Distinguish between actual errors and subscription issues
                const isSubscriptionError = pushErr?.message?.includes("All included players are not subscribed");
                
                if (isSubscriptionError) {
                  // Mark as SENT but note subscription issue
                  notifRecord.status = "SENT";
                  notifRecord.sentAt = new Date();
                  notifRecord.metadata = {
                    ...(notifRecord.metadata || {}),
                    deliveryError: "NO_ACTIVE_SUBSCRIPTION",
                    errorMessage: "User has no active OneSignal subscription"
                  };
                  notifRecord.markModified('metadata');
                  await notifRecord.save();
                  
                  // Automatically disable push notifications for this user
                  // to prevent further failed attempts until they re-subscribe
                  await NotificationPreference.updateOne(
                    { userId },
                    { $set: { pushEnabled: false } }
                  );
                  
                  // Log as warning, not error - don't throw
                  console.warn('[Cron] User has no active subscription, disabled push for user:', {
                    reminderId: reminder._id.toString(),
                    userId
                  });
                } else {
                  // Actual error - mark as failed
                  notifRecord.status = "FAILED";
                  await notifRecord.save();
                  throw pushErr;
                }
              }
            } else {
              console.log('[Cron] Push disabled for user:', {
                reminderId: reminder._id.toString(),
                userId,
                pushEnabled: pref.pushEnabled
              });
            }
            sentCount++;
          }
        }

        // Mark reminder as sent
        await Reminder.updateOne({ _id: reminder._id }, { status: "sent" });

        // Generate next occurrence for routines
        if (reminder.entityType === "Routine" && reminder.metadata?.isMainReminder) {
          const routine = await Routine.findById(reminder.entityId);
          if (routine && routine.schedule && routine.schedule.length > 0) {
            const existingPending = await Reminder.findOne({ 
              userId: reminder.userId, 
              entityType: "Routine", 
              entityId: reminder.entityId, 
              status: "pending",
              "metadata.isMainReminder": true
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
                  notificationType: reminder.notificationType,
                  metadata: { ...reminder.metadata, isMainReminder: true }
                });
                
                // Note: Step reminders are currently generated when the Routine is saved. 
                // To generate them for recurring instances, we'd need to re-parse the routine's start time and items.
                // For simplicity, we can do it here:
                if (routine.startDate && routine.items) {
                  const baseDateStr = nextDate.toISOString().split('T')[0];
                  for (let i = 0; i < routine.items.length; i++) {
                    const item = routine.items[i] as any;
                    if (item.remindAtStart && item.startTime) {
                      const dt = new Date(`${baseDateStr}T${item.startTime}:00`);
                      if (!isNaN(dt.getTime())) {
                        await Reminder.create({
                          userId: reminder.userId,
                          entityType: 'Routine',
                          entityId: routine._id.toString(),
                          remindAt: dt,
                          notificationType: 'in-app',
                          metadata: { isStepReminder: true, stepIndex: i, type: 'start', title: item.title }
                        });
                      }
                    }
                    if (item.remindAtEnd && item.endTime) {
                      const dt = new Date(`${baseDateStr}T${item.endTime}:00`);
                      if (!isNaN(dt.getTime())) {
                        await Reminder.create({
                          userId: reminder.userId,
                          entityType: 'Routine',
                          entityId: routine._id.toString(),
                          remindAt: dt,
                          notificationType: 'in-app',
                          metadata: { isStepReminder: true, stepIndex: i, type: 'end', title: item.title }
                        });
                      }
                    }
                  }
                }
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


