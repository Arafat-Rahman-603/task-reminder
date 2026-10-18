"use server";

import dbConnect from "@/lib/db";
import FinancialReminder, {
  IFinancialReminder,
  FinancialReminderCategory,
  FinancialRecurrenceFrequency,
} from "@/models/FinancialReminder";
import Reminder from "@/models/Reminder";
import Account from "@/models/Account";
import Investment from "@/models/Investment";
import Debt from "@/models/Debt";
import Goal from "@/models/Goal";
import { Notification } from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import mongoose from "mongoose";
import { notifyUserViaSSE } from "@/lib/notifications/sse-service";
import { createTransaction } from "./transaction.actions";

// Validation schema for creating/updating a financial reminder
const financialReminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  category: z.enum([
    "bill",
    "bill_utility",
    "rent_housing",
    "insurance_premium",
    "subscription",
    "loan",
    "loan_installment",
    "credit_card",
    "investment_contribution",
    "investment_maturity",
    "dividend",
    "dividend_interest",
    "portfolio_review",
    "watchlist_review",
    "savings_goal",
    "planned_transfer",
    "income",
    "salary_income",
    "receivable_followup",
    "tax",
    "tax_deadline",
    "document_expiry",
    "custom",
  ]),
  subCategory: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  isEstimatedAmount: z.boolean().optional(),
  currency: z.string().default("BDT"),
  dueDate: z.string().min(1, "Due date is required"),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().or(z.literal("")),
  accountId: z.string().optional().or(z.literal("")),
  linkedEntityType: z
    .enum(["Account", "Debt", "Investment", "Goal", "Subscription", "Transaction"])
    .optional(),
  linkedEntityId: z.string().optional().or(z.literal("")),
  recurrence: z
    .enum([
      "none",
      "daily",
      "weekly",
      "biweekly",
      "monthly",
      "quarterly",
      "semi_annually",
      "yearly",
      "custom",
      "custom_days",
    ])
    .default("none"),
  recurrenceInterval: z.number().int().positive().optional().default(1),
  recurrenceEndType: z.enum(["never", "after_occurrences", "on_date"]).optional().default("never"),
  recurrenceEndOccurrences: z.number().int().positive().optional(),
  recurrenceEndDate: z.string().optional(),
  advanceDays: z.array(z.number().int().min(0).max(60)).optional().default([0, 1]),
  notificationChannels: z
    .array(z.enum(["in-app", "push", "email"]))
    .optional()
    .default(["in-app", "push"]),
  notes: z.string().max(1000).optional(),
  autoCreateTransaction: z.boolean().optional().default(false),
});

// Helper to serialize doc with Decimal128 into clean JSON
function serializeDoc(doc: any): any {
  if (!doc) return null;
  const obj = JSON.parse(JSON.stringify(doc));
  if (obj.amount && typeof obj.amount === "object" && obj.amount.$numberDecimal) {
    obj.amount = parseFloat(obj.amount.$numberDecimal);
  } else if (obj.amount != null) {
    obj.amount = Number(obj.amount);
  }
  if (obj.history && Array.isArray(obj.history)) {
    obj.history = obj.history.map((h: any) => {
      if (h.amountPaid && typeof h.amountPaid === "object" && h.amountPaid.$numberDecimal) {
        h.amountPaid = parseFloat(h.amountPaid.$numberDecimal);
      }
      return h;
    });
  }
  return obj;
}

// Calculate the next recurrence date preserving calendar day and handling month-end
function calculateNextDueDate(
  currentDate: Date,
  frequency: FinancialRecurrenceFrequency,
  interval = 1
): Date {
  const next = new Date(currentDate.getTime());
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7 * interval);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14 * interval);
      break;
    case "monthly": {
      const origDay = currentDate.getDate();
      next.setMonth(next.getMonth() + interval);
      // Handle month-end rollover (e.g. Jan 31 + 1 month -> Feb 28/29, not March 2/3)
      if (next.getDate() !== origDay) {
        next.setDate(0); // Last day of previous month
      }
      break;
    }
    case "quarterly": {
      const origDay = currentDate.getDate();
      next.setMonth(next.getMonth() + 3 * interval);
      if (next.getDate() !== origDay) {
        next.setDate(0);
      }
      break;
    }
    case "semi_annually": {
      const origDay = currentDate.getDate();
      next.setMonth(next.getMonth() + 6 * interval);
      if (next.getDate() !== origDay) {
        next.setDate(0);
      }
      break;
    }
    case "yearly": {
      const origMonth = currentDate.getMonth();
      next.setFullYear(next.getFullYear() + interval);
      // Handle leap year Feb 29 -> Feb 28 on non-leap years
      if (next.getMonth() !== origMonth) {
        next.setDate(0);
      }
      break;
    }
    case "custom_days":
    case "custom": {
      next.setDate(next.getDate() + interval);
      break;
    }
    default:
      break;
  }
  return next;
}

// Synchronize pending Reminder documents with the current nextDueDate and advance notification windows
async function syncScheduledReminders(reminder: IFinancialReminder) {
  // Delete existing pending reminders for this entity
  await Reminder.deleteMany({
    userId: reminder.userId,
    entityType: "FinancialReminder",
    entityId: reminder._id,
    status: "pending",
  });

  if (reminder.status !== "active") return;

  const now = new Date();
  const dueDate = new Date(reminder.nextDueDate);
  const advanceDays = reminder.advanceDays && reminder.advanceDays.length > 0 ? reminder.advanceDays : [0];

  const remindersToCreate: any[] = [];

  for (const daysBefore of advanceDays) {
    const remindAt = new Date(dueDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);

    if (reminder.dueTime) {
      const [hours, minutes] = reminder.dueTime.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        remindAt.setHours(hours, minutes, 0, 0);
      }
    } else {
      // Default to 9:00 AM on the target date
      remindAt.setHours(9, 0, 0, 0);
    }

    // Only schedule if remindAt is in the future or within the last 15 minutes
    if (remindAt.getTime() > now.getTime() - 15 * 60 * 1000) {
      remindersToCreate.push({
        userId: reminder.userId,
        entityType: "FinancialReminder",
        entityId: reminder._id,
        remindAt,
        notificationType: reminder.notificationChannels.includes("push") ? "push" : "in-app",
        metadata: {
          daysBefore,
          isAdvance: daysBefore > 0,
          category: reminder.category,
          title: reminder.title,
        },
      });
    }
  }

  if (remindersToCreate.length > 0) {
    await Reminder.insertMany(remindersToCreate);
  }
}

// 1. CREATE FINANCIAL REMINDER
export async function createFinancialReminder(rawInput: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    // Normalize rawInput
    const normalized = { ...rawInput };
    if (rawInput.notificationChannels && !Array.isArray(rawInput.notificationChannels) && typeof rawInput.notificationChannels === "object") {
      const channels: string[] = [];
      if (rawInput.notificationChannels.inApp !== false) channels.push("in-app");
      if (rawInput.notificationChannels.push) channels.push("push");
      if (rawInput.notificationChannels.email) channels.push("email");
      normalized.notificationChannels = channels;
    }
    if (rawInput.recurrenceEnd && typeof rawInput.recurrenceEnd === "object") {
      normalized.recurrenceEndType = rawInput.recurrenceEnd.type || "never";
      normalized.recurrenceEndOccurrences = rawInput.recurrenceEnd.occurrences;
      normalized.recurrenceEndDate = rawInput.recurrenceEnd.endDate;
    }
    if (rawInput.linkedEntity && typeof rawInput.linkedEntity === "object") {
      normalized.linkedEntityType = rawInput.linkedEntity.entityType;
      normalized.linkedEntityId = rawInput.linkedEntity.entityId;
    }

    const validated = financialReminderSchema.parse(normalized);

    // Validate ownership of linked financial records
    let accountObjId: mongoose.Types.ObjectId | undefined;
    if (validated.accountId) {
      const acc = await Account.findOne({ _id: validated.accountId, userId });
      if (!acc) {
        return { success: false, error: "Account not found or access denied" };
      }
      accountObjId = acc._id;
    }

    let linkedObjId: mongoose.Types.ObjectId | undefined;
    if (validated.linkedEntityId && validated.linkedEntityType) {
      switch (validated.linkedEntityType) {
        case "Account": {
          const item = await Account.findOne({ _id: validated.linkedEntityId, userId });
          if (!item) return { success: false, error: "Unauthorized linked account" };
          linkedObjId = item._id;
          break;
        }
        case "Investment": {
          const item = await Investment.findOne({ _id: validated.linkedEntityId, userId });
          if (!item) return { success: false, error: "Unauthorized linked investment" };
          linkedObjId = item._id;
          break;
        }
        case "Debt": {
          const item = await Debt.findOne({ _id: validated.linkedEntityId, userId });
          if (!item) return { success: false, error: "Unauthorized linked loan/debt" };
          linkedObjId = item._id;
          break;
        }
        case "Goal": {
          const item = await Goal.findOne({ _id: validated.linkedEntityId, userId });
          if (!item) return { success: false, error: "Unauthorized linked goal" };
          linkedObjId = item._id;
          break;
        }
        default:
          break;
      }
    }

    const dueDate = new Date(validated.dueDate);
    if (isNaN(dueDate.getTime())) {
      return { success: false, error: "Invalid due date" };
    }

    // Set time if specified
    if (validated.dueTime) {
      const [hours, minutes] = validated.dueTime.split(":").map(Number);
      dueDate.setHours(hours, minutes, 0, 0);
    } else {
      dueDate.setHours(9, 0, 0, 0);
    }

    const reminder = await FinancialReminder.create({
      userId,
      title: validated.title,
      category: validated.category,
      subCategory: validated.subCategory || undefined,
      amount: validated.amount != null ? validated.amount.toString() : undefined,
      isEstimatedAmount: validated.isEstimatedAmount || false,
      currency: validated.currency || "BDT",
      dueDate,
      dueTime: validated.dueTime || undefined,
      accountId: accountObjId,
      linkedEntityType: validated.linkedEntityType,
      linkedEntityId: linkedObjId,
      recurrence: validated.recurrence,
      recurrenceInterval: validated.recurrenceInterval || 1,
      recurrenceEnd: {
        type: validated.recurrenceEndType,
        occurrences: validated.recurrenceEndOccurrences,
        endDate: validated.recurrenceEndDate ? new Date(validated.recurrenceEndDate) : undefined,
      },
      advanceDays: validated.advanceDays,
      notificationChannels: validated.notificationChannels,
      notes: validated.notes,
      autoCreateTransaction: validated.autoCreateTransaction,
      status: "active",
      nextDueDate: dueDate,
      occurrenceCount: 0,
      history: [],
    });

    await syncScheduledReminders(reminder);

    revalidatePath("/dashboard/money");
    revalidatePath("/dashboard/money/reminders");

    return { success: true, reminder: serializeDoc(reminder) };
  } catch (error: any) {
    console.error("[FinancialReminder] Create error:", error);
    return { success: false, error: error.message || "Failed to create reminder" };
  }
}

// 2. GET FINANCIAL REMINDERS
export interface GetFinancialRemindersFilters {
  category?: string;
  status?: string;
  dateRange?: "all" | "today" | "upcoming_7" | "upcoming_30" | "overdue" | "completed";
}

export async function getFinancialReminders(filters: GetFinancialRemindersFilters = {}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized", reminders: [] };
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const query: Record<string, any> = { userId };

    if (filters.category && filters.category !== "all") {
      query.category = filters.category;
    }

    if (filters.status && filters.status !== "all") {
      query.status = filters.status;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filters.dateRange === "today") {
      query.nextDueDate = { $gte: todayStart, $lte: todayEnd };
      if (!filters.status) query.status = "active";
    } else if (filters.dateRange === "overdue") {
      query.nextDueDate = { $lt: todayStart };
      query.status = "active";
    } else if (filters.dateRange === "upcoming_7") {
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      query.nextDueDate = { $gte: todayStart, $lte: in7Days };
      if (!filters.status) query.status = "active";
    } else if (filters.dateRange === "upcoming_30") {
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      query.nextDueDate = { $gte: todayStart, $lte: in30Days };
      if (!filters.status) query.status = "active";
    } else if (filters.dateRange === "completed") {
      query.status = "completed";
    }

    const reminders = await FinancialReminder.find(query)
      .sort({ nextDueDate: 1 })
      .populate("accountId", "name currency balance")
      .populate("linkedEntityId")
      .lean();

    return {
      success: true,
      reminders: reminders.map(serializeDoc),
    };
  } catch (error: any) {
    console.error("[FinancialReminder] Get error:", error);
    return { success: false, error: error.message || "Failed to fetch reminders", reminders: [] };
  }
}

// 3. COMPLETE OR MARK PAID
export interface CompleteReminderOptions {
  amountPaid?: number;
  actualAmount?: number;
  transactionAccountId?: string;
  accountId?: string;
  createTransactionRecord?: boolean;
  recordTransaction?: boolean;
  paidDate?: string;
  notes?: string;
}

export async function completeFinancialReminderOccurrence(
  reminderId: string,
  options: CompleteReminderOptions = {}
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const reminder = await FinancialReminder.findOne({ _id: reminderId, userId });
    if (!reminder) {
      return { success: false, error: "Reminder not found or access denied" };
    }

    let createdTransactionId: mongoose.Types.ObjectId | undefined;

    const shouldCreateTx = options.createTransactionRecord ?? options.recordTransaction ?? false;
    const targetAccountId = options.transactionAccountId || options.accountId;
    const paymentAmount = options.amountPaid != null
      ? options.amountPaid
      : options.actualAmount != null
      ? options.actualAmount
      : reminder.amount
      ? parseFloat(reminder.amount.toString())
      : 0;

    // Optionally record a linked financial transaction
    if (shouldCreateTx && targetAccountId) {
      const acc = await Account.findOne({ _id: targetAccountId, userId });
      if (!acc) {
        return { success: false, error: "Unauthorized payment account" };
      }

      if (paymentAmount > 0) {
        const txType = reminder.category === "income" ? "income" : "expense";
        const txRes = await createTransaction({
          amount: paymentAmount,
          currency: reminder.currency || "BDT",
          date: options.paidDate || new Date().toISOString(),
          accountId: acc._id.toString(),
          description: options.notes || `Payment: ${reminder.title}`,
          type: txType,
        });

        if (txRes.success && txRes.transaction?._id) {
          createdTransactionId = new mongoose.Types.ObjectId(txRes.transaction._id);
        }
      }
    }

    // Append to occurrence history
    const historyEntry = {
      occurrenceDate: reminder.nextDueDate,
      completedAt: new Date(),
      status: "paid" as const,
      transactionId: createdTransactionId,
      amountPaid: paymentAmount > 0 ? paymentAmount.toString() : reminder.amount,
      notes: options.notes,
    };

    reminder.history.push(historyEntry as any);
    reminder.occurrenceCount = (reminder.occurrenceCount || 0) + 1;

    // Handle recurrence
    if (reminder.recurrence === "none") {
      reminder.status = "completed";
      await reminder.save();

      // Clean up pending reminders
      await Reminder.deleteMany({
        userId,
        entityType: "FinancialReminder",
        entityId: reminder._id,
        status: "pending",
      });
    } else {
      // Calculate next due date
      const nextDate = calculateNextDueDate(
        reminder.nextDueDate,
        reminder.recurrence,
        reminder.recurrenceInterval || 1
      );

      // Check recurrence end condition
      const endRule = reminder.recurrenceEnd;
      let isEnded = false;

      if (endRule?.type === "after_occurrences" && endRule.occurrences) {
        if (reminder.occurrenceCount >= endRule.occurrences) {
          isEnded = true;
        }
      } else if (endRule?.type === "on_date" && endRule.endDate) {
        if (nextDate.getTime() > new Date(endRule.endDate).getTime()) {
          isEnded = true;
        }
      }

      if (isEnded) {
        reminder.status = "completed";
      } else {
        reminder.nextDueDate = nextDate;
      }

      await reminder.save();
      await syncScheduledReminders(reminder);
    }

    revalidatePath("/dashboard/money");
    revalidatePath("/dashboard/money/reminders");

    return {
      success: true,
      reminder: serializeDoc(reminder),
      transactionId: createdTransactionId ? createdTransactionId.toString() : undefined,
    };
  } catch (error: any) {
    console.error("[FinancialReminder] Complete error:", error);
    return { success: false, error: error.message || "Failed to complete reminder" };
  }
}

// 4. SNOOZE REMINDER
export async function snoozeFinancialReminder(
  reminderId: string,
  daysToSnooze?: number,
  untilDate?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const reminder = await FinancialReminder.findOne({ _id: reminderId, userId });
    if (!reminder) return { success: false, error: "Reminder not found" };

    let newNextDate: Date;
    if (untilDate) {
      newNextDate = new Date(untilDate);
    } else {
      const days = daysToSnooze && daysToSnooze > 0 ? daysToSnooze : 1;
      newNextDate = new Date(reminder.nextDueDate.getTime() + days * 24 * 60 * 60 * 1000);
    }

    reminder.nextDueDate = newNextDate;
    await reminder.save();

    await syncScheduledReminders(reminder);

    revalidatePath("/dashboard/money/reminders");
    return { success: true, reminder: serializeDoc(reminder) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. SKIP CURRENT OCCURRENCE
export async function skipFinancialReminderOccurrence(reminderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const reminder = await FinancialReminder.findOne({ _id: reminderId, userId });
    if (!reminder) return { success: false, error: "Reminder not found" };

    if (reminder.recurrence === "none") {
      reminder.status = "completed";
    } else {
      reminder.history.push({
        occurrenceDate: reminder.nextDueDate,
        completedAt: new Date(),
        status: "skipped",
      } as any);

      reminder.nextDueDate = calculateNextDueDate(
        reminder.nextDueDate,
        reminder.recurrence,
        reminder.recurrenceInterval || 1
      );
      reminder.occurrenceCount = (reminder.occurrenceCount || 0) + 1;
    }

    await reminder.save();
    await syncScheduledReminders(reminder);

    revalidatePath("/dashboard/money/reminders");
    return { success: true, reminder: serializeDoc(reminder) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. PAUSE / RESUME REMINDER
export async function togglePauseFinancialReminder(reminderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const reminder = await FinancialReminder.findOne({ _id: reminderId, userId });
    if (!reminder) return { success: false, error: "Reminder not found" };

    if (reminder.status === "active") {
      reminder.status = "paused";
      await reminder.save();
      // Remove scheduled reminders while paused
      await Reminder.deleteMany({
        userId,
        entityType: "FinancialReminder",
        entityId: reminder._id,
        status: "pending",
      });
    } else if (reminder.status === "paused") {
      reminder.status = "active";
      // If nextDueDate is in the past, advance it to future or today
      const now = new Date();
      while (reminder.nextDueDate.getTime() < now.getTime() && reminder.recurrence !== "none") {
        reminder.nextDueDate = calculateNextDueDate(
          reminder.nextDueDate,
          reminder.recurrence,
          reminder.recurrenceInterval || 1
        );
      }
      await reminder.save();
      await syncScheduledReminders(reminder);
    }

    revalidatePath("/dashboard/money/reminders");
    return { success: true, reminder: serializeDoc(reminder) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. UPDATE FINANCIAL REMINDER
export async function updateFinancialReminder(reminderId: string, rawInput: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const reminder = await FinancialReminder.findOne({ _id: reminderId, userId });
    if (!reminder) return { success: false, error: "Reminder not found" };

    const normalized = { ...rawInput };
    if (rawInput.notificationChannels && !Array.isArray(rawInput.notificationChannels) && typeof rawInput.notificationChannels === "object") {
      const channels: string[] = [];
      if (rawInput.notificationChannels.inApp !== false) channels.push("in-app");
      if (rawInput.notificationChannels.push) channels.push("push");
      if (rawInput.notificationChannels.email) channels.push("email");
      normalized.notificationChannels = channels;
    }

    const validated = financialReminderSchema.partial().parse(normalized);

    if (validated.accountId) {
      const acc = await Account.findOne({ _id: validated.accountId, userId });
      if (!acc) return { success: false, error: "Account not found or access denied" };
      reminder.accountId = acc._id;
    } else if (validated.accountId === "") {
      reminder.accountId = undefined;
    }

    if (validated.dueDate) {
      const dueDate = new Date(validated.dueDate);
      const timeStr = validated.dueTime || reminder.dueTime;
      if (timeStr) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        dueDate.setHours(hours, minutes, 0, 0);
      } else {
        dueDate.setHours(9, 0, 0, 0);
      }
      reminder.dueDate = dueDate;
      reminder.nextDueDate = dueDate;
    }

    if (validated.title !== undefined) reminder.title = validated.title;
    if (validated.category !== undefined) reminder.category = validated.category;
    if (validated.subCategory !== undefined) reminder.subCategory = validated.subCategory || undefined;
    if (validated.amount !== undefined) reminder.amount = validated.amount != null ? validated.amount.toString() : undefined;
    if (validated.isEstimatedAmount !== undefined) reminder.isEstimatedAmount = validated.isEstimatedAmount;
    if (validated.currency !== undefined) reminder.currency = validated.currency;
    if (validated.dueTime !== undefined) reminder.dueTime = validated.dueTime || undefined;
    if (validated.recurrence !== undefined) reminder.recurrence = validated.recurrence;
    if (validated.recurrenceInterval !== undefined) reminder.recurrenceInterval = validated.recurrenceInterval;
    if (validated.advanceDays !== undefined) reminder.advanceDays = validated.advanceDays;
    if (validated.notificationChannels !== undefined) reminder.notificationChannels = validated.notificationChannels;
    if (validated.notes !== undefined) reminder.notes = validated.notes;

    await reminder.save();
    await syncScheduledReminders(reminder);

    revalidatePath("/dashboard/money/reminders");
    return { success: true, reminder: serializeDoc(reminder) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. DELETE FINANCIAL REMINDER
export async function deleteFinancialReminder(reminderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const deleted = await FinancialReminder.findOneAndDelete({ _id: reminderId, userId });
    if (!deleted) return { success: false, error: "Reminder not found" };

    // Remove all pending scheduled notifications
    await Reminder.deleteMany({
      userId,
      entityType: "FinancialReminder",
      entityId: reminderId,
    });

    revalidatePath("/dashboard/money/reminders");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. EVENT-BASED BUDGET & BALANCE THRESHOLD CHECKS
export async function checkAccountLowBalance(
  userId: mongoose.Types.ObjectId,
  accountId: string,
  currentBalance: number
) {
  try {
    const acc = await Account.findOne({ _id: accountId, userId });
    if (!acc || acc.lowBalanceThreshold == null) return;

    const threshold = parseFloat(acc.lowBalanceThreshold.toString());
    if (isNaN(threshold) || threshold <= 0) return;

    if (currentBalance <= threshold) {
      const todayDateStr = new Date().toISOString().split("T")[0];
      const idempotencyKey = `low_balance_${accountId}_${todayDateStr}`;

      const existingAlert = await Notification.findOne({
        userId,
        "metadata.idempotencyKey": idempotencyKey,
      });

      if (!existingAlert) {
        const notif = await Notification.create({
          userId,
          type: "BUDGET_ALERT",
          title: "Low Balance Warning ⚠️",
          body: `Your account “${acc.name}” balance (${acc.currency} ${currentBalance.toLocaleString()}) has fallen below your threshold of ${acc.currency} ${threshold.toLocaleString()}.`,
          url: "/dashboard/money",
          entityType: "BUDGET",
          entityId: accountId,
          status: "SENT",
          sentAt: new Date(),
          metadata: {
            idempotencyKey,
            accountId,
            currentBalance,
            threshold,
          },
        });

        notifyUserViaSSE(userId.toString(), {
          type: "NOTIFICATION_CREATED",
          notificationId: notif._id.toString(),
        });
      }
    }
  } catch (err) {
    console.error("[LowBalanceCheck] Error:", err);
  }
}
