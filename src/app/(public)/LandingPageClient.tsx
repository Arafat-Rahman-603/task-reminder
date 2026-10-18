"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ArrowRight,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Building2,
  Calendar,
  Database,
  Users,
  CheckCircle2,
  Wallet,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Bell,
  Receipt,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  Key
} from "lucide-react";

interface InteractiveReminder {
  id: string;
  title: string;
  category: "bill" | "subscription" | "loan" | "dividend" | "savings";
  categoryLabel: string;
  amount: number;
  dueDate: string;
  account: string;
  frequency: string;
  isPaid: boolean;
  priority: "high" | "medium" | "low";
}

export default function LandingPageClient() {
  // Hero interactive workspace switcher
  const [heroMode, setHeroMode] = useState<"personal" | "team">("personal");

  // Hero interactive focus tasks
  const [heroTasks, setHeroTasks] = useState([
    { id: 1, title: "08:30 AM • Morning Review & Habit Calibration", done: true, tag: "Routine" },
    { id: 2, title: "10:00 AM • Core Product Architecture & API Contracts", done: true, tag: "Deep Work" },
    { id: 3, title: "02:00 PM • Reconcile Financial Ledger & Invoices", done: false, tag: "Finance" },
    { id: 4, title: "04:30 PM • Credential Rotation in AES Vault", done: false, tag: "Security" },
  ]);

  const toggleHeroTask = (id: number) => {
    setHeroTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const heroCompletedCount = heroTasks.filter((t) => t.done).length;
  const heroProgressPercent = Math.round((heroCompletedCount / heroTasks.length) * 100);

  // Financial Ledger balance & eye toggle
  const [showLedgerBalances, setShowLedgerBalances] = useState<boolean>(true);

  // Module Explorer active tab
  const [activeTab, setActiveTab] = useState<
    "tasks" | "reminders" | "investments" | "vault" | "custom_db" | "teams"
  >("reminders");

  // Interactive Financial Reminders System state
  const [checkingBalance, setCheckingBalance] = useState<number>(6420.50);
  const [lastPaymentNotice, setLastPaymentNotice] = useState<string | null>(null);

  const [reminders, setReminders] = useState<InteractiveReminder[]>([
    {
      id: "rem-1",
      title: "AWS Cloud Infrastructure Cluster",
      category: "bill",
      categoryLabel: "Utility / Hosting",
      amount: 84.00,
      dueDate: "Tomorrow (Oct 19)",
      account: "Business Checking (••4920)",
      frequency: "Monthly",
      isPaid: false,
      priority: "high"
    },
    {
      id: "rem-2",
      title: "Figma Team Enterprise Workspace",
      category: "subscription",
      categoryLabel: "SaaS Subscription",
      amount: 45.00,
      dueDate: "In 3 Days (Oct 21)",
      account: "Business Checking (••4920)",
      frequency: "Monthly",
      isPaid: false,
      priority: "medium"
    },
    {
      id: "rem-3",
      title: "Vanguard Total Market Dividend",
      category: "dividend",
      categoryLabel: "Dividend Yield",
      amount: 142.80,
      dueDate: "Oct 25, 2026",
      account: "Brokerage Account",
      frequency: "Quarterly",
      isPaid: false,
      priority: "low"
    },
    {
      id: "rem-4",
      title: "Commercial Office Rent & Utilities",
      category: "loan",
      categoryLabel: "Fixed Lease",
      amount: 1450.00,
      dueDate: "Nov 01, 2026",
      account: "Business Checking (••4920)",
      frequency: "Monthly",
      isPaid: false,
      priority: "high"
    }
  ]);

  const markReminderPaid = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id && !r.isPaid) {
          const newBal = Math.max(0, checkingBalance - r.amount);
          setCheckingBalance(newBal);
          setLastPaymentNotice(`Recorded payment of $${r.amount.toFixed(2)} for "${r.title}". Automatically synced with Ledger.`);
          setTimeout(() => setLastPaymentNotice(null), 6000);
          return { ...r, isPaid: true };
        }
        return r;
      })
    );
  };

  const snoozeReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, dueDate: "Snoozed +3 Days" };
        }
        return r;
      })
    );
  };

  // Custom Database state
  const [activeDatabaseView, setActiveDatabaseView] = useState<"table" | "kanban" | "list">("table");

  const databaseRecords = [
    { id: 1, name: "Q4 Platform Modernization", category: "Engineering", priority: "High", status: "In Progress", date: "Oct 24, 2026" },
    { id: 2, name: "Mobile PWA Offline Sync Engine", category: "Core", priority: "Critical", status: "Review", date: "Nov 02, 2026" },
    { id: 3, name: "Stripe Billing & Invoicing Webhooks", category: "Finance", priority: "Medium", status: "Ready", date: "Nov 15, 2026" },
    { id: 4, name: "Role-Based Invitation Verification", category: "Security", priority: "High", status: "Completed", date: "Oct 12, 2026" },
  ];

  // Vault state
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(false);
  const [revealedSecretId, setRevealedSecretId] = useState<number | null>(null);

  const vaultItems = [
    { id: 1, name: "AWS Production Infrastructure Keys", type: "Access Token", secret: "AKIA_9492_PROD_DEPLOY_KEY", updated: "3d ago" },
    { id: 2, name: "Primary Cold Storage Recovery Phrase", type: "Seed Words", secret: "harvest matrix orbital cascade copper", updated: "2w ago" },
    { id: 3, name: "Stripe Production Webhook Signing Key", type: "API Secret", secret: "whsec_984fbc901e8284ca902e", updated: "1m ago" },
  ];

  // Team Permissions state
  const [selectedTeammate, setSelectedTeammate] = useState<number>(1);
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah.chen@axiomixs.com",
      role: "Admin",
      modules: { tasks: true, projects: true, databases: true, files: true }
    },
    {
      id: 2,
      name: "Marcus Brody",
      email: "marcus.b@axiomixs.com",
      role: "Member",
      modules: { tasks: true, projects: true, databases: false, files: true }
    },
    {
      id: 3,
      name: "Elena Rostova",
      email: "elena.r@axiomixs.com",
      role: "Viewer",
      modules: { tasks: true, projects: false, databases: false, files: false }
    }
  ]);

  const toggleTeammateModule = (memberId: number, moduleKey: "tasks" | "projects" | "databases" | "files") => {
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, modules: { ...m.modules, [moduleKey]: !m.modules[moduleKey] } }
          : m
      )
    );
  };

  const activeMember = teamMembers.find((m) => m.id === selectedTeammate) || teamMembers[0];

  // FAQ state & category filter
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [faqCategory, setFaqCategory] = useState<"all" | "privacy" | "personal_vs_team" | "financial" | "pricing">("all");

  const allFaqs = [
    {
      category: "privacy",
      q: "What is Manageo?",
      a: "Manageo is a unified Personal Operating System and Collaborative Team Workspaces platform. It provides individuals with a private cockpit for daily routines, money management, upcoming financial reminders, and encrypted vault records, alongside high-velocity team workspaces for collaborative projects, sprints, and role-governed task execution."
    },
    {
      category: "personal_vs_team",
      q: "What is the difference between Personal OS and a Team Workspace?",
      a: "Your Personal Operating System is strictly bound to your individual user account. It houses your personal daily routines, private financial accounts, financial reminders, custom personal databases, and encrypted vault records. Team Workspaces are shared collaborative spaces where invited members can co-manage projects, assign tasks, and share files. Personal records never enter team workspaces."
    },
    {
      category: "privacy",
      q: "Can team members see my personal finances or private Vault?",
      a: "No. Never. Personal financial schemas (transactions, bank accounts, balances, financial reminders) and Vault items are strictly excluded from workspace scoping. They are cryptographically and logically isolated by your individual userId. Even if you invite team members into a collaborative workspace, your personal finances and vault remain 100% invisible to them."
    },
    {
      category: "financial",
      q: "How does the Financial Reminder System protect against missed bills and duplicate charges?",
      a: "The Financial Reminder System continuously tracks recurring expenses, utilities, credit cards, loan EMIs, subscriptions, and investment dividends. You receive automated advance alerts (1, 3, or 7 days before). When you click 'Mark as Paid', Manageo generates a verified expense transaction into your selected account with anti-duplication safeguards, ensuring your account balances stay accurate with zero duplicate charges."
    },
    {
      category: "financial",
      q: "Can I track investments, bond maturities, and dividend yields?",
      a: "Yes. Manageo includes portfolio asset tracking alongside proactive dividend payout reminders and maturity tracking. You can track when returns are expected, monitor yield distribution, and receive automated notifications before upcoming investment events."
    },
    {
      category: "personal_vs_team",
      q: "How do workspace invitations work?",
      a: "Workspace owners or administrators generate secure, cryptographic invitation tokens sent via email or direct link. Teammates accept the invitation and authenticate with their individual account. No shared passwords or credential sharing are ever required."
    },
    {
      category: "personal_vs_team",
      q: "Can a member's permissions be restricted?",
      a: "Yes. Workspaces feature granular role-based access control (Owner, Admin, Member, Viewer) as well as per-module permissions. You can grant access to team tasks and project boards while restricting custom databases, file repositories, or billing settings."
    },
    {
      category: "privacy",
      q: "How is the Vault secured?",
      a: "The Vault utilizes authenticated AES-256-GCM encryption. In addition to a master vault password, you can configure isolated custom passwords for individual sensitive items. Emergency custom password recovery is supported via transactional email one-time passcodes (OTP)."
    },
    {
      category: "pricing",
      q: "Which features are included in each plan?",
      a: "The Starter plan ($0/mo) includes full Personal OS access, 2 custom sections, and up to 5 team workspace members. The Pro plan ($3.69/mo) increases capacity to 10 custom sections, 10 team members, advanced productivity analytics, and transaction-linked invoices with PDF export. Enterprise plans include up to 100 custom sections, custom member allocations, and dedicated SLA support."
    }
  ];

  const filteredFaqs = allFaqs.filter((f) => faqCategory === "all" || f.category === faqCategory);

  return (
    <div className="w-full text-slate-100 selection:bg-sky-500/20 selection:text-sky-300 font-sans">

      {/* =========================================================================
          HERO SECTION (High-Impact Dark SaaS Design with Stitch Navy & Cyan Accents)
          ========================================================================= */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 border-b border-white/[0.08] overflow-hidden bg-gradient-to-b from-[#0a0e1a] via-[#0f1524] to-[#0a0e1a]">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[380px] bg-sky-500/10 blur-[150px] pointer-events-none rounded-3xl" />
        <div className="absolute -top-24 right-10 w-[460px] h-[340px] bg-indigo-500/10 blur-[140px] pointer-events-none rounded-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            
            {/* Pill Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>THE PERSONAL OPERATING SYSTEM & COLLABORATIVE TEAM WORKSPACES</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-bold tracking-tight text-white leading-[1.08] mb-6">
              Your life, in order.<br />
              <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Your team, in sync.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8">
              The unified <strong className="text-slate-200 font-medium">Personal Operating System</strong> and collaborative <strong className="text-slate-200 font-medium">Team Workspaces</strong>. Master routines, private finances, proactive financial reminders, and priority tasks, then collaborate effortlessly with <strong className="text-slate-200 font-medium">Zero Data Contamination</strong>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-6">
              <Link
                href="/register?type=individual"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-sky-500/10 cursor-pointer"
              >
                <span>Start Personal OS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-sm transition-all cursor-pointer backdrop-blur-md"
              >
                Explore Team Workspaces
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Personal Operating System records and Team Workspaces are strictly partitioned with Zero Data Contamination.
              </span>
            </div>
          </div>

          {/* Sleek Production Dashboard Preview */}
          <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-[#0f1524]/95 backdrop-blur-xl shadow-2xl p-4 sm:p-6">
            
            {/* Top Workspace Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                  {heroMode === "personal" ? "P" : "T"}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    {heroMode === "personal" ? "Personal Operating System" : "Acme Studio Team Workspace"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {heroMode === "personal" ? "Private Cockpit • Single User (Encrypted)" : "Collaborative Workspace • 6 Active Members"}
                  </p>
                </div>
              </div>

              {/* Quick Tab Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/[0.04] border border-white/10">
                <button
                  type="button"
                  onClick={() => setHeroMode("personal")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    heroMode === "personal"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Personal OS
                </button>
                <button
                  type="button"
                  onClick={() => setHeroMode("team")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    heroMode === "team"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Team Workspace
                </button>
              </div>
            </div>

            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Daily Execution</span>
                  <Calendar className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-xl font-bold text-white font-mono">
                  {heroMode === "personal" ? `${heroCompletedCount} of ${heroTasks.length} Done` : "14 Active"}
                </p>
                <span className="text-[11px] text-sky-400 mt-1 block">
                  {heroMode === "personal" ? `${heroProgressPercent}% completed today` : "Sprint 24 on track"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Financial Privacy</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowLedgerBalances(!showLedgerBalances)}
                      className="text-slate-400 hover:text-white p-0.5 rounded-md"
                      title="Toggle balance visibility"
                    >
                      {showLedgerBalances ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <p className="text-xl font-bold text-white font-mono">
                  {heroMode === "personal"
                    ? (showLedgerBalances ? `$${checkingBalance.toFixed(2)}` : "••••••••")
                    : "Isolated"}
                </p>
                <span className="text-[11px] text-emerald-400 mt-1 block">
                  {heroMode === "personal" ? "Private Checking Ledger" : "100% Invisible to Team"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Smart Reminders</span>
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xl font-bold text-white font-mono">
                  {heroMode === "personal" ? "2 Due Soon" : "Shared Deadlines"}
                </p>
                <span className="text-[11px] text-amber-400 mt-1 block">
                  {heroMode === "personal" ? "AWS & Lease Upcoming" : "Assigned Milestones"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Sensitive Vault</span>
                  <Lock className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xl font-bold text-white font-mono">
                  AES-256-GCM
                </p>
                <span className="text-[11px] text-indigo-400 mt-1 block">
                  Encrypted & Protected
                </span>
              </div>
            </div>

            {/* Dynamic Content Section */}
            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  {heroMode === "personal" ? "Interactive Focus Blocks & Smart Reminders" : "Active Collaborative Sprint Tasks"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {heroMode === "personal" ? "Click items to test live interactions" : "Role: Workspace Owner"}
                </span>
              </div>

              {heroMode === "personal" ? (
                <div className="space-y-2.5">
                  {heroTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleHeroTask(task.id)}
                      className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                            task.done
                              ? "bg-sky-500/20 border border-sky-500/40 text-sky-400"
                              : "border border-white/20 bg-white/[0.02]"
                          }`}
                        >
                          {task.done && <Check className="w-3 h-3" />}
                        </div>
                        <span className={`font-medium ${task.done ? "line-through text-slate-500" : "text-slate-200"}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.08]">
                        {task.tag}
                      </span>
                    </div>
                  ))}

                  {/* Financial Reminder Live Ribbon in Hero */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Upcoming Due: AWS Infrastructure ($84.00)</p>
                        <p className="text-[11px] text-slate-400">Due tomorrow • Auto-checks low balance before payment</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("reminders")}
                      className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage Reminders</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-sm bg-emerald-400" />
                      <span className="text-slate-300 font-medium">Production E2E Multi-Tenant Migration Suite</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.08] text-slate-300">Marcus B.</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">Completed</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-sm bg-sky-400" />
                      <span className="text-white font-medium">API Gateway Rate Limiting & Webhook Dispatch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.08] text-slate-300">Sarah C.</span>
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/30">In Progress</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-sm bg-slate-500" />
                      <span className="text-slate-400 font-medium">Design System Editorial Refresh Tokens</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.08] text-slate-300">Elena R.</span>
                      <span className="text-[10px] bg-white/[0.04] text-slate-400 px-2 py-0.5 rounded-md border border-white/[0.08]">Review</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 2 — SOCIAL PROOF & SYSTEM METRICS BAR
          ========================================================================= */}
      <section className="py-10 border-b border-white/[0.08] bg-[#0a0e1a]/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-bold text-white font-mono">99.98%</p>
              <p className="text-xs text-slate-400 mt-1">Platform Availability</p>
            </div>
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-bold text-sky-400 font-mono">&lt; 50ms</p>
              <p className="text-xs text-slate-400 mt-1">P99 Index Latency</p>
            </div>
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">0 Bytes</p>
              <p className="text-xs text-slate-400 mt-1">Personal Data Leakage</p>
            </div>
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-bold text-indigo-400 font-mono">AES-256-GCM</p>
              <p className="text-xs text-slate-400 mt-1">Military Encryption</p>
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 3 — THE FOUR ARCHITECTURAL PILLARS
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0f1524]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-3">
              SYSTEM ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              One system for your private life. One controlled cockpit for teams.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Most productivity apps force you into choosing between private personal organization and collaborative enterprise chaos. Manageo bridges both worlds with architectural isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#141c2e] hover:border-sky-500/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Personal Tasks & Habits</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Daily focus time-blocking, recurring habits, morning/evening rituals, and streak tracking. Zero distraction, 100% personal clarity.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-sky-400 font-medium flex items-center gap-1">
                <span>Time-Blocking & Streaks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#141c2e] hover:border-emerald-500/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Money & Financial Reminders</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Income & expense ledgers, multi-currency accounts, and proactive reminders for upcoming bills, subscriptions, loan EMIs, and dividends.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span>Bills & Automated Payments</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#141c2e] hover:border-indigo-500/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Encrypted Vault & Documents</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Military-grade AES-256-GCM encrypted storage for recovery keys, passwords, contracts, and confidential credentials with OTP recovery.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-indigo-400 font-medium flex items-center gap-1">
                <span>Zero-Knowledge AES-256</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#141c2e] hover:border-amber-500/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Team Workspaces & RBAC</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Multi-tenant collaborative project boards, sprints, and role governance. Personal records and bank accounts remain 100% segregated.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-amber-400 font-medium flex items-center gap-1">
                <span>Zero Data Contamination</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 4 — INTERACTIVE MODULE EXPLORER (The Modular Cockpit)
          ========================================================================= */}
      <section id="features" className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0a0e1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-3">
              LIVE INTERACTIVE SANDBOX
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Explore the Manageo Engine
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Test drive the live modules below. Every system is engineered with instant reactivity and strict data partitioning.
            </p>
          </div>

          {/* Module Selector Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("reminders")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "reminders"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-sky-400" />
              Financial Reminders
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
              Tasks & Routines
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("investments")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "investments"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              Investments & Portfolio
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("vault")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "vault"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              Encrypted Vault
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("custom_db")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "custom_db"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              Custom Databases
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("teams")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "teams"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              Team Permissions (RBAC)
            </button>
          </div>

          {/* Tab Content Display Container */}
          <div className="rounded-2xl border border-white/10 bg-[#0f1524] p-5 sm:p-8 shadow-2xl">

            {/* TAB 1: FINANCIAL REMINDERS */}
            {activeTab === "reminders" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-amber-400" />
                      Smart Financial Reminders & Ledger Auto-Sync
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Proactively alerts you before due dates. Click &ldquo;Record Payment&rdquo; to test live ledger deduction with anti-duplication protection.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-right">
                      <p className="text-[10px] text-emerald-400 font-medium">Checking Account</p>
                      <p className="text-sm font-bold text-white font-mono">${checkingBalance.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {lastPaymentNotice && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{lastPaymentNotice}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className={`p-4 rounded-xl border transition-all ${
                        rem.isPaid
                          ? "bg-emerald-500/5 border-emerald-500/20 opacity-80"
                          : "bg-white/[0.02] border-white/[0.06] hover:border-white/10"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                              rem.isPaid
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : rem.category === "dividend"
                                ? "bg-sky-500/15 text-sky-400 border border-sky-500/20"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {rem.category === "dividend" ? <TrendingUp className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{rem.title}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300">
                                {rem.categoryLabel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Due: <strong className="text-slate-300">{rem.dueDate}</strong> • Account: {rem.account} • {rem.frequency}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-base font-bold font-mono ${rem.category === "dividend" ? "text-emerald-400" : "text-white"}`}>
                            {rem.category === "dividend" ? `+$${rem.amount.toFixed(2)}` : `$${rem.amount.toFixed(2)}`}
                          </span>

                          {rem.isPaid ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-medium">
                              <Check className="w-3.5 h-3.5" />
                              Paid & Synced
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => snoozeReminder(rem.id)}
                                className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors cursor-pointer"
                              >
                                Snooze
                              </button>
                              <button
                                type="button"
                                onClick={() => markReminderPaid(rem.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <span>Record Payment</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/15 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Low-Balance Alert: Guardrail triggers alert if balance drops below $500.00.</span>
                  </div>
                  <span className="text-sky-400 font-mono text-[11px]">Threshold Safe</span>
                </div>
              </div>
            )}

            {/* TAB 2: TASKS & ROUTINES */}
            {activeTab === "tasks" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-sky-400" />
                      Daily Execution: Routines, Habits & Priority Blocks
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Master morning routines and deep work blocks with streak metrics and zero distraction.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Current Streak:</span>
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold font-mono">
                      🔥 18 Days
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider block mb-3">
                      Morning Routine Ritual
                    </span>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-300">07:00 AM • Hydration & 15m Mindfulness</span>
                        </div>
                        <span className="text-[10px] text-emerald-400">Completed</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-300">07:30 AM • Core Workout & Mobility</span>
                        </div>
                        <span className="text-[10px] text-emerald-400">Completed</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-md border border-white/20" />
                          <span className="text-white">08:15 AM • Strategic Priority Calibration</span>
                        </div>
                        <span className="text-[10px] text-amber-400">Pending</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider block mb-3">
                      Today Deep Work Schedule
                    </span>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                        <div>
                          <p className="text-white font-medium">09:00 AM - 12:00 PM</p>
                          <p className="text-slate-400 text-[11px]">Next.js 16 App Architecture Design</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Focus 3h
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                        <div>
                          <p className="text-white font-medium">02:00 PM - 03:30 PM</p>
                          <p className="text-slate-400 text-[11px]">Financial Ledger & Invoice Reconciliation</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Finance
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INVESTMENTS & ASSET PORTFOLIO */}
            {activeTab === "investments" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Investment Portfolio & Asset Allocation
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Holistic wealth tracking across equities, fixed income, real estate, and crypto with yield forecasting.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-right">
                    <p className="text-[10px] text-emerald-400 font-medium">Total Portfolio Value</p>
                    <p className="text-sm font-bold text-white font-mono">$128,490.00</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-xs text-slate-400">Total Equities & ETFs</span>
                    <p className="text-lg font-bold text-white font-mono mt-1">$68,200.00</p>
                    <span className="text-[11px] text-emerald-400 mt-1 block">+12.4% Past 12 Months</span>
                  </div>
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-xs text-slate-400">Fixed Income & Treasuries</span>
                    <p className="text-lg font-bold text-white font-mono mt-1">$35,000.00</p>
                    <span className="text-[11px] text-sky-400 mt-1 block">5.15% Locked Yield APY</span>
                  </div>
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-xs text-slate-400">Projected Annual Dividend</span>
                    <p className="text-lg font-bold text-white font-mono mt-1">$4,180.00</p>
                    <span className="text-[11px] text-amber-400 mt-1 block">Paid across 12 scheduled dates</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider block mb-3">
                    Upcoming Yield & Dividend Events
                  </span>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-white font-medium">Vanguard High Dividend Yield ETF (VYM)</span>
                        <p className="text-[11px] text-slate-400">Expected payout: $142.80 • Ex-Date: Oct 22</p>
                      </div>
                      <span className="text-emerald-400 font-mono font-semibold">+$142.80</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-white font-medium">US Treasury 6-Month T-Bill Maturity</span>
                        <p className="text-[11px] text-slate-400">Principal return: $10,000.00 • Maturity: Nov 15</p>
                      </div>
                      <span className="text-sky-400 font-mono font-semibold">+$10,257.50</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ENCRYPTED VAULT */}
            {activeTab === "vault" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Lock className="w-5 h-5 text-indigo-400" />
                      Zero-Knowledge AES-256-GCM Sensitive Vault
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Client-side encryption for access tokens, recovery phrases, and confidential contracts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVaultLocked(!isVaultLocked)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-500/30 transition-colors cursor-pointer"
                  >
                    {isVaultLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isVaultLocked ? "Unlock Vault" : "Lock Vault Now"}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {vaultItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <Key className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{item.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Encrypted payload • Last rotated {item.updated}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-300 bg-black/40 px-3 py-1.5 rounded-md border border-white/10">
                          {isVaultLocked
                            ? "••••••••••••••••••••••••"
                            : revealedSecretId === item.id
                            ? item.secret
                            : "••••••••••••••••••••••••"}
                        </span>
                        {!isVaultLocked && (
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedSecretId(revealedSecretId === item.id ? null : item.id)
                            }
                            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-white/[0.04] border border-white/10 transition-colors cursor-pointer"
                            title="Toggle reveal"
                          >
                            {revealedSecretId === item.id ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs text-slate-300 flex items-center justify-between">
                  <span>Custom Item Passwords & Emergency Email OTP Reset Supported</span>
                  <span className="text-indigo-400 font-mono text-[11px]">Hardware Enclave Ready</span>
                </div>
              </div>
            )}

            {/* TAB 5: CUSTOM DATABASES */}
            {activeTab === "custom_db" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-sky-400" />
                      Custom Databases & Flexible Schemas
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Define bespoke tables, relations, and views. Switch views seamlessly below.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/[0.04] border border-white/10">
                    <button
                      type="button"
                      onClick={() => setActiveDatabaseView("table")}
                      className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                        activeDatabaseView === "table"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Table View
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDatabaseView("kanban")}
                      className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                        activeDatabaseView === "kanban"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Kanban
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDatabaseView("list")}
                      className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                        activeDatabaseView === "list"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>

                {activeDatabaseView === "table" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-slate-400">
                          <th className="pb-3 font-semibold">Record Title</th>
                          <th className="pb-3 font-semibold">Category</th>
                          <th className="pb-3 font-semibold">Priority</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold">Target Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {databaseRecords.map((rec) => (
                          <tr key={rec.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 font-medium text-white">{rec.name}</td>
                            <td className="py-3 text-slate-300">{rec.category}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] ${
                                  rec.priority === "Critical"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                }`}
                              >
                                {rec.priority}
                              </span>
                            </td>
                            <td className="py-3 text-slate-300">{rec.status}</td>
                            <td className="py-3 font-mono text-slate-400">{rec.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeDatabaseView === "kanban" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">In Progress (1)</span>
                      <div className="p-3 rounded-lg bg-[#141c2e] border border-white/10 text-xs">
                        <p className="font-semibold text-white">Q4 Platform Modernization</p>
                        <span className="text-[10px] text-sky-400 block mt-1">Engineering • Oct 24</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Review (1)</span>
                      <div className="p-3 rounded-lg bg-[#141c2e] border border-white/10 text-xs">
                        <p className="font-semibold text-white">Mobile PWA Offline Sync Engine</p>
                        <span className="text-[10px] text-rose-400 block mt-1">Critical • Nov 02</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Completed (2)</span>
                      <div className="p-3 rounded-lg bg-[#141c2e] border border-white/10 text-xs space-y-2">
                        <p className="font-semibold text-white">Role-Based Invitation Verification</p>
                        <p className="font-semibold text-white pt-2 border-t border-white/[0.06]">Stripe Webhook Pipelines</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDatabaseView === "list" && (
                  <div className="space-y-2">
                    {databaseRecords.map((rec) => (
                      <div key={rec.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                        <span className="font-medium text-white">{rec.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{rec.category}</span>
                          <span className="font-mono text-slate-500">{rec.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: TEAMS & RBAC */}
            {activeTab === "teams" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-sky-400" />
                      Team Workspaces & Granular RBAC Simulator
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select a team member below to simulate live permission toggles with Zero Data Contamination.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {teamMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedTeammate(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          selectedTeammate === m.id
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                            : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/10"
                        }`}
                      >
                        {m.name} ({m.role})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{activeMember.name}</p>
                      <p className="text-xs text-slate-400">{activeMember.email} • Assigned Role: {activeMember.role}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                      {activeMember.role} Access Profile
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["tasks", "projects", "databases", "files"] as const).map((modKey) => (
                      <div
                        key={modKey}
                        onClick={() => toggleTeammateModule(activeMember.id, modKey)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                          activeMember.modules[modKey]
                            ? "bg-sky-500/10 border-sky-500/30 text-white"
                            : "bg-white/[0.01] border-white/[0.06] text-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="capitalize font-semibold">{modKey}</span>
                          <div
                            className={`w-3.5 h-3.5 rounded-md flex items-center justify-center ${
                              activeMember.modules[modKey] ? "bg-sky-400 text-slate-950" : "bg-white/10"
                            }`}
                          >
                            {activeMember.modules[modKey] && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                        <span className="text-[10px] block">
                          {activeMember.modules[modKey] ? "Permission Granted" : "Access Blocked"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Zero Contamination Invariant: Even Workspace Admins CANNOT view personal bank balances, financial reminders, or private Vault records of other team members.
                  </span>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 5 — DEEP DIVE: ZERO DATA CONTAMINATION ARCHITECTURE
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0f1524]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-3">
              SECURITY INVARIANT
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Zero Data Contamination Guarantee
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              How Manageo mathematically guarantees that your personal finances, encrypted vault, and private routines never leak into collaborative team workspaces.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            
            {/* Left: Personal OS Scope */}
            <div className="p-6 rounded-2xl border border-sky-500/30 bg-[#141c2e] shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Scope: User Tenant</span>
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Personal Operating System</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Strictly bound to individual session authentication. Unconditionally excluded from workspace indexing.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Personal Tasks & Routine Streaks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Bank Accounts, Ledgers & Reminders</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>AES-256-GCM Encrypted Vault Items</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Private Custom Databases & Notes</span>
                </li>
              </ul>
            </div>

            {/* Center: Verification Gateway */}
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0a0e1a] text-center">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Mandatory Authorization Gatekeeper
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Every mutation and query runs through the server-side verification gatekeeper with cryptographic token verification.
              </p>
              <div className="inline-block px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[11px] text-sky-300">
                verifyWorkspaceAccess(userId, workspaceId)
              </div>
            </div>

            {/* Right: Team Workspace Scope */}
            <div className="p-6 rounded-2xl border border-indigo-500/30 bg-[#141c2e] shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Scope: Workspace Tenant</span>
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Team Workspaces</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Shared collaborative space governed by role permissions. Team members co-manage sprints with zero personal visibility.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sprint Planning & Kanban Boards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Role-Based Governance (Owner, Admin, Member, Viewer)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cryptographic Workspace Invitation Hashes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Shared Team Databases & Document Repositories</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 6 — MOBILE PWA & EDGE-TO-EDGE EXPERIENCE
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0a0e1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-4">
                MODERN PWA ARCHITECTURE
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Engineered for Mobile. Edge-to-Edge Notch Optimized.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
                Install Manageo directly on iOS, Android, macOS, and Windows. Built with edge-to-edge safe-area styling, dynamic island support, and offline-first persistence.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">iPhone Notch & Dynamic Island Safe-Areas</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Headers, floating action bars, and bottom sheets are mathematically positioned using standard safe-area insets without clipping.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Offline-First Service Worker Cache</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review routines, check off focus tasks, and inspect balances even when offline. Changes sync seamlessly upon reconnection.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Real-Time Background Push Notifications</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Receive proactive notifications for upcoming bills, dividend credits, and team project mentions right on your lock screen.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Phone Mockup with Safe-Area */}
            <div className="relative mx-auto max-w-sm w-full">
              <div className="rounded-3xl border border-white/20 bg-[#0f1524] p-4 shadow-2xl relative overflow-hidden">
                {/* Simulated iPhone Dynamic Island / Notch */}
                <div className="w-28 h-4 rounded-md bg-black mx-auto mb-4 border border-white/10" />

                {/* Mobile Screen Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">
                      M
                    </div>
                    <span className="text-xs font-bold text-white">Manageo PWA</span>
                  </div>
                  <span className="text-[10px] text-sky-400 font-mono">Installed PWA</span>
                </div>

                {/* Mobile Content Card */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Upcoming Bill Alert</span>
                      <span className="text-amber-400 font-bold">Tomorrow</span>
                    </div>
                    <p className="text-sm font-bold text-white">AWS Cloud Hosting ($84.00)</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Account: ••4920</span>
                      <span className="text-[10px] bg-sky-400 text-slate-950 font-bold px-2 py-0.5 rounded-md">
                        1-Tap Pay
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Today Focus</span>
                      <span className="text-emerald-400 font-bold">3 of 4 Done</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-md overflow-hidden mt-1">
                      <div className="bg-sky-400 h-full w-3/4 rounded-md" />
                    </div>
                  </div>
                </div>

                {/* Floating Safe-Area Bottom Bar */}
                <div className="mt-8 pt-3 border-t border-white/[0.08] flex items-center justify-around text-slate-400 text-xs">
                  <span className="text-sky-400 font-semibold">Today</span>
                  <span>Money</span>
                  <span>Vault</span>
                  <span>Teams</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 7 — COMPETITIVE COMPARISON MATRIX
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0f1524]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-3">
              STACK CONSOLIDATION
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Replace 5 Disjointed Subscriptions with One Engine
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Consolidate tasks, financial ledgers, bill reminders, encrypted vaults, and team boards into one unified cockpit.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse rounded-2xl overflow-hidden border border-white/10 bg-[#141c2e]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#0a0e1a]/80 text-slate-300">
                  <th className="p-4 sm:p-5 font-semibold">Capability</th>
                  <th className="p-4 sm:p-5 font-bold text-sky-400 bg-sky-500/10 border-x border-sky-500/20">Manageo OS</th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-400">Notion</th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-400">YNAB + Todoist</th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-400">1Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                <tr className="hover:bg-white/[0.01]">
                  <td className="p-4 sm:p-5 font-medium text-white">Personal Tasks & Habit Streaks</td>
                  <td className="p-4 sm:p-5 text-sky-300 bg-sky-500/5 border-x border-sky-500/20 font-semibold">Native Built-In</td>
                  <td className="p-4 sm:p-5 text-slate-400">Manual Templates</td>
                  <td className="p-4 sm:p-5 text-slate-300">Todoist ($5/mo)</td>
                  <td className="p-4 sm:p-5 text-slate-500">—</td>
                </tr>
                <tr className="hover:bg-white/[0.01]">
                  <td className="p-4 sm:p-5 font-medium text-white">Multi-Account Money & Invoicing</td>
                  <td className="p-4 sm:p-5 text-sky-300 bg-sky-500/5 border-x border-sky-500/20 font-semibold">Native Built-In + PDF</td>
                  <td className="p-4 sm:p-5 text-slate-500">—</td>
                  <td className="p-4 sm:p-5 text-slate-300">YNAB ($14.99/mo)</td>
                  <td className="p-4 sm:p-5 text-slate-500">—</td>
                </tr>
                <tr className="hover:bg-white/[0.01]">
                  <td className="p-4 sm:p-5 font-medium text-white">Proactive Financial Reminders</td>
                  <td className="p-4 sm:p-5 text-sky-300 bg-sky-500/5 border-x border-sky-500/20 font-semibold">Bills, EMIs, Dividends</td>
                  <td className="p-4 sm:p-5 text-slate-500">—</td>
                  <td className="p-4 sm:p-5 text-slate-400">Partial</td>
                  <td className="p-4 sm:p-5 text-slate-500">—</td>
                </tr>
                <tr className="hover:bg-white/[0.01]">
                  <td className="p-4 sm:p-5 font-medium text-white">AES-256-GCM Sensitive Vault</td>
                  <td className="p-4 sm:p-5 text-sky-300 bg-sky-500/5 border-x border-sky-500/20 font-semibold">Native Zero-Knowledge</td>
                  <td className="p-4 sm:p-5 text-rose-400/80">No Client Encryption</td>
                  <td className="p-4 sm:p-5 text-slate-500">—</td>
                  <td className="p-4 sm:p-5 text-slate-300">1Password ($3/mo)</td>
                </tr>
                <tr className="hover:bg-white/[0.01]">
                  <td className="p-4 sm:p-5 font-medium text-white">Team Workspaces & RBAC</td>
                  <td className="p-4 sm:p-5 text-sky-300 bg-sky-500/5 border-x border-sky-500/20 font-semibold">Zero Contamination</td>
                  <td className="p-4 sm:p-5 text-slate-300">Workspace Sharing</td>
                  <td className="p-4 sm:p-5 text-slate-500">—</td>
                  <td className="p-4 sm:p-5 text-slate-500">—</td>
                </tr>
                <tr className="bg-[#0a0e1a]/80 font-bold">
                  <td className="p-4 sm:p-5 text-white">Total Estimated Cost</td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-sky-500/10 border-x border-sky-500/20 text-base font-mono">
                    $0 - $3.69/mo
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400 font-mono">$10.00/mo</td>
                  <td className="p-4 sm:p-5 text-slate-400 font-mono">$19.99/mo</td>
                  <td className="p-4 sm:p-5 text-slate-400 font-mono">$3.00/mo</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 8 — HOW IT WORKS (4 STEPS)
          ========================================================================= */}
      <section id="how-it-works" className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0a0e1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-3">
              STREAMLINED ONBOARDING
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Up and running in four minutes
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Experience the clarity of a unified operating system from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0f1524] relative">
              <span className="text-3xl font-extrabold text-sky-400/30 font-mono absolute top-4 right-5">01</span>
              <h3 className="text-base font-bold text-white mb-2">Claim Your Cockpit</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up in 30 seconds. Choose modular presets or customize your dashboard blocks.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0f1524] relative">
              <span className="text-3xl font-extrabold text-sky-400/30 font-mono absolute top-4 right-5">02</span>
              <h3 className="text-base font-bold text-white mb-2">Establish Focus & Money</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set daily routines, record initial bank account balances, and configure recurring bills.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0f1524] relative">
              <span className="text-3xl font-extrabold text-sky-400/30 font-mono absolute top-4 right-5">03</span>
              <h3 className="text-base font-bold text-white mb-2">Encrypt Master Vault</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set your AES-256 vault passphrase. Store access credentials and private recovery seeds safely.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0f1524] relative">
              <span className="text-3xl font-extrabold text-sky-400/30 font-mono absolute top-4 right-5">04</span>
              <h3 className="text-base font-bold text-white mb-2">Invite Collaborators</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Spawn collaborative team workspaces with cryptographic token invites. Zero data leakage guaranteed.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 9 — TRANSPARENT PRICING
          ========================================================================= */}
      <section id="pricing" className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0f1524]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-3">
              HONEST PRICING
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Predictable, fair pricing for individuals and teams
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Start free forever with full Personal OS access. Upgrade when you need team capacity and advanced workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* Starter Plan */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#141c2e] flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Starter</span>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-white font-mono">$0</span>
                  <span className="text-sm text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Complete personal OS for individuals organizing daily life, habits, and tasks.
                </p>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Full Personal OS (Tasks, Routines, Notes, Ideas)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Personal Money & AES-256 Encrypted Vault</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Up to 2 Custom Sections</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Up to 5 Workspace Collaborators (Early Access)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>100 MB Cloud Storage</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register?type=individual"
                className="w-full inline-flex items-center justify-center py-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Start Free Forever
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-2xl border-2 border-sky-500/40 bg-[#141c2e] relative shadow-2xl flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-sky-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-2">Professional</span>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-white font-mono">$3.69</span>
                  <span className="text-sm text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Designed for team owners and power users who need advanced collaboration and custom workflows.
                </p>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Everything in Starter</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Up to 10 Custom Database Sections</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Up to 10 Team Members with Role Management</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Team Dashboards & Shared Workspaces</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>5 GB Cloud Document & Asset Storage</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Priority Email Support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/pricing"
                className="w-full inline-flex items-center justify-center py-3 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-sky-500/10 cursor-pointer"
              >
                Upgrade to Pro ($3.69/mo)
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#141c2e] flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Enterprise</span>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-white font-mono">Custom</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  High-scale workspace governance, unlimited teams, custom limits, and enterprise SLA.
                </p>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Everything in Professional</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Up to 100 Custom Sections</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Unlimited Workspace Members</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Advanced Access Logs & Audit Trails</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>50 GB Storage with Custom Retention</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Dedicated Account Management</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/contact"
                className="w-full inline-flex items-center justify-center py-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Contact Enterprise Sales
              </Link>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 10 — FREQUENTLY ASKED QUESTIONS (FAQ)
          ========================================================================= */}
      <section id="faq" className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0a0e1a]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-3">
              ANSWERS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Clear answers regarding privacy, data segregation, financial reminders, and workspace roles.
            </p>
          </div>

          {/* FAQ Category Pills */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            {(["all", "privacy", "personal_vs_team", "financial", "pricing"] as const).map((catKey) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setFaqCategory(catKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  faqCategory === catKey
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/10"
                }`}
              >
                {catKey === "all" ? "All Questions" : catKey === "privacy" ? "Privacy & Security" : catKey === "personal_vs_team" ? "Personal vs Team" : catKey === "financial" ? "Financial Reminders" : "Pricing & Plans"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/[0.08] bg-[#0f1524] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-semibold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaqIndex === idx ? "rotate-180 text-sky-400" : ""
                    }`}
                  />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/[0.04]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 11 — FINAL CALL TO ACTION (CTA)
          ========================================================================= */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-[#0a0e1a] via-[#0f1524] to-[#0a0e1a] text-center relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/10 blur-[130px] pointer-events-none rounded-3xl" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6">
            Take full sovereignty of your life and team today.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            No credit card required. Experience complete clarity across routines, finances, reminders, and collaborative workspaces.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?type=individual"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-sky-500/10 cursor-pointer"
            >
              <span>Launch Your Personal OS (Free)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-sm transition-all cursor-pointer backdrop-blur-md"
            >
              <span>Explore Team Workspaces</span>
            </Link>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            Free forever for personal users • Pro features available for teams • Strict Zero Contamination guarantee
          </p>
        </div>
      </section>

    </div>
  );
}
