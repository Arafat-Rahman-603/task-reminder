"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  BellRing,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  ExternalLink,
  FastForward,
  Filter,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  Building2,
  PiggyBank,
  Check,
  X,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  createFinancialReminder,
  updateFinancialReminder,
  deleteFinancialReminder,
  completeFinancialReminderOccurrence,
  snoozeFinancialReminder,
  skipFinancialReminderOccurrence,
  togglePauseFinancialReminder,
} from "@/actions/financialReminder.actions";

// Category display mapping
const CATEGORY_META: Record<string, { label: string; icon: any; color: string; group: string }> = {
  bill_utility: { label: "Bill & Utility", icon: Tag, color: "text-amber-400 bg-amber-500/10", group: "Bills" },
  rent_housing: { label: "Rent & Housing", icon: Building2, color: "text-blue-400 bg-blue-500/10", group: "Bills" },
  insurance_premium: { label: "Insurance", icon: Tag, color: "text-cyan-400 bg-cyan-500/10", group: "Bills" },
  subscription: { label: "Subscription", icon: RefreshCw, color: "text-purple-400 bg-purple-500/10", group: "Subscriptions" },
  loan_installment: { label: "Loan Installment", icon: CreditCard, color: "text-rose-400 bg-rose-500/10", group: "Loans" },
  credit_card: { label: "Credit Card Due", icon: CreditCard, color: "text-red-400 bg-red-500/10", group: "Loans" },
  investment_contribution: { label: "Investment Contribution", icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10", group: "Investments" },
  investment_maturity: { label: "Deposit / Bond Maturity", icon: CalendarClock, color: "text-teal-400 bg-teal-500/10", group: "Investments" },
  dividend_interest: { label: "Expected Dividend / Interest", icon: DollarSign, color: "text-green-400 bg-green-500/10", group: "Investments" },
  portfolio_review: { label: "Portfolio Review", icon: TrendingUp, color: "text-indigo-400 bg-indigo-500/10", group: "Investments" },
  savings_goal: { label: "Savings Goal", icon: PiggyBank, color: "text-lime-400 bg-lime-500/10", group: "Savings" },
  planned_transfer: { label: "Planned Transfer", icon: RefreshCw, color: "text-sky-400 bg-sky-500/10", group: "Transfers" },
  salary_income: { label: "Expected Income / Salary", icon: DollarSign, color: "text-emerald-300 bg-emerald-500/15", group: "Income" },
  receivable_followup: { label: "Receivable Follow-up", icon: DollarSign, color: "text-yellow-400 bg-yellow-500/10", group: "Income" },
  tax_deadline: { label: "Tax Deadline", icon: AlertTriangle, color: "text-orange-400 bg-orange-500/10", group: "Deadlines" },
  document_expiry: { label: "Document Expiry", icon: Calendar, color: "text-gray-400 bg-surface-container-high", group: "Deadlines" },
  custom: { label: "Custom Reminder", icon: BellRing, color: "text-stitch-primary bg-primary/10", group: "Other" },
};

interface Props {
  initialReminders: any[];
  accounts: any[];
  investments: any[];
  debts: any[];
  goals: any[];
}

export default function FinancialRemindersClient({
  initialReminders,
  accounts,
  investments,
  debts,
  goals,
}: Props) {
  const [reminders, setReminders] = useState<any[]>(initialReminders);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "overdue" | "recurring" | "completed" | "paused">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any | null>(null);
  const [paymentModalReminder, setPaymentModalReminder] = useState<any | null>(null);
  const [snoozeModalReminder, setSnoozeModalReminder] = useState<any | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "bill_utility",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: "09:00",
    hasTime: false,
    amount: "",
    isEstimatedAmount: false,
    currency: "BDT",
    accountId: "",
    investmentId: "",
    debtId: "",
    goalId: "",
    recurrence: "none",
    recurrenceInterval: 1,
    recurrenceEndType: "never",
    recurrenceEndDate: "",
    recurrenceEndOccurrences: 12,
    advanceDays: [0, 1, 3],
    notifyInApp: true,
    notifyPush: true,
    notifyEmail: false,
    notes: "",
  });

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    recordTransaction: true,
    amount: "",
    accountId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Snooze Form State
  const [snoozeDays, setSnoozeDays] = useState(1);
  const [customSnoozeDate, setCustomSnoozeDate] = useState("");

  // Filter calculations
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const next30DaysEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let overdueCount = 0;
    let overdueSum = 0;
    let dueTodayCount = 0;
    let dueTodaySum = 0;
    let upcoming30Count = 0;
    let upcoming30Sum = 0;
    let recurringCount = 0;

    for (const r of reminders) {
      if (r.status === "completed") continue;
      const due = new Date(r.nextDueDate);
      const amt = r.amount ? parseFloat(r.amount) : 0;

      if (r.recurrence !== "none" && r.status === "active") {
        recurringCount++;
      }

      if (r.status === "active") {
        if (due < todayStart) {
          overdueCount++;
          overdueSum += amt;
        } else if (due >= todayStart && due <= todayEnd) {
          dueTodayCount++;
          dueTodaySum += amt;
        } else if (due > todayEnd && due <= next30DaysEnd) {
          upcoming30Count++;
          upcoming30Sum += amt;
        }
      }
    }

    return {
      overdueCount,
      overdueSum,
      dueTodayCount,
      dueTodaySum,
      upcoming30Count,
      upcoming30Sum,
      recurringCount,
    };
  }, [reminders, todayStart, todayEnd, next30DaysEnd]);

  // Filtered Reminders List
  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      // Category filter
      if (selectedCategory !== "all" && r.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q);
        const matchCat = r.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      const due = new Date(r.nextDueDate);

      // Status Tab filter
      switch (activeTab) {
        case "upcoming":
          return r.status === "active" && due >= todayStart;
        case "overdue":
          return r.status === "active" && due < todayStart;
        case "recurring":
          return r.recurrence !== "none" && r.status !== "completed";
        case "completed":
          return r.status === "completed";
        case "paused":
          return r.status === "paused";
        case "all":
        default:
          return true;
      }
    });
  }, [reminders, selectedCategory, searchQuery, activeTab, todayStart]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingReminder(null);
    setFormData({
      title: "",
      description: "",
      category: "bill_utility",
      dueDate: new Date().toISOString().split("T")[0],
      dueTime: "09:00",
      hasTime: false,
      amount: "",
      isEstimatedAmount: false,
      currency: "BDT",
      accountId: accounts.length > 0 ? accounts[0]._id : "",
      investmentId: "",
      debtId: "",
      goalId: "",
      recurrence: "none",
      recurrenceInterval: 1,
      recurrenceEndType: "never",
      recurrenceEndDate: "",
      recurrenceEndOccurrences: 12,
      advanceDays: [0, 1, 3],
      notifyInApp: true,
      notifyPush: true,
      notifyEmail: false,
      notes: "",
    });
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (reminder: any) => {
    setEditingReminder(reminder);
    const dueDateStr = reminder.nextDueDate
      ? new Date(reminder.nextDueDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    setFormData({
      title: reminder.title,
      description: reminder.description || "",
      category: reminder.category,
      dueDate: dueDateStr,
      dueTime: reminder.dueTime || "09:00",
      hasTime: reminder.hasTime || false,
      amount: reminder.amount ? reminder.amount.toString() : "",
      isEstimatedAmount: reminder.isEstimatedAmount || false,
      currency: reminder.currency || "BDT",
      accountId: reminder.accountId?._id || reminder.accountId || "",
      investmentId: reminder.linkedEntity?.entityType === "Investment" ? reminder.linkedEntity.entityId : "",
      debtId: reminder.linkedEntity?.entityType === "Debt" ? reminder.linkedEntity.entityId : "",
      goalId: reminder.linkedEntity?.entityType === "Goal" ? reminder.linkedEntity.entityId : "",
      recurrence: reminder.recurrence || "none",
      recurrenceInterval: reminder.recurrenceInterval || 1,
      recurrenceEndType: reminder.recurrenceEnd?.type || "never",
      recurrenceEndDate: reminder.recurrenceEnd?.endDate
        ? new Date(reminder.recurrenceEnd.endDate).toISOString().split("T")[0]
        : "",
      recurrenceEndOccurrences: reminder.recurrenceEnd?.occurrences || 12,
      advanceDays: reminder.advanceDays || [0, 1, 3],
      notifyInApp: reminder.notificationChannels?.inApp ?? true,
      notifyPush: reminder.notificationChannels?.push ?? true,
      notifyEmail: reminder.notificationChannels?.email ?? false,
      notes: reminder.notes || "",
    });
    setIsCreateOpen(true);
  };

  // Save Create / Edit
  const handleSubmitReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Title is required");

    let linkedEntity: any = undefined;
    if (formData.investmentId) {
      linkedEntity = { entityType: "Investment", entityId: formData.investmentId };
    } else if (formData.debtId) {
      linkedEntity = { entityType: "Debt", entityId: formData.debtId };
    } else if (formData.goalId) {
      linkedEntity = { entityType: "Goal", entityId: formData.goalId };
    }

    const payload: any = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category,
      dueDate: formData.dueDate,
      dueTime: formData.hasTime ? formData.dueTime : undefined,
      hasTime: formData.hasTime,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      isEstimatedAmount: formData.isEstimatedAmount,
      currency: formData.currency,
      accountId: formData.accountId || undefined,
      linkedEntity,
      recurrence: formData.recurrence,
      recurrenceInterval: Number(formData.recurrenceInterval) || 1,
      recurrenceEnd:
        formData.recurrenceEndType !== "never"
          ? {
              type: formData.recurrenceEndType,
              endDate: formData.recurrenceEndDate || undefined,
              occurrences: formData.recurrenceEndOccurrences
                ? Number(formData.recurrenceEndOccurrences)
                : undefined,
            }
          : undefined,
      advanceDays: formData.advanceDays,
      notificationChannels: {
        inApp: formData.notifyInApp,
        push: formData.notifyPush,
        email: formData.notifyEmail,
      },
      notes: formData.notes.trim() || undefined,
    };

    startTransition(async () => {
      if (editingReminder) {
        const res = await updateFinancialReminder(editingReminder._id, payload);
        if (res.success && res.reminder) {
          setReminders((prev) =>
            prev.map((r) => (r._id === editingReminder._id ? res.reminder : r))
          );
          setIsCreateOpen(false);
        } else {
          alert(res.error || "Failed to update reminder");
        }
      } else {
        const res = await createFinancialReminder(payload);
        if (res.success && res.reminder) {
          setReminders((prev) => [res.reminder, ...prev]);
          setIsCreateOpen(false);
        } else {
          alert(res.error || "Failed to create reminder");
        }
      }
    });
  };

  // Open Payment Modal
  const openPaymentModal = (reminder: any) => {
    setPaymentModalReminder(reminder);
    setPaymentForm({
      recordTransaction: Boolean(reminder.accountId),
      amount: reminder.amount ? reminder.amount.toString() : "",
      accountId: reminder.accountId?._id || reminder.accountId || (accounts[0]?._id ?? ""),
      date: new Date().toISOString().split("T")[0],
      notes: `Paid: ${reminder.title}`,
    });
  };

  // Confirm Payment / Completion
  const handleConfirmPayment = () => {
    if (!paymentModalReminder) return;

    startTransition(async () => {
      const options: any = {
        recordTransaction: paymentForm.recordTransaction,
        actualAmount: paymentForm.amount ? parseFloat(paymentForm.amount) : undefined,
        paidDate: paymentForm.date,
        accountId: paymentForm.recordTransaction ? paymentForm.accountId : undefined,
        notes: paymentForm.notes,
      };

      const res = await completeFinancialReminderOccurrence(paymentModalReminder._id, options);
      if (res.success && res.reminder) {
        setReminders((prev) =>
          prev.map((r) => (r._id === paymentModalReminder._id ? res.reminder : r))
        );
        setPaymentModalReminder(null);
      } else {
        alert(res.error || "Failed to complete payment");
      }
    });
  };

  // Handle Snooze
  const handleConfirmSnooze = () => {
    if (!snoozeModalReminder) return;

    startTransition(async () => {
      let untilDate: string | undefined = undefined;
      if (customSnoozeDate) {
        untilDate = customSnoozeDate;
      }

      const res = await snoozeFinancialReminder(
        snoozeModalReminder._id,
        customSnoozeDate ? undefined : snoozeDays,
        untilDate
      );

      if (res.success && res.reminder) {
        setReminders((prev) =>
          prev.map((r) => (r._id === snoozeModalReminder._id ? res.reminder : r))
        );
        setSnoozeModalReminder(null);
        setCustomSnoozeDate("");
      } else {
        alert(res.error || "Failed to snooze reminder");
      }
    });
  };

  // Skip occurrence
  const handleSkipOccurrence = (reminderId: string) => {
    if (!confirm("Skip this occurrence and move to next scheduled date?")) return;
    startTransition(async () => {
      const res = await skipFinancialReminderOccurrence(reminderId);
      if (res.success && res.reminder) {
        setReminders((prev) => prev.map((r) => (r._id === reminderId ? res.reminder : r)));
      } else {
        alert(res.error || "Failed to skip occurrence");
      }
    });
  };

  // Toggle pause
  const handleTogglePause = (reminderId: string) => {
    startTransition(async () => {
      const res = await togglePauseFinancialReminder(reminderId);
      if (res.success && res.reminder) {
        setReminders((prev) => prev.map((r) => (r._id === reminderId ? res.reminder : r)));
      } else {
        alert(res.error || "Failed to toggle pause status");
      }
    });
  };

  // Delete Reminder
  const handleDeleteReminder = (reminderId: string) => {
    if (!confirm("Are you sure you want to delete this reminder and all its scheduled notifications?")) return;
    startTransition(async () => {
      const res = await deleteFinancialReminder(reminderId);
      if (res.success) {
        setReminders((prev) => prev.filter((r) => r._id !== reminderId));
      } else {
        alert(res.error || "Failed to delete reminder");
      }
    });
  };

  // Helper for toggle advance days
  const toggleAdvanceDay = (day: number) => {
    setFormData((prev) => {
      const exists = prev.advanceDays.includes(day);
      const nextDays = exists
        ? prev.advanceDays.filter((d) => d !== day)
        : [...prev.advanceDays, day].sort((a, b) => a - b);
      return { ...prev, advanceDays: nextDays };
    });
  };

  return (
    <div className={`flex flex-col w-full space-y-5 pb-12 text-on-surface ${isPending ? "opacity-80" : ""}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/money"
            className="w-9 h-9 rounded-xl bg-surface-container-high/80 hover:bg-surface-container hover:text-stitch-primary flex items-center justify-center transition-all"
            title="Back to Finance"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stitch-primary">
              Personal OS · Money Management
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-stitch-primary" />
              Financial Reminders
            </h1>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stitch-primary text-on-primary font-medium text-xs shadow-md hover:bg-stitch-primary/90 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Reminder
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Overdue */}
        <div className="p-3.5 rounded-2xl bg-surface-container/70 backdrop-blur-xl border border-error/20 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-on-surface-variant">Overdue</span>
            <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-error">{summaryMetrics.overdueCount}</span>
            {summaryMetrics.overdueSum > 0 && (
              <span className="text-xs font-semibold text-error/90">
                {formatCurrency(summaryMetrics.overdueSum)}
              </span>
            )}
          </div>
        </div>

        {/* Due Today */}
        <div className="p-3.5 rounded-2xl bg-surface-container/70 backdrop-blur-xl border border-amber-500/20 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-on-surface-variant">Due Today</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-400">{summaryMetrics.dueTodayCount}</span>
            {summaryMetrics.dueTodaySum > 0 && (
              <span className="text-xs font-semibold text-amber-400/90">
                {formatCurrency(summaryMetrics.dueTodaySum)}
              </span>
            )}
          </div>
        </div>

        {/* Upcoming 30 Days */}
        <div className="p-3.5 rounded-2xl bg-surface-container/70 backdrop-blur-xl border border-primary/20 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-on-surface-variant">Next 30 Days</span>
            <Calendar className="w-3.5 h-3.5 text-stitch-primary" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-on-surface">{summaryMetrics.upcoming30Count}</span>
            {summaryMetrics.upcoming30Sum > 0 && (
              <span className="text-xs font-semibold text-stitch-primary">
                {formatCurrency(summaryMetrics.upcoming30Sum)}
              </span>
            )}
          </div>
        </div>

        {/* Active Recurring */}
        <div className="p-3.5 rounded-2xl bg-surface-container/70 backdrop-blur-xl border border-purple-500/20 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-on-surface-variant">Recurring Schedules</span>
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-on-surface">{summaryMetrics.recurringCount}</span>
            <span className="text-xs text-on-surface-variant">Active</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Status Tab Pills */}
          <div className="flex items-center p-1 rounded-xl bg-surface-container-high/70 backdrop-blur-md overflow-x-auto">
            {(
              [
                { key: "all", label: `All (${reminders.length})` },
                { key: "upcoming", label: "Upcoming" },
                { key: "overdue", label: `Overdue (${summaryMetrics.overdueCount})` },
                { key: "recurring", label: "Recurring" },
                { key: "completed", label: "Completed" },
                { key: "paused", label: "Paused" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeTab === key
                    ? "bg-stitch-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-container/60 border border-surface-container-high focus:outline-none focus:border-stitch-primary text-on-surface placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "bg-surface-container/50 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition-all ${
                selectedCategory === key
                  ? "bg-primary-container text-on-primary-container font-semibold"
                  : "bg-surface-container/50 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-2.5">
        {filteredReminders.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-surface-container/50 border border-dashed border-surface-container-high p-6 flex flex-col items-center justify-center">
            <CalendarClock className="w-10 h-10 text-on-surface-variant opacity-30 mb-2" />
            <p className="text-sm font-semibold text-on-surface">No reminders found</p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
              {searchQuery || selectedCategory !== "all" || activeTab !== "all"
                ? "Try adjusting your filters or search terms."
                : "Set up reminders for bills, loan payments, subscriptions, and investment dates."}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-3.5 py-2 rounded-xl bg-stitch-primary text-on-primary font-medium text-xs hover:bg-stitch-primary/90 transition-all"
            >
              Create First Reminder
            </button>
          </div>
        ) : (
          filteredReminders.map((r) => {
            const meta = CATEGORY_META[r.category] || CATEGORY_META.custom;
            const CategoryIcon = meta.icon;
            const due = new Date(r.nextDueDate);
            const isOverdue = r.status === "active" && due < todayStart;
            const isDueToday = r.status === "active" && due >= todayStart && due <= todayEnd;
            const isCompleted = r.status === "completed";
            const isPaused = r.status === "paused";

            return (
              <div
                key={r._id}
                className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-surface-container/70 hover:bg-surface-container-high/80 backdrop-blur-xl transition-all shadow-md gap-3 ${
                  isOverdue ? "border-l-4 border-l-error" : isDueToday ? "border-l-4 border-l-amber-400" : ""
                }`}
              >
                {/* Left Section: Icon & Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.color}`}
                  >
                    <CategoryIcon className="w-5 h-5" />
                  </div>

                  <div className="flex flex-col min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-on-surface truncate">{r.title}</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? "bg-error/20 text-error"
                            : isDueToday
                            ? "bg-amber-400/20 text-amber-300"
                            : isCompleted
                            ? "bg-emerald-500/20 text-emerald-300"
                            : isPaused
                            ? "bg-surface-variant text-on-surface-variant"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {isOverdue
                          ? "Overdue"
                          : isDueToday
                          ? "Due Today"
                          : isCompleted
                          ? "Completed"
                          : isPaused
                          ? "Paused"
                          : `Due ${formatDate(due)}`}
                      </span>

                      {r.recurrence !== "none" && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span className="capitalize">{r.recurrence.replace("_", " ")}</span>
                        </span>
                      )}
                    </div>

                    {r.description && (
                      <p className="text-xs text-on-surface-variant line-clamp-1">{r.description}</p>
                    )}

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-on-surface-variant pt-0.5">
                      <span>{meta.label}</span>
                      {r.accountId?.name && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-on-surface">
                            <Building2 className="w-3 h-3 text-stitch-primary" />
                            {r.accountId.name}
                          </span>
                        </>
                      )}
                      {r.advanceDays && r.advanceDays.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-on-surface-variant/80">
                            Notify {r.advanceDays.map((d: number) => (d === 0 ? "day of" : `${d}d prior`)).join(", ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section: Amount & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container-high/40">
                  {/* Amount Display */}
                  <div className="flex flex-col sm:text-right">
                    {r.amount != null ? (
                      <div className="flex items-baseline gap-1">
                        {r.isEstimatedAmount && (
                          <span className="text-[10px] text-on-surface-variant font-medium">Est. ~</span>
                        )}
                        <span className="text-base font-bold text-on-surface">
                          {formatCurrency(parseFloat(r.amount), r.currency)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-variant italic">No amount set</span>
                    )}
                    <span className="text-[10px] text-on-surface-variant">
                      {formatDate(due)} {r.hasTime && r.dueTime ? `at ${r.dueTime}` : ""}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1">
                    {!isCompleted && (
                      <>
                        {/* Mark Paid / Complete */}
                        <button
                          onClick={() => openPaymentModal(r)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-medium flex items-center gap-1 transition-all"
                          title="Mark as Paid / Complete"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Pay</span>
                        </button>

                        {/* Snooze */}
                        <button
                          onClick={() => {
                            setSnoozeModalReminder(r);
                            setSnoozeDays(1);
                            setCustomSnoozeDate("");
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-amber-300 hover:bg-amber-400/10 transition-colors"
                          title="Snooze"
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        {/* Skip Occurrence (if recurring) */}
                        {r.recurrence !== "none" && (
                          <button
                            onClick={() => handleSkipOccurrence(r._id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-stitch-primary hover:bg-primary/10 transition-colors"
                            title="Skip this occurrence"
                          >
                            <FastForward className="w-4 h-4" />
                          </button>
                        )}

                        {/* Pause / Resume (if recurring) */}
                        {r.recurrence !== "none" && (
                          <button
                            onClick={() => handleTogglePause(r._id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                            title={isPaused ? "Resume schedule" : "Pause schedule"}
                          >
                            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                          </button>
                        )}
                      </>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(r)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-stitch-primary hover:bg-primary/10 transition-colors"
                      title="Edit reminder"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteReminder(r._id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-safe pb-safe">
          <div className="relative w-full max-w-xl rounded-2xl bg-surface-container p-6 shadow-2xl border border-surface-container-high my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-stitch-primary" />
                {editingReminder ? "Edit Financial Reminder" : "New Financial Reminder"}
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReminder} className="space-y-4 pt-4 text-xs">
              {/* Category */}
              <div>
                <label className="block font-medium text-on-surface-variant mb-1">Reminder Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                >
                  <optgroup label="Bills & Utilities">
                    <option value="bill_utility">Bill & Utility (Electricity, Internet, Water)</option>
                    <option value="rent_housing">Rent & Housing</option>
                    <option value="insurance_premium">Insurance Premium</option>
                  </optgroup>
                  <optgroup label="Subscriptions">
                    <option value="subscription">Subscription Renewal (Netflix, SaaS, Gym)</option>
                  </optgroup>
                  <optgroup label="Loans & Credit">
                    <option value="loan_installment">Loan Installment (EMI)</option>
                    <option value="credit_card">Credit Card Due Date</option>
                  </optgroup>
                  <optgroup label="Investments">
                    <option value="investment_contribution">Planned Investment Contribution (DCA/SIP)</option>
                    <option value="investment_maturity">Fixed Deposit / Bond Maturity</option>
                    <option value="dividend_interest">Expected Dividend / Interest</option>
                    <option value="portfolio_review">Portfolio Review Reminder</option>
                  </optgroup>
                  <optgroup label="Savings & Transfers">
                    <option value="savings_goal">Savings Goal Contribution</option>
                    <option value="planned_transfer">Planned Account Transfer</option>
                  </optgroup>
                  <optgroup label="Income & Receivables">
                    <option value="salary_income">Expected Salary / Income</option>
                    <option value="receivable_followup">Receivable / Client Invoice Follow-up</option>
                  </optgroup>
                  <optgroup label="Deadlines & Custom">
                    <option value="tax_deadline">Tax-Related Deadline</option>
                    <option value="document_expiry">Document / Policy Expiry</option>
                    <option value="custom">Other Custom Reminder</option>
                  </optgroup>
                </select>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div>
                  <label className="block font-medium text-on-surface-variant mb-1">
                    Title <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Home Internet Bill, Car Loan EMI, FDR Maturity"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                  />
                </div>
                <div>
                  <label className="block font-medium text-on-surface-variant mb-1">Description / Notes</label>
                  <input
                    type="text"
                    placeholder="Optional notes, account number or billing ref"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-on-surface-variant mb-1">
                    Due Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-on-surface-variant">Specific Time</label>
                    <label className="flex items-center gap-1 text-[11px] text-on-surface-variant cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasTime}
                        onChange={(e) => setFormData({ ...formData, hasTime: e.target.checked })}
                        className="rounded"
                      />
                      Set exact time
                    </label>
                  </div>
                  <input
                    type="time"
                    disabled={!formData.hasTime}
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary ${
                      !formData.hasTime ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-on-surface-variant">Amount (Optional)</label>
                    <label className="flex items-center gap-1 text-[11px] text-on-surface-variant cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isEstimatedAmount}
                        onChange={(e) => setFormData({ ...formData, isEstimatedAmount: e.target.checked })}
                        className="rounded"
                      />
                      Estimated amount
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                  />
                </div>

                <div>
                  <label className="block font-medium text-on-surface-variant mb-1">Currency</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                  />
                </div>
              </div>

              {/* Associated Account & Entity Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-on-surface-variant mb-1">Associated Account</label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                  >
                    <option value="">None (Unlinked)</option>
                    {accounts.map((acc: any) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} ({acc.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic linked entity based on category */}
                {formData.category.startsWith("investment_") ? (
                  <div>
                    <label className="block font-medium text-on-surface-variant mb-1">Link Investment</label>
                    <select
                      value={formData.investmentId}
                      onChange={(e) => setFormData({ ...formData, investmentId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                    >
                      <option value="">None (General Investment)</option>
                      {investments.map((inv: any) => (
                        <option key={inv._id} value={inv._id}>
                          {inv.assetName} ({inv.assetType})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : formData.category === "loan_installment" || formData.category === "credit_card" ? (
                  <div>
                    <label className="block font-medium text-on-surface-variant mb-1">Link Debt / Loan</label>
                    <select
                      value={formData.debtId}
                      onChange={(e) => setFormData({ ...formData, debtId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                    >
                      <option value="">None (General Debt)</option>
                      {debts.map((d: any) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.type})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : formData.category === "savings_goal" ? (
                  <div>
                    <label className="block font-medium text-on-surface-variant mb-1">Link Savings Goal</label>
                    <select
                      value={formData.goalId}
                      onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                    >
                      <option value="">None (General Goal)</option>
                      {goals.map((g: any) => (
                        <option key={g._id} value={g._id}>
                          {g.title} ({g.progress}%)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>

              {/* Recurrence Schedule */}
              <div className="p-3.5 rounded-xl bg-surface-container-high/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-on-surface flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                    Recurrence Schedule
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1">Frequency</label>
                    <select
                      value={formData.recurrence}
                      onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                    >
                      <option value="none">One-Time (No Recurrence)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 Weeks</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly (3 Months)</option>
                      <option value="semi_annually">Semi-Annually (6 Months)</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom_days">Custom Day Interval</option>
                    </select>
                  </div>

                  {formData.recurrence === "custom_days" && (
                    <div>
                      <label className="block text-on-surface-variant mb-1">Interval (Every X Days)</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.recurrenceInterval}
                        onChange={(e) => setFormData({ ...formData, recurrenceInterval: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                      />
                    </div>
                  )}

                  {formData.recurrence !== "none" && (
                    <div>
                      <label className="block text-on-surface-variant mb-1">End Condition</label>
                      <select
                        value={formData.recurrenceEndType}
                        onChange={(e) => setFormData({ ...formData, recurrenceEndType: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                      >
                        <option value="never">Never (Ongoing)</option>
                        <option value="on_date">On Specific Date</option>
                        <option value="after_occurrences">After N Occurrences</option>
                      </select>
                    </div>
                  )}

                  {formData.recurrence !== "none" && formData.recurrenceEndType === "on_date" && (
                    <div>
                      <label className="block text-on-surface-variant mb-1">End Date</label>
                      <input
                        type="date"
                        value={formData.recurrenceEndDate}
                        onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                      />
                    </div>
                  )}

                  {formData.recurrence !== "none" && formData.recurrenceEndType === "after_occurrences" && (
                    <div>
                      <label className="block text-on-surface-variant mb-1">Total Occurrences</label>
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={formData.recurrenceEndOccurrences}
                        onChange={(e) =>
                          setFormData({ ...formData, recurrenceEndOccurrences: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-surface-container text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Advance Reminders (Lead times) */}
              <div>
                <label className="block font-medium text-on-surface-variant mb-1.5">
                  Advance Notification Lead Times
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { days: 0, label: "Day of (0d)" },
                    { days: 1, label: "1 day before" },
                    { days: 3, label: "3 days before" },
                    { days: 7, label: "7 days before" },
                    { days: 14, label: "14 days before" },
                  ].map(({ days, label }) => {
                    const active = formData.advanceDays.includes(days);
                    return (
                      <button
                        type="button"
                        key={days}
                        onClick={() => toggleAdvanceDay(days)}
                        className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                          active
                            ? "bg-stitch-primary text-on-primary shadow-sm"
                            : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Channels */}
              <div className="flex items-center gap-4 pt-1">
                <span className="font-medium text-on-surface-variant">Channels:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifyInApp}
                    onChange={(e) => setFormData({ ...formData, notifyInApp: e.target.checked })}
                    className="rounded"
                  />
                  <span>In-App</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifyPush}
                    onChange={(e) => setFormData({ ...formData, notifyPush: e.target.checked })}
                    className="rounded"
                  />
                  <span>Web Push</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-stitch-primary text-on-primary font-medium shadow-md hover:bg-stitch-primary/90 flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingReminder ? "Save Changes" : "Create Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARK PAID / COMPLETE MODAL */}
      {paymentModalReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pt-safe pb-safe">
          <div className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl border border-surface-container-high text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Record Payment / Complete
              </h2>
              <button
                onClick={() => setPaymentModalReminder(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-surface-container-high">
                <span className="text-xs font-semibold text-on-surface block">{paymentModalReminder.title}</span>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  Due: {formatDate(new Date(paymentModalReminder.nextDueDate))}
                </span>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-2 cursor-pointer p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <input
                    type="checkbox"
                    checked={paymentForm.recordTransaction}
                    onChange={(e) => setPaymentForm({ ...paymentForm, recordTransaction: e.target.checked })}
                    className="mt-0.5 rounded"
                  />
                  <div>
                    <span className="font-semibold text-on-surface block">
                      Record as an Expense Transaction
                    </span>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5">
                      Automatically deduct this payment from your selected Money account balance.
                    </span>
                  </div>
                </label>

                {paymentForm.recordTransaction && (
                  <div className="space-y-3 pl-1">
                    <div>
                      <label className="block text-on-surface-variant mb-1 font-medium">Payment Account</label>
                      <select
                        value={paymentForm.accountId}
                        onChange={(e) => setPaymentForm({ ...paymentForm, accountId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                      >
                        {accounts.map((acc: any) => (
                          <option key={acc._id} value={acc._id}>
                            {acc.name} ({formatCurrency(parseFloat(acc.balance?.$numberDecimal || acc.balance || "0"), acc.currency)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-on-surface-variant mb-1 font-medium">Actual Amount Paid</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-on-surface-variant mb-1 font-medium">Date Paid</label>
                        <input
                          type="date"
                          value={paymentForm.date}
                          onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setPaymentModalReminder(null)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-on-primary font-medium shadow-md hover:bg-emerald-600 flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SNOOZE MODAL */}
      {snoozeModalReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pt-safe pb-safe">
          <div className="relative w-full max-w-sm rounded-2xl bg-surface-container p-5 shadow-2xl border border-surface-container-high text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Snooze Reminder
              </h2>
              <button
                onClick={() => setSnoozeModalReminder(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-3">
              <p className="text-on-surface-variant">Choose how long to postpone &ldquo;{snoozeModalReminder.title}&rdquo;:</p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 1, label: "+1 Day" },
                  { days: 3, label: "+3 Days" },
                  { days: 7, label: "+1 Week" },
                ].map(({ days, label }) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setSnoozeDays(days);
                      setCustomSnoozeDate("");
                    }}
                    className={`py-2 rounded-xl font-medium transition-all ${
                      snoozeDays === days && !customSnoozeDate
                        ? "bg-amber-400 text-black font-semibold shadow-sm"
                        : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-on-surface-variant mb-1 font-medium">Or pick specific date:</label>
                <input
                  type="date"
                  value={customSnoozeDate}
                  onChange={(e) => setCustomSnoozeDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high text-on-surface border border-surface-container-high focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setSnoozeModalReminder(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-surface-container-high text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSnooze}
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-xl bg-amber-400 text-black font-semibold shadow-md hover:bg-amber-500 flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Snooze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
