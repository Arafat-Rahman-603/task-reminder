import dbConnect from "@/lib/db";
import Reminder from "@/models/Reminder";
import Task from "@/models/Task";
import Routine from "@/models/Routine";
import CustomRecord from "@/models/custom/CustomRecord";
import CalendarEvent from "@/models/CalendarEvent";
import Habit from "@/models/Habit";
import Goal from "@/models/Goal";
import Idea from "@/models/Idea";
import Subscription from "@/models/Subscription";
import DocumentModel from "@/models/Document";
import { NotificationPreference } from "@/models/NotificationPreference";
import { Notification } from "@/models/Notification";
import User from "@/models/User";
import { sendPushNotification } from "@/lib/notifications/firebase-server";
import mongoose from "mongoose";

export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${period}`;
}

export function formatDateInTz(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

export interface ProcessRemindersOptions {
  userId?: string;
  limit?: number;
}

export interface ProcessRemindersResult {
  success: boolean;
  processedCount: number;
  sentCount: number;
  errors: string[];
}

/**
 * Core reminder processing logic shared between background cron workers,
 * scheduler runs, and opportunistic client revalidation.
 *
 * Guarantees idempotency: 1 reminder occurrence = 1 persistent Notification record.
 */
export async function processDueReminders(
  options: ProcessRemindersOptions = {}
): Promise<ProcessRemindersResult> {
  const { userId: filterUserId, limit = 50 } = options;
  const errors: string[] = [];
  let sentCount = 0;
  let processedCount = 0;

  try {
    await dbConnect();
    const now = new Date();
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 1. Recover stale processing records (stuck for > 5 minutes)
    const staleQuery: Record<string, any> = {
      status: "processing",
      updatedAt: { $lt: fiveMinsAgo },
    };
    if (filterUserId) {
      const userObjId = mongoose.Types.ObjectId.isValid(filterUserId)
        ? new mongoose.Types.ObjectId(filterUserId)
        : filterUserId;
      staleQuery.$or = [{ userId: userObjId }, { userId: filterUserId.toString() }];
    }
    await Reminder.updateMany(staleQuery, { $set: { status: "pending" } });

    // 2. Find pending reminders that are due
    const findQuery: Record<string, any> = {
      status: "pending",
      remindAt: { $lte: now },
    };
    if (filterUserId) {
      const userObjId = mongoose.Types.ObjectId.isValid(filterUserId)
        ? new mongoose.Types.ObjectId(filterUserId)
        : filterUserId;
      findQuery.$or = [{ userId: userObjId }, { userId: filterUserId.toString() }];
    }

    const rawReminders = await Reminder.find(findQuery)
      .sort({ remindAt: 1 })
      .limit(limit)
      .lean();

    if (rawReminders.length === 0) {
      return { success: true, processedCount: 0, sentCount: 0, errors: [] };
    }

    for (const raw of rawReminders) {
      try {
        // Atomic lock to prevent duplicate concurrent processing across workers / requests
        const reminder = await Reminder.findOneAndUpdate(
          { _id: raw._id, status: "pending" },
          { $set: { status: "processing" } },
          { returnDocument: "after" }
        );

        if (!reminder) continue; // Already picked up by another worker/request
        processedCount++;

        const userIdStr = reminder.userId.toString();
        const userObjId = mongoose.Types.ObjectId.isValid(userIdStr)
          ? new mongoose.Types.ObjectId(userIdStr)
          : reminder.userId;

        let pref = await NotificationPreference.findOne({
          $or: [{ userId: userObjId }, { userId: userIdStr }],
        });
        if (!pref) {
          pref = {
            pushEnabled: false,
            taskReminders: true,
            routineReminders: true,
            quietHours: { enabled: false },
            timezone: "UTC",
          };
        }

        const taskRemindersEnabled = pref.taskReminders !== false;
        const routineRemindersEnabled = pref.routineReminders !== false;

        // Check quiet hours
        if (pref.quietHours?.enabled && pref.quietHours.start && pref.quietHours.end) {
          const userTime = new Date(
            new Date().toLocaleString("en-US", { timeZone: pref.timezone || "UTC" })
          );
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
            // Delay reminder by 15 mins to be picked up after quiet hours
            await Reminder.updateOne(
              { _id: reminder._id },
              { $set: { status: "pending", remindAt: new Date(now.getTime() + 15 * 60000) } }
            );
            continue;
          }
        }

        // Determine title, body, url, notifType
        let title = "Manageo Reminder";
        let body = "You have a scheduled reminder.";
        let url = "/dashboard";
        let shouldSend = false;
        let notifType: any = "SYSTEM";
        let priority = "medium";

        if (reminder.entityType === "Task" && taskRemindersEnabled) {
          const task = await Task.findById(reminder.entityId);
          if (task) {
            if (task.priority === "High" || task.priority === "Urgent") {
              priority = "high";
            }
            if (reminder.metadata?.isCompletionCongrats) {
              title = "Congratulations! 🎉";
              body = `You completed "${task.title}" today! Great job!`;
              url = task.slug ? `/dashboard/tasks/${task.slug}` : `/dashboard/tasks`;
              shouldSend = true;
              notifType = "TASK_REMINDER";
            } else if (task.status !== "Completed" && task.status !== "Cancelled") {
              title = "Task Reminder ⏰";
              const timeDisplay = task.dueTime
                ? formatTimeDisplay(task.dueTime)
                : (task.dueDate ? "today" : "");
              body = timeDisplay
                ? `“${task.title}” is due at ${timeDisplay}.`
                : `“${task.title}” is due today.`;
              url = task.slug ? `/dashboard/tasks/${task.slug}` : `/dashboard/tasks`;
              shouldSend = true;
              notifType = "TASK_REMINDER";
            }
          }
        } else if (reminder.entityType === "Routine" && routineRemindersEnabled) {
          const routine = await Routine.findById(reminder.entityId);
          if (routine && routine.isActive) {
            if (reminder.metadata?.isStepReminder) {
              const stepIndex = reminder.metadata.stepIndex;
              const stepType = reminder.metadata.type;
              const stepTitle = reminder.metadata.title;
              const isCompleted = routine.items && routine.items[stepIndex]?.isCompleted;

              if (stepType === "start") {
                title = "Step Starting ⏱️";
                body = `Time to start “${stepTitle}” in your routine “${routine.name}”.`;
                shouldSend = true;
              } else if (stepType === "end") {
                if (isCompleted) {
                  title = "Great Job! 🎉";
                  body = `You completed “${stepTitle}” in “${routine.name}”.`;
                } else {
                  title = "Step Time Up ⌛";
                  body = `Did you finish “${stepTitle}”? Don’t forget to mark it as complete.`;
                }
                shouldSend = true;
              }
              url = `/dashboard/routines`;
              notifType = "ROUTINE_REMINDER";
            } else if (reminder.metadata?.isMissedRoutine) {
              title = "Routine Missed";
              const routineTime = reminder.metadata?.scheduledTime
                ? formatTimeDisplay(reminder.metadata.scheduledTime)
                : (routine.startTime ? formatTimeDisplay(routine.startTime) : "");
              body = routineTime
                ? `Your “${routine.name}” routine was scheduled for ${routineTime} and wasn’t completed.`
                : `Your “${routine.name}” routine was missed today.`;
              url = `/dashboard/routines`;
              shouldSend = true;
              notifType = "ROUTINE_REMINDER";
            } else if (!reminder.metadata?.skipNotification) {
              title = "Routine Time 🔁";
              body = `It’s time for your “${routine.name}” routine.`;
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
                  routine.markModified("items");
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
              userId: userObjId,
              createdAt: { $gte: today },
            });

            if (ideasToday.length > 0) {
              const statusCounts = ideasToday.reduce((acc: Record<string, number>, idea: any) => {
                acc[idea.status] = (acc[idea.status] || 0) + 1;
                return acc;
              }, {});

              const statusStr = Object.entries(statusCounts)
                .map(([status, count]) => `${count} ${status}`)
                .join(", ");

              title = "Daily Idea Summary 💡";
              body = `You captured ${ideasToday.length} ideas today! (${statusStr})`;
              url = `/dashboard/ideas`;
              shouldSend = true;
              notifType = "IDEA_REMINDER";
            }
          }
        } else if (reminder.entityType === "CustomRecord") {
          const record = await CustomRecord.findById(reminder.entityId).populate("sectionId");
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
          const reminderIdStr = reminder._id.toString();

          // Idempotency check: strictly ensure 1 reminder occurrence = 1 notification record
          let existingNotif = await Notification.findOne({
            $or: [
              { "metadata.reminderId": reminderIdStr },
              {
                $or: [{ userId: userObjId }, { userId: userIdStr }],
                entityType: reminder.entityType.toUpperCase(),
                entityId: reminder.entityId.toString(),
                scheduledAt: reminder.remindAt,
              },
            ],
          });

          let notifRecord = existingNotif;

          if (!existingNotif) {
            // Persist the exactly ONE notification record
            notifRecord = await Notification.create({
              userId: userObjId,
              type: notifType,
              title,
              body,
              url,
              entityType: reminder.entityType.toUpperCase() as any,
              entityId: reminder.entityId.toString(),
              scheduledAt: reminder.remindAt,
              sentAt: new Date(),
              status: pref.pushEnabled ? "SENDING" : "SENT",
              metadata: {
                reminderId: reminderIdStr,
                priority,
                ...(reminder.metadata || {}),
              },
            });
            sentCount++;
          }

          // If push notification is enabled and we have a record to deliver
          if (pref.pushEnabled && notifRecord) {
            try {
              console.log("[Reminder Processor] Sending push notification:", {
                reminderId: reminderIdStr,
                notificationId: notifRecord._id.toString(),
                userId: userIdStr,
                notifType,
              });

              await sendPushNotification({
                userId: userIdStr,
                title,
                body,
                url,
                type: notifType,
                entityId: reminder.entityId.toString(),
                collapseId: notifRecord._id.toString(), // Allows deduplication and notification identification
                metadata: {
                  reminderId: reminderIdStr,
                  notificationId: notifRecord._id.toString(),
                },
              });

              notifRecord.status = "SENT";
              notifRecord.sentAt = new Date();
              await notifRecord.save();
            } catch (pushErr: any) {
              console.error("[Reminder Processor] Push notification error:", {
                reminderId: reminderIdStr,
                userId: userIdStr,
                error: pushErr?.message || pushErr,
              });

              const isSubscriptionError = pushErr?.message?.includes("All included players are not subscribed");
              if (isSubscriptionError) {
                notifRecord.status = "SENT";
                notifRecord.sentAt = new Date();
                notifRecord.metadata = {
                  ...(notifRecord.metadata || {}),
                  deliveryError: "NO_ACTIVE_SUBSCRIPTION",
                };
                notifRecord.markModified("metadata");
                await notifRecord.save();

                await NotificationPreference.updateOne(
                  { userId: userIdStr },
                  { $set: { pushEnabled: false } }
                );
              } else {
                // Keep record as SENT for in-app panel even if push delivery had issues
                notifRecord.status = "SENT";
                notifRecord.metadata = {
                  ...(notifRecord.metadata || {}),
                  pushDeliveryError: pushErr?.message || String(pushErr),
                };
                notifRecord.markModified("metadata");
                await notifRecord.save();
              }
            }
          }
        }

        // Mark reminder as sent in database
        await Reminder.updateOne({ _id: reminder._id }, { status: "sent" });

        // Generate next occurrence for recurring routines
        if (reminder.entityType === "Routine" && reminder.metadata?.isMainReminder) {
          const routine = await Routine.findById(reminder.entityId);
          if (routine && routine.schedule && routine.schedule.length > 0) {
            const existingPending = await Reminder.findOne({
              userId: reminder.userId,
              entityType: "Routine",
              entityId: reminder.entityId,
              status: "pending",
              "metadata.isMainReminder": true,
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
                  metadata: { ...reminder.metadata, isMainReminder: true },
                });

                if (routine.startDate && routine.items) {
                  const baseDateStr = nextDate.toISOString().split("T")[0];
                  for (let i = 0; i < routine.items.length; i++) {
                    const item = routine.items[i] as any;
                    if (item.remindAtStart && item.startTime) {
                      const dt = new Date(`${baseDateStr}T${item.startTime}:00`);
                      if (!isNaN(dt.getTime())) {
                        await Reminder.create({
                          userId: reminder.userId,
                          entityType: "Routine",
                          entityId: routine._id.toString(),
                          remindAt: dt,
                          notificationType: "in-app",
                          metadata: { isStepReminder: true, stepIndex: i, type: "start", title: item.title },
                        });
                      }
                    }
                    if (item.remindAtEnd && item.endTime) {
                      const dt = new Date(`${baseDateStr}T${item.endTime}:00`);
                      if (!isNaN(dt.getTime())) {
                        await Reminder.create({
                          userId: reminder.userId,
                          entityType: "Routine",
                          entityId: routine._id.toString(),
                          remindAt: dt,
                          notificationType: "in-app",
                          metadata: { isStepReminder: true, stepIndex: i, type: "end", title: item.title },
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
        errors.push(err.message || String(err));
        // Release lock on error so it can be safely retried
        await Reminder.updateOne({ _id: raw._id }, { status: "pending" });
      }
    }

    // Process daily summaries (Midnight overview & Morning summary based on user timezone)
    try {
      const summaryResult = await processDailySummaries({ userId: filterUserId });
      sentCount += (summaryResult.midnightSent + summaryResult.morningSent);
      if (summaryResult.errors.length > 0) {
        errors.push(...summaryResult.errors);
      }
    } catch (summaryErr: any) {
      console.error("[Reminder Processor] Error in daily summaries check:", summaryErr);
      errors.push(summaryErr.message || String(summaryErr));
    }

    return { success: true, processedCount, sentCount, errors };
  } catch (error: any) {
    console.error("[Reminder Processor] Fatal error:", error);
    return { success: false, processedCount, sentCount, errors: [error.message || String(error)] };
  }
}

export interface UserDayOverviewData {
  tasksToday: any[];
  routinesToday: any[];
  remindersToday: any[];
  highPriorityTasks: any[];
  firstTaskTime: string | null;
  firstName: string;
}

export async function gatherUserDayOverview(
  userId: mongoose.Types.ObjectId,
  timeZone: string,
  todayDateStr: string
): Promise<UserDayOverviewData> {
  const [activeTasks, activeRoutines, pendingReminders, userRecord] = await Promise.all([
    Task.find({
      userId,
      status: { $nin: ["Completed", "Cancelled"] },
    }).lean(),
    Routine.find({
      userId,
      isActive: true,
    }).lean(),
    Reminder.find({
      userId,
      status: "pending",
    }).lean(),
    User.findById(userId).select("name").lean(),
  ]);

  const tasksToday = (activeTasks || []).filter((t: any) => {
    if (!t.dueDate) return false;
    return formatDateInTz(new Date(t.dueDate), timeZone) === todayDateStr;
  });

  const highPriorityTasks = tasksToday.filter(
    (t: any) => t.priority === "High" || t.priority === "Urgent"
  );

  const tasksWithTimes = tasksToday
    .filter((t: any) => !!t.dueTime)
    .sort((a: any, b: any) => (a.dueTime || "").localeCompare(b.dueTime || ""));
  const firstTaskTime = tasksWithTimes.length > 0 ? formatTimeDisplay(tasksWithTimes[0].dueTime) : null;

  let weekdayName = "Monday";
  try {
    weekdayName = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(new Date());
  } catch {}

  const routinesToday = (activeRoutines || []).filter((r: any) => {
    if (!r.schedule || r.schedule.length === 0) return true;
    return r.schedule.includes("Daily") || r.schedule.includes(weekdayName);
  });

  const remindersToday = (pendingReminders || []).filter((r: any) => {
    if (!r.remindAt) return false;
    return formatDateInTz(new Date(r.remindAt), timeZone) === todayDateStr;
  });

  const firstName = userRecord?.name ? userRecord.name.split(" ")[0] : "";

  return {
    tasksToday,
    routinesToday,
    remindersToday,
    highPriorityTasks,
    firstTaskTime,
    firstName,
  };
}

export interface ProcessDailySummariesOptions {
  userId?: string;
  forceType?: "MIDNIGHT_OVERVIEW" | "MORNING_SUMMARY";
}

export interface ProcessDailySummariesResult {
  midnightSent: number;
  morningSent: number;
  errors: string[];
}

export async function processDailySummaries(
  options: ProcessDailySummariesOptions = {}
): Promise<ProcessDailySummariesResult> {
  const errors: string[] = [];
  let midnightSent = 0;
  let morningSent = 0;

  try {
    await dbConnect();
    const now = new Date();

    const prefQuery: Record<string, any> = {};
    if (options.userId) {
      const userObjId = mongoose.Types.ObjectId.isValid(options.userId)
        ? new mongoose.Types.ObjectId(options.userId)
        : options.userId;
      prefQuery.userId = userObjId;
    }

    const preferences = await NotificationPreference.find(prefQuery).lean();

    // If options.userId specified and no pref found yet, create default
    if (options.userId && preferences.length === 0) {
      const uId = mongoose.Types.ObjectId.isValid(options.userId)
        ? new mongoose.Types.ObjectId(options.userId)
        : options.userId;
      const createdPref = await NotificationPreference.create({
        userId: uId,
        pushEnabled: false,
        taskReminders: true,
        routineReminders: true,
        dailyOverview: { enabled: true, time: "00:00" },
        morningSummary: { enabled: true, time: "07:00" },
        timezone: "UTC",
      });
      preferences.push(createdPref.toObject());
    }

    for (const pref of preferences) {
      try {
        const userIdStr = pref.userId.toString();
        const userObjId = new mongoose.Types.ObjectId(userIdStr);
        const tz = pref.timezone || "UTC";

        let localHour = 0;
        let localMinute = 0;
        try {
          const timeParts = new Intl.DateTimeFormat("en-GB", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(now).split(":");
          localHour = parseInt(timeParts[0], 10);
          localMinute = parseInt(timeParts[1], 10);
        } catch (e: any) {
          console.warn(`[Daily Summaries] Invalid timezone ${tz} for user ${userIdStr}, fallback to UTC`);
          localHour = now.getUTCHours();
          localMinute = now.getUTCMinutes();
        }

        const todayDateStr = formatDateInTz(now, tz);
        const localMinutesNow = localHour * 60 + localMinute;

        // 1. Midnight Daily Overview (Fixed at 12:00 AM user-local time)
        // Window 00:00 - 05:00 allows missed executions (e.g. server restart) to be caught safely
        const isDailyOverviewEnabled = pref.dailyOverview?.enabled !== false;
        const isMidnightWindow = (localHour >= 0 && localHour < 5) || options.forceType === "MIDNIGHT_OVERVIEW";

        if (isDailyOverviewEnabled && isMidnightWindow) {
          const midnightKey = `daily_overview_${userIdStr}_${todayDateStr}`;
          const existingMidnight = await Notification.findOne({
            userId: userObjId,
            $or: [
              { "metadata.idempotencyKey": midnightKey },
              {
                type: "DAILY_SUMMARY",
                "metadata.summaryType": "MIDNIGHT_OVERVIEW",
                "metadata.summaryDate": todayDateStr,
              },
            ],
          });

          if (!existingMidnight) {
            const data = await gatherUserDayOverview(userObjId, tz, todayDateStr);
            const summaryParts: string[] = [];
            if (data.tasksToday.length > 0) {
              summaryParts.push(`${data.tasksToday.length} task${data.tasksToday.length > 1 ? "s" : ""}`);
            }
            if (data.routinesToday.length > 0) {
              summaryParts.push(`${data.routinesToday.length} routine${data.routinesToday.length > 1 ? "s" : ""}`);
            }
            if (data.remindersToday.length > 0) {
              summaryParts.push(`${data.remindersToday.length} reminder${data.remindersToday.length > 1 ? "s" : ""}`);
            }

            let body = "Here’s what’s planned for today—tasks, routines, reminders, and priorities.";
            if (summaryParts.length > 0) {
              body = `Here’s what’s planned for today: ${summaryParts.join(", ")}.`;
              if (data.highPriorityTasks.length > 0) {
                body += ` (${data.highPriorityTasks.length} high priority)`;
              }
            } else {
              body = "You have a clear schedule today. Take time to plan ahead or focus on your goals.";
            }

            const title = "Your Day Overview is Ready 🌙";

            const notifRecord = await Notification.create({
              userId: userObjId,
              type: "DAILY_SUMMARY",
              title,
              body,
              url: "/dashboard",
              entityType: "SYSTEM",
              scheduledAt: now,
              sentAt: now,
              status: pref.pushEnabled ? "SENDING" : "SENT",
              metadata: {
                idempotencyKey: midnightKey,
                summaryType: "MIDNIGHT_OVERVIEW",
                summaryDate: todayDateStr,
                timezone: tz,
                priority: "medium",
                taskCount: data.tasksToday.length,
                routineCount: data.routinesToday.length,
                reminderCount: data.remindersToday.length,
              },
            });

            midnightSent++;

            if (pref.pushEnabled) {
              try {
                await sendPushNotification({
                  userId: userIdStr,
                  title,
                  body,
                  url: "/dashboard",
                  type: "DAILY_SUMMARY",
                  collapseId: notifRecord._id.toString(),
                  metadata: {
                    notificationId: notifRecord._id.toString(),
                    idempotencyKey: midnightKey,
                  },
                });
                notifRecord.status = "SENT";
                await notifRecord.save();
              } catch (pushErr: any) {
                console.error("[Daily Summaries] Push error for midnight overview:", pushErr);
                notifRecord.status = "SENT";
                notifRecord.metadata = {
                  ...(notifRecord.metadata || {}),
                  pushDeliveryError: pushErr?.message || String(pushErr),
                };
                notifRecord.markModified("metadata");
                await notifRecord.save();
              }
            }
          }
        }

        // 2. Morning Summary (User-configured time, default 07:00 AM user-local time)
        const isMorningSummaryEnabled = pref.morningSummary?.enabled !== false;
        const targetMorningTime = pref.morningSummary?.time || "07:00";
        const [targetH, targetM] = targetMorningTime.split(":").map(Number);
        const targetMinutes = (isNaN(targetH) ? 7 : targetH) * 60 + (isNaN(targetM) ? 0 : targetM);
        const isMorningWindow =
          (localMinutesNow >= targetMinutes && localMinutesNow < targetMinutes + 300) ||
          options.forceType === "MORNING_SUMMARY";

        if (isMorningSummaryEnabled && isMorningWindow) {
          const morningKey = `morning_summary_${userIdStr}_${todayDateStr}`;
          const existingMorning = await Notification.findOne({
            userId: userObjId,
            $or: [
              { "metadata.idempotencyKey": morningKey },
              {
                type: "MORNING_SUMMARY",
                "metadata.summaryDate": todayDateStr,
              },
            ],
          });

          if (!existingMorning) {
            const data = await gatherUserDayOverview(userObjId, tz, todayDateStr);
            const title = data.firstName ? `Good morning, ${data.firstName} ☀️` : `Good morning ☀️`;

            let body = "Here is what’s ahead for today.";
            const parts: string[] = [];
            if (data.tasksToday.length > 0) parts.push(`${data.tasksToday.length} task${data.tasksToday.length > 1 ? "s" : ""}`);
            if (data.routinesToday.length > 0) parts.push(`${data.routinesToday.length} routine${data.routinesToday.length > 1 ? "s" : ""}`);
            if (data.remindersToday.length > 0) parts.push(`${data.remindersToday.length} reminder${data.remindersToday.length > 1 ? "s" : ""}`);

            if (parts.length > 0) {
              body = `Today: ${parts.join(", ")}.`;
              if (data.firstTaskTime) {
                body += ` Start with your ${data.firstTaskTime} task.`;
              } else if (data.highPriorityTasks.length > 0) {
                body += ` ${data.highPriorityTasks.length} high-priority item${data.highPriorityTasks.length > 1 ? "s" : ""} to tackle.`;
              }
            } else {
              body = "Your agenda is clear today. Have a productive and relaxing day!";
            }

            const notifRecord = await Notification.create({
              userId: userObjId,
              type: "MORNING_SUMMARY",
              title,
              body,
              url: "/dashboard",
              entityType: "SYSTEM",
              scheduledAt: now,
              sentAt: now,
              status: pref.pushEnabled ? "SENDING" : "SENT",
              metadata: {
                idempotencyKey: morningKey,
                summaryType: "MORNING_SUMMARY",
                summaryDate: todayDateStr,
                timezone: tz,
                priority: "medium",
                taskCount: data.tasksToday.length,
                routinesCount: data.routinesToday.length,
                remindersCount: data.remindersToday.length,
              },
            });

            morningSent++;

            if (pref.pushEnabled) {
              try {
                await sendPushNotification({
                  userId: userIdStr,
                  title,
                  body,
                  url: "/dashboard",
                  type: "MORNING_SUMMARY",
                  collapseId: notifRecord._id.toString(),
                  metadata: {
                    notificationId: notifRecord._id.toString(),
                    idempotencyKey: morningKey,
                  },
                });
                notifRecord.status = "SENT";
                await notifRecord.save();
              } catch (pushErr: any) {
                console.error("[Daily Summaries] Push error for morning summary:", pushErr);
                notifRecord.status = "SENT";
                notifRecord.metadata = {
                  ...(notifRecord.metadata || {}),
                  pushDeliveryError: pushErr?.message || String(pushErr),
                };
                notifRecord.markModified("metadata");
                await notifRecord.save();
              }
            }
          }
        }
      } catch (userErr: any) {
        console.error(`[Daily Summaries] Error processing user ${pref.userId}:`, userErr);
        errors.push(userErr.message || String(userErr));
      }
    }
  } catch (err: any) {
    console.error("[Daily Summaries] Fatal error:", err);
    errors.push(err.message || String(err));
  }

  return { midnightSent, morningSent, errors };
}
