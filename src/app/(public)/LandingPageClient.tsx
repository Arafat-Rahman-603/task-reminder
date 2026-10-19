"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
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
  Bell,
  Receipt,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  Key,
  Shield,
  Terminal,
  Zap,
  BarChart3,
  Copy,
  RotateCcw,
  Search,
  Flame,
  Plus,
} from "lucide-react";

/* ─── Motion Variants ─── */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, delay: d, ease: EASE_OUT_EXPO },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── SectionHeader ─── */
function SectionHeader({
  label,
  title,
  subtitle,
  align = "center",
}: {
  label?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={`mb-14 ${align === "center" ? "text-center max-w-2xl mx-auto" : "max-w-xl"
        }`}
    >
      {label && (
        <motion.span
          variants={fadeUp}
          className="inline-block mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-400"
        >
          {label}
        </motion.span>
      )}
      <motion.h2
        variants={fadeUp}
        className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-white tracking-tight leading-[1.12] mb-4"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          variants={fadeUp}
          className="text-slate-400 text-sm sm:text-base leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

/* ─── FeatureCard ─── */
function FeatureCard({
  icon: Icon,
  color,
  title,
  description,
  cta,
  onClick,
  delay = 0,
}: {
  icon: React.ElementType;
  color: "sky" | "emerald" | "indigo" | "amber";
  title: string;
  description: string;
  cta: string;
  onClick?: () => void;
  delay?: number;
}) {
  const cm = {
    sky: {
      bg: "bg-sky-500/10",
      br: "border-sky-500/20",
      tx: "text-sky-400",
      hv: "group-hover:text-sky-300",
      glow: "group-hover:border-sky-500/35 group-hover:shadow-sky-500/5",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      br: "border-emerald-500/20",
      tx: "text-emerald-400",
      hv: "group-hover:text-emerald-300",
      glow: "group-hover:border-emerald-500/35 group-hover:shadow-emerald-500/5",
    },
    indigo: {
      bg: "bg-indigo-500/10",
      br: "border-indigo-500/20",
      tx: "text-indigo-400",
      hv: "group-hover:text-indigo-300",
      glow: "group-hover:border-indigo-500/35 group-hover:shadow-indigo-500/5",
    },
    amber: {
      bg: "bg-amber-500/10",
      br: "border-amber-500/20",
      tx: "text-amber-400",
      hv: "group-hover:text-amber-300",
      glow: "group-hover:border-amber-500/35 group-hover:shadow-amber-500/5",
    },
  }[color];

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`group relative p-6 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#162035] to-[#111828] transition-all duration-300 flex flex-col justify-between shadow-xl ${cm.glow} ${onClick ? "cursor-pointer" : ""
        }`}
    >
      <div>
        <div
          className={`w-11 h-11 rounded-xl ${cm.bg} border ${cm.br} ${cm.tx} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-white mb-2 leading-snug">
          {title}
        </h3>
        <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      <div
        className={`mt-6 pt-4 border-t border-white/[0.06] text-xs ${cm.tx} font-semibold flex items-center justify-between ${cm.hv} transition-colors`}
      >
        <span>{cta}</span>
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" />
      </div>
    </motion.div>
  );
}

/* ─── StatPill ─── */
function StatPill({
  value,
  label,
  color,
  delay,
}: {
  value: string;
  label: string;
  color?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: delay ?? 0, ease: EASE_OUT_EXPO }}
      className="flex flex-col items-center justify-center gap-1.5 py-6 px-4 sm:py-8 sm:px-6 hover:bg-white/[0.015] transition-colors"
    >
      <span
        className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${color ?? "text-white"
          }`}
      >
        {value}
      </span>
      <span className="text-xs text-slate-400 font-medium text-center leading-snug">
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Types & Initial Data ─── */
interface IReminder {
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

const INITIAL_REMINDERS: IReminder[] = [
  {
    id: "r1",
    title: "AWS Cloud Infrastructure Cluster",
    category: "bill",
    categoryLabel: "Utility / Hosting",
    amount: 84.0,
    dueDate: "Tomorrow (Oct 19)",
    account: "Business Checking (••4920)",
    frequency: "Monthly",
    isPaid: false,
    priority: "high",
  },
  {
    id: "r2",
    title: "Figma Team Enterprise Workspace",
    category: "subscription",
    categoryLabel: "SaaS Subscription",
    amount: 45.0,
    dueDate: "In 3 Days (Oct 21)",
    account: "Business Checking (••4920)",
    frequency: "Monthly",
    isPaid: false,
    priority: "medium",
  },
  {
    id: "r3",
    title: "Vanguard Total Market Dividend",
    category: "dividend",
    categoryLabel: "Dividend Yield",
    amount: 142.8,
    dueDate: "Oct 25, 2026",
    account: "Brokerage Account",
    frequency: "Quarterly",
    isPaid: false,
    priority: "low",
  },
  {
    id: "r4",
    title: "Commercial Office Rent & Lease",
    category: "loan",
    categoryLabel: "Fixed Lease",
    amount: 1450.0,
    dueDate: "Nov 01, 2026",
    account: "Business Checking (••4920)",
    frequency: "Monthly",
    isPaid: false,
    priority: "high",
  },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function LandingPageClient() {
  /* 1. Hero State */
  const [heroMode, setHeroMode] = useState<"personal" | "team">("personal");
  const [heroTasks, setHeroTasks] = useState([
    {
      id: 1,
      title: "08:30 AM · Morning Review & Habit Calibration",
      done: true,
      tag: "Routine",
    },
    {
      id: 2,
      title: "10:00 AM · Finalize Next.js 16 API Architecture",
      done: true,
      tag: "Deep Work",
    },
    {
      id: 3,
      title: "02:00 PM · Reconcile Financial Ledger & Invoices",
      done: false,
      tag: "Finance",
    },
    {
      id: 4,
      title: "04:30 PM · AES-256 Vault Credential Rotation",
      done: false,
      tag: "Security",
    },
  ]);
  const [newTaskText, setNewTaskText] = useState("");

  const toggleTask = (id: number) =>
    setHeroTasks((p) =>
      p.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const addHeroTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setHeroTasks((p) => [
      ...p,
      {
        id: Date.now(),
        title: `Now · ${newTaskText.trim()}`,
        done: false,
        tag: "Quick Focus",
      },
    ]);
    setNewTaskText("");
  };

  const doneCount = heroTasks.filter((t) => t.done).length;
  const donePct = Math.round((doneCount / heroTasks.length) * 100);

  /* 2. Finance & Reminders State */
  const [showBal, setShowBal] = useState(true);
  const [cur, setCur] = useState<"$" | "€" | "£" | "৳">("$");
  const [bal, setBal] = useState(6420.5);
  const [notice, setNotice] = useState<string | null>(null);
  const [reminders, setReminders] = useState<IReminder[]>(INITIAL_REMINDERS);

  const cycleCurrency = () => {
    const symbols: Array<"$" | "€" | "£" | "৳"> = ["$", "€", "£", "৳"];
    setCur(symbols[(symbols.indexOf(cur) + 1) % symbols.length]);
  };

  const payReminder = (id: string) => {
    const target = reminders.find((r) => r.id === id);
    if (!target || target.isPaid) return;

    const isDividend = target.category === "dividend";
    setBal((b) =>
      isDividend ? b + target.amount : Math.max(0, b - target.amount)
    );
    setReminders((p) =>
      p.map((r) => (r.id === id ? { ...r, isPaid: true } : r))
    );
    setNotice(
      isDividend
        ? `Credited +${cur}${target.amount.toFixed(2)} dividend from "${target.title
        }" to ledger.`
        : `Recorded -${cur}${target.amount.toFixed(2)} payment for "${target.title
        }". Auto-synced.`
    );
    setTimeout(() => setNotice(null), 4500);
  };

  const snooze = (id: string) =>
    setReminders((p) =>
      p.map((r) => (r.id === id ? { ...r, dueDate: "Snoozed +3 Days" } : r))
    );

  const resetFinanceDemo = () => {
    setBal(6420.5);
    setReminders(INITIAL_REMINDERS);
    setNotice("Financial ledger and reminders reset to initial demo state.");
    setTimeout(() => setNotice(null), 3000);
  };

  /* 3. Module 02: Routines & Deep Work State */
  const [rituals, setRituals] = useState([
    { id: 1, label: "07:00 AM · Hydration & 15m Mindfulness", done: true },
    { id: 2, label: "07:30 AM · Core Workout & Mobility", done: true },
    { id: 3, label: "08:15 AM · Strategic Priority Calibration", done: false },
  ]);
  const [deepBlocks, setDeepBlocks] = useState([
    {
      id: 1,
      time: "09:00 AM – 12:00 PM",
      task: "Next.js 16 App Architecture Design",
      tag: "Focus 3h",
      tc: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      active: true,
    },
    {
      id: 2,
      time: "02:00 PM – 03:30 PM",
      task: "Financial Ledger & Invoice Reconciliation",
      tag: "Finance",
      tc: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      active: false,
    },
  ]);
  const ritualDoneCount = rituals.filter((r) => r.done).length;

  /* 4. Module 03: Investments State */
  const [dripEnabled, setDripEnabled] = useState(true);

  /* 5. Module 04: Vault State */
  const [vaultLocked, setVaultLocked] = useState(false);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const vaultItems = [
    {
      id: 1,
      name: "AWS Production Infrastructure Keys",
      type: "Access Token",
      secret: "AKIA_9492_PROD_DEPLOY_KEY",
      updated: "3d ago",
    },
    {
      id: 2,
      name: "Primary Cold Storage Recovery Phrase",
      type: "Seed Words",
      secret: "harvest matrix orbital cascade copper",
      updated: "2w ago",
    },
    {
      id: 3,
      name: "Stripe Production Webhook Signing Key",
      type: "API Secret",
      secret: "whsec_984fbc901e8284ca902e",
      updated: "1m ago",
    },
  ];

  const copySecret = (id: number, secret: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(secret).catch(() => { });
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* 6. Module 05: Custom Databases State */
  const [dbView, setDbView] = useState<"table" | "kanban" | "list">("table");
  const [dbSearch, setDbSearch] = useState("");
  const dbRows = [
    {
      id: 1,
      name: "Q4 Platform Modernization",
      category: "Engineering",
      priority: "High",
      status: "In Progress",
      date: "Oct 24, 2026",
    },
    {
      id: 2,
      name: "Mobile PWA Offline Sync Engine",
      category: "Core",
      priority: "Critical",
      status: "Review",
      date: "Nov 02, 2026",
    },
    {
      id: 3,
      name: "Stripe Billing & Invoicing Webhooks",
      category: "Finance",
      priority: "Medium",
      status: "Ready",
      date: "Nov 15, 2026",
    },
    {
      id: 4,
      name: "Role-Based Invitation Verification",
      category: "Security",
      priority: "High",
      status: "Completed",
      date: "Oct 12, 2026",
    },
  ];
  const filteredDbRows = dbRows.filter(
    (r) =>
      r.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
      r.category.toLowerCase().includes(dbSearch.toLowerCase())
  );

  /* 7. Module 06: Team State */
  const [activeTeamId, setActiveTeamId] = useState(1);
  const [team, setTeam] = useState([
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah.chen@axiomixs.com",
      role: "Admin",
      modules: { tasks: true, projects: true, databases: true, files: true },
    },
    {
      id: 2,
      name: "Marcus Brody",
      email: "marcus.b@axiomixs.com",
      role: "Member",
      modules: { tasks: true, projects: true, databases: false, files: true },
    },
    {
      id: 3,
      name: "Elena Rostova",
      email: "elena.r@axiomixs.com",
      role: "Viewer",
      modules: { tasks: true, projects: false, databases: false, files: false },
    },
  ]);
  const toggleMod = (
    mid: number,
    mk: "tasks" | "projects" | "databases" | "files"
  ) =>
    setTeam((p) =>
      p.map((m) =>
        m.id === mid
          ? { ...m, modules: { ...m.modules, [mk]: !m.modules[mk] } }
          : m
      )
    );
  const activeMember = team.find((m) => m.id === activeTeamId) ?? team[0];

  /* 8. Security Gatekeeper State */
  const [secRunning, setSecRunning] = useState(false);
  const [secLogs, setSecLogs] = useState([
    "System security guard: Active",
    "Zero Data Contamination Invariant: Armed",
    "Manageo scopes: Strict userId boundary enforced",
  ]);
  const runSec = () => {
    if (secRunning) return;
    setSecRunning(true);
    setSecLogs((p) => [
      ...p.slice(-3),
      "→ [TEST INITIATED] External workspace querying private personal ledger...",
    ]);
    setTimeout(() => {
      setSecLogs((p) => [
        ...p,
        "→ [GATEWAY] verifyWorkspaceAccess(userId, workspaceId) evaluated",
        "✓ [BLOCKED: 403 FORBIDDEN] Personal schema boundary strictly preserved.",
        "✓ Zero personal records leaked to collaborative tenant.",
      ]);
      setSecRunning(false);
    }, 800);
  };

  /* 9. Engine Card Slider Navigation */
  const [activeCard, setActiveCard] = useState(0);
  const goCard = (i: number) => {
    setActiveCard(i);
    document
      .getElementById(`ecard-${i}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /* 10. Mobile PWA State */
  const [pwaFeat, setPwaFeat] = useState<"notch" | "offline" | "notifications">(
    "notch"
  );
  const [phoneTab, setPhoneTab] = useState<
    "Today" | "Money" | "Vault" | "Teams"
  >("Today");

  /* 11. Savings Calculator State */
  const [tools, setTools] = useState({
    notion: true,
    ynab: true,
    todoist: true,
    onepassword: true,
    asana: false,
  });
  const prices = {
    notion: 10,
    ynab: 14.99,
    todoist: 5,
    onepassword: 3,
    asana: 13.49,
  };
  const total = Object.entries(tools).reduce(
    (a, [k, v]) => (v ? a + prices[k as keyof typeof prices] : a),
    0
  );
  const saved = Math.max(0, (total - 3.69) * 12);

  /* 12. Pricing Billing State */
  const [annualBilling, setAnnualBilling] = useState(true);
  const proPrice = annualBilling ? "2.95" : "3.69";

  /* 13. FAQ State */
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [faqCat, setFaqCat] = useState<
    "all" | "privacy" | "personal_vs_team" | "financial" | "pricing"
  >("all");
  const allFaqs = [
    {
      cat: "privacy",
      q: "What is Manageo?",
      a: "Manageo is a unified Personal Operating System and Collaborative Team Workspaces platform. It provides individuals with a private cockpit for daily routines, money management, upcoming financial reminders, and encrypted vault records, alongside high-velocity team workspaces for collaborative projects, sprints, and role-governed task execution.",
    },
    {
      cat: "personal_vs_team",
      q: "What is the difference between Manageo and a Team Workspace?",
      a: "Your Personal Operating System is strictly bound to your individual user account. It houses your personal daily routines, private financial accounts, financial reminders, custom personal databases, and encrypted vault records. Team Workspaces are shared collaborative spaces where invited members can co-manage projects, assign tasks, and share files. Personal records never enter team workspaces.",
    },
    {
      cat: "privacy",
      q: "Can team members see my personal finances or private Vault?",
      a: "No. Never. Personal financial schemas (transactions, bank accounts, balances, financial reminders) and Vault items are strictly excluded from workspace scoping. They are cryptographically and logically isolated by your individual userId. Even if you invite team members into a collaborative workspace, your personal finances and vault remain 100% invisible to them.",
    },
    {
      cat: "financial",
      q: "How does the Financial Reminder System protect against missed bills?",
      a: "The Financial Reminder System continuously tracks recurring expenses, utilities, credit cards, loan EMIs, subscriptions, and investment dividends. You receive automated advance alerts (1, 3, or 7 days before). When you click Record Payment, Manageo generates a verified transaction into your selected account with anti-duplication safeguards, ensuring your account balances stay accurate with zero duplicate charges.",
    },
    {
      cat: "financial",
      q: "Can I track investments, bond maturities, and dividend yields?",
      a: "Yes. Manageo includes portfolio asset tracking alongside proactive dividend payout reminders and maturity tracking. You can track when returns are expected, monitor yield distribution, and receive automated notifications before upcoming investment events.",
    },
    {
      cat: "personal_vs_team",
      q: "How do workspace invitations work?",
      a: "Workspace owners or administrators generate secure, cryptographic invitation tokens sent via email or direct link. Teammates accept the invitation and authenticate with their individual account. No shared passwords or credential sharing are ever required.",
    },
    {
      cat: "personal_vs_team",
      q: "Can a member's permissions be restricted?",
      a: "Yes. Workspaces feature granular role-based access control (Owner, Admin, Member, Viewer) as well as per-module permissions. You can grant access to team tasks and project boards while restricting custom databases, file repositories, or billing settings.",
    },
    {
      cat: "privacy",
      q: "How is the Vault secured?",
      a: "The Vault utilizes authenticated AES-256-GCM encryption. In addition to a master vault password, you can configure isolated custom passwords for individual sensitive items. Emergency custom password recovery is supported via transactional email one-time passcodes (OTP).",
    },
    {
      cat: "pricing",
      q: "Which features are included in each plan?",
      a: "The Starter plan ($0/mo) includes full Manageo access, 2 custom sections, and up to 5 team workspace members. The Pro plan ($3.69/mo monthly or $2.95/mo billed annually) increases capacity to 10 custom sections, 10 team members, advanced productivity analytics, and transaction-linked invoices with PDF export. Enterprise plans include up to 100 custom sections, custom member allocations, and dedicated SLA support.",
    },
  ];
  const faqs = allFaqs.filter((f) => faqCat === "all" || f.cat === faqCat);

  return (
    <div className="w-full text-slate-100 font-sans antialiased selection:bg-sky-500/20 selection:text-sky-200 bg-[#0a0e1a]">
      {/* ═══════════════════════════════════════════════════════════════
          §1 HERO SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0e1a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_30%,rgba(99,102,241,0.08),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Hero Copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <motion.h1
              variants={fadeUp}
              className="text-[2.6rem] sm:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight text-white leading-[1.05] mb-6"
            >
              Your life, in order.{" "}
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                Your team, in sync.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base sm:text-[17px] text-slate-400 leading-relaxed max-w-2xl mx-auto mb-9"
            >
              The unified{" "}
              <strong className="text-slate-200 font-semibold">
                Personal Operating System
              </strong>{" "}
              and collaborative{" "}
              <strong className="text-slate-200 font-semibold">
                Team Workspaces
              </strong>
              . Master routines, private finances, proactive reminders, and
              priority tasks — then collaborate with{" "}
              <strong className="text-sky-300 font-semibold">
                Zero Data Contamination
              </strong>
              .
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-6"
            >
              <Link
                href="/register?type=individual"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-bold text-sm transition-all duration-200 shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Start for Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="#manageo-engine"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/[0.12] hover:border-white/[0.24] bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-sm transition-all duration-200"
              >
                <span>Explore Interactive Engine</span>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 text-xs text-slate-400"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                No credit card required · Personal and team data are
                cryptographically partitioned
              </span>
            </motion.div>
          </motion.div>

          {/* Interactive Cockpit Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="max-w-5xl mx-auto"
          >
            <div className="relative">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-500/25 via-indigo-500/15 to-emerald-500/20 rounded-3xl blur-2xl opacity-80" />
              <div className="relative rounded-2xl border border-white/[0.11] bg-[#0f1524]/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
                {/* Window Chrome Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-white/[0.07] bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-xs bg-amber-400/80" />
                      <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/80" />
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/90">
                        {heroMode === "personal"
                          ? "Manageo — Personal Cockpit"
                          : "Manageo — AXIOMIXS Studio Workspace"}
                      </span>
                      <span
                        className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-md font-semibold border ${heroMode === "personal"
                            ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                            : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                          }`}
                      >
                        {heroMode === "personal"
                          ? "Private Scope"
                          : "Shared Tenant"}
                      </span>
                    </div>
                  </div>

                  {/* Mode Switcher with layoutId */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/[0.08]">
                    {(["personal", "team"] as const).map((m) => {
                      const active = heroMode === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setHeroMode(m)}
                          className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${active
                              ? "text-white"
                              : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                          {active && (
                            <motion.div
                              layoutId="heroModePill"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                              }}
                              className="absolute inset-0 rounded-lg bg-gradient-to-r from-sky-500/25 to-indigo-500/25 border border-sky-500/40"
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-1.5">
                            {m === "personal" ? (
                              <User className="w-3.5 h-3.5 text-sky-400" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                            {m === "personal" ? "Manageo" : "Team Workspace"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cockpit Body */}
                <div className="p-4 sm:p-6">
                  {/* Top 4 KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
                    {/* KPI 1 */}
                    <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span className="font-medium">Daily Execution</span>
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-white tracking-tight leading-none">
                        {heroMode === "personal"
                          ? `${doneCount}/${heroTasks.length} Done`
                          : "14 Active"}
                      </p>
                      <div className="mt-2.5 h-1.5 rounded-xs bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-sky-500 to-cyan-300"
                          initial={false}
                          animate={{
                            width: `${heroMode === "personal" ? donePct : 68
                              }%`,
                          }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <span className="text-[10px] text-sky-400 mt-1.5 block font-medium">
                        {heroMode === "personal"
                          ? `${donePct}% completed today`
                          : "Sprint 24 · 68% velocity"}
                      </span>
                    </div>

                    {/* KPI 2 */}
                    <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span className="font-medium">Financial Privacy</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={cycleCurrency}
                            title="Switch Currency"
                            className="text-[10px] font-bold text-sky-300 hover:text-white px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 cursor-pointer"
                          >
                            {cur}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowBal((b) => !b)}
                            title="Toggle Balance Visibility"
                            className="text-slate-400 hover:text-white cursor-pointer"
                          >
                            {showBal ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-white leading-none">
                        {heroMode === "personal"
                          ? showBal
                            ? `${cur}${bal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                            : "••••••••"
                          : "Isolated"}
                      </p>
                      <span className="text-[10px] text-emerald-400 mt-2 block font-medium">
                        {heroMode === "personal"
                          ? "Private Checking Ledger"
                          : "100% Invisible to Team"}
                      </span>
                    </div>

                    {/* KPI 3 */}
                    <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span className="font-medium">Smart Reminders</span>
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-white leading-none">
                        {heroMode === "personal"
                          ? `${reminders.filter((r) => !r.isPaid).length} Upcoming`
                          : "Shared Deadlines"}
                      </p>
                      <span className="text-[10px] text-amber-400 mt-2 block font-medium">
                        {heroMode === "personal"
                          ? "Bills & Dividends Tracked"
                          : "Assigned Milestones"}
                      </span>
                    </div>

                    {/* KPI 4 */}
                    <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span className="font-medium">Encrypted Vault</span>
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-white leading-none">
                        AES-256-GCM
                      </p>
                      <span className="text-[10px] text-indigo-400 mt-2 block font-medium">
                        Zero-Knowledge Enclave
                      </span>
                    </div>
                  </div>

                  {/* Interactive Focus & Sprint Panel */}
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                      <span className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-xs ${heroMode === "personal"
                              ? "bg-sky-400"
                              : "bg-indigo-400"
                            }`}
                        />
                        {heroMode === "personal"
                          ? "Focus Blocks & Smart Reminders"
                          : "Collaborative Sprint Tasks"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {heroMode === "personal"
                          ? "Interactive: Click tasks to complete or add your own"
                          : "Role: Workspace Owner · Zero Personal Data Exposed"}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <AnimatePresence mode="wait">
                        {heroMode === "personal" ? (
                          <motion.div
                            key="personal-list"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2"
                          >
                            {heroTasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={() => toggleTask(task.id)}
                                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/[0.1] cursor-pointer transition-all"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-colors ${task.done
                                        ? "bg-sky-500 border-sky-400 text-slate-950"
                                        : "border-white/25 hover:border-sky-400"
                                      }`}
                                  >
                                    {task.done && (
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs font-medium truncate transition-colors ${task.done
                                        ? "line-through text-slate-500"
                                        : "text-slate-200"
                                      }`}
                                  >
                                    {task.title}
                                  </span>
                                </div>
                                <span className="shrink-0 text-[10px] text-slate-300 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.07]">
                                  {task.tag}
                                </span>
                              </div>
                            ))}

                            {/* Quick Add Task Input */}
                            <form
                              onSubmit={addHeroTask}
                              className="flex items-center gap-2 pt-1"
                            >
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  value={newTaskText}
                                  onChange={(e) =>
                                    setNewTaskText(e.target.value)
                                  }
                                  placeholder="Add a quick focus block to test..."
                                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] focus:border-sky-500/50 focus:outline-none text-xs text-white placeholder:text-slate-500"
                                />
                              </div>
                              <button
                                type="submit"
                                className="px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add
                              </button>
                            </form>

                            {/* Alert Banner */}
                            <div className="mt-2 p-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-white">
                                    Upcoming Due: AWS Infrastructure ({cur}
                                    84.00)
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    Due tomorrow · Auto-checks low balance
                                    before payment
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  goCard(0);
                                }}
                                className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer bg-amber-500/15 px-2.5 py-1 rounded-md border border-amber-500/30"
                              >
                                Pay or Snooze <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="team-list"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2"
                          >
                            {[
                              {
                                col: "bg-emerald-400",
                                name: "Production E2E Multi-Tenant Migration Suite",
                                a: "Marcus B.",
                                st: "Completed",
                                sc: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                              },
                              {
                                col: "bg-sky-400",
                                name: "API Gateway Rate Limiting & Webhook Dispatch",
                                a: "Sarah C.",
                                st: "In Progress",
                                sc: "bg-sky-500/20 text-sky-300 border-sky-500/30",
                              },
                              {
                                col: "bg-amber-400",
                                name: "Design System Editorial Refresh Tokens",
                                a: "Elena R.",
                                st: "In Review",
                                sc: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                              },
                            ].map((item) => (
                              <div
                                key={item.name}
                                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.015] text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className={`w-2 h-2 rounded-xs shrink-0 ${item.col}`}
                                  />
                                  <span className="text-slate-200 font-medium truncate">
                                    {item.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.08] text-slate-300">
                                    {item.a}
                                  </span>
                                  <span
                                    className={`text-[10px] px-2.5 py-0.5 rounded-md border font-semibold ${item.sc}`}
                                  >
                                    {item.st}
                                  </span>
                                </div>
                              </div>
                            ))}
                            <div className="p-2.5 rounded-lg bg-indigo-500/[0.07] border border-indigo-500/25 flex items-center justify-between text-xs text-indigo-200">
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                                Personal bank accounts, habits, and vault keys
                                are strictly excluded from this workspace.
                              </span>
                              <button
                                type="button"
                                onClick={() => goCard(5)}
                                className="text-[11px] font-bold text-indigo-300 hover:text-white underline shrink-0 cursor-pointer"
                              >
                                Test RBAC
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          §2 STATS RIBBON
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#0a0e1a] border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
            <StatPill value="99.98%" label="Platform Availability" delay={0} />
            <StatPill
              value="< 50ms"
              label="P99 Index Latency"
              color="text-sky-400"
              delay={0.08}
            />
            <StatPill
              value="0 Bytes"
              label="Personal Data Leakage"
              color="text-emerald-400"
              delay={0.16}
            />
            <StatPill
              value="AES-256"
              label="Military-Grade Encryption"
              color="text-indigo-400"
              delay={0.24}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          §3 FOUR PILLARS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 border-b border-white/[0.06] bg-[#0f1524]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Core Pillars"
            title={
              <>
                One system for your private life.
                <br className="hidden sm:block" /> One controlled cockpit for
                teams.
              </>
            }
            subtitle="Most productivity apps force you to choose between private personal organization and collaborative enterprise chaos. Manageo bridges both worlds with architectural isolation."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              icon={CheckSquare}
              color="sky"
              title="Personal Tasks & Habits"
              description="Daily focus time-blocking, recurring habits, morning rituals, and streak tracking. Zero distraction, 100% personal clarity."
              cta="Time-Blocking & Streaks"
              onClick={() => goCard(1)}
              delay={0}
            />
            <FeatureCard
              icon={Wallet}
              color="emerald"
              title="Money & Financial Reminders"
              description="Income & expense ledgers, multi-currency accounts, and proactive reminders for upcoming bills, subscriptions, loan EMIs, and dividends."
              cta="Bills & Automated Payments"
              onClick={() => goCard(0)}
              delay={0.08}
            />
            <FeatureCard
              icon={Lock}
              color="indigo"
              title="Encrypted Vault & Documents"
              description="Military-grade AES-256-GCM encrypted storage for recovery keys, passwords, contracts, and confidential credentials with OTP recovery."
              cta="Zero-Knowledge AES-256"
              onClick={() => goCard(3)}
              delay={0.16}
            />
            <FeatureCard
              icon={Users}
              color="amber"
              title="Team Workspaces & RBAC"
              description="Multi-tenant collaborative project boards, sprints, and role governance. Personal records and bank accounts remain 100% segregated."
              cta="Zero Data Contamination"
              onClick={() => goCard(5)}
              delay={0.24}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          §4 INTERACTIVE ENGINE MODULES
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="manageo-engine"
        className="py-20 md:py-28 border-b border-white/[0.06] bg-[#0a0e1a]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Manageo Engine"
            title="Six modules. One unified workspace."
            subtitle="Every module below is a live interactive sandbox. Test bill payments, habit streaks, vault encryption, and team permissions right here."
          />

          <div className="relative space-y-12 pb-24">
            {/* ─── Card 1: Financial Reminders ─── */}
            <motion.div
              id="ecard-0"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              onViewportEnter={() => setActiveCard(0)}
              transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
              className="sticky top-20 sm:top-24 z-10 rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-[#0f1524] shadow-[0_-8px_30px_rgba(0,0,0,0.5)] overflow-hidden scroll-mt-24"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.07] bg-amber-500/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.12em] block">
                      Module 01 · Interactive Ledger
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                      Smart Financial Reminders & Ledger Auto-Sync
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={resetFinanceDemo}
                    title="Reset Demo Ledger"
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-right">
                    <p className="text-[10px] text-emerald-400 font-semibold">
                      Checking Balance
                    </p>
                    <p className="text-sm sm:text-base font-extrabold text-white">
                      {cur}
                      {bal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <AnimatePresence>
                  {notice && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-medium flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        {notice}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2.5">
                  {reminders.map((rem) => {
                    const isDividend = rem.category === "dividend";
                    return (
                      <div
                        key={rem.id}
                        className={`p-4 rounded-xl border transition-all ${rem.isPaid
                            ? "bg-emerald-500/[0.04] border-emerald-500/25 opacity-80"
                            : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                          }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${rem.isPaid
                                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                                  : isDividend
                                    ? "bg-sky-500/15 border border-sky-500/25 text-sky-400"
                                    : "bg-amber-500/15 border border-amber-500/25 text-amber-400"
                                }`}
                            >
                              {isDividend ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <Receipt className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white">
                                  {rem.title}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-slate-300">
                                  {rem.categoryLabel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Due:{" "}
                                <strong className="text-slate-200">
                                  {rem.dueDate}
                                </strong>{" "}
                                · {rem.account} · {rem.frequency}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`text-base font-extrabold ${isDividend ? "text-emerald-400" : "text-white"
                                }`}
                            >
                              {isDividend
                                ? `+${cur}${rem.amount.toFixed(2)}`
                                : `-${cur}${rem.amount.toFixed(2)}`}
                            </span>
                            {rem.isPaid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-lg border border-emerald-500/30 font-semibold">
                                <Check className="w-3.5 h-3.5" /> Synced to
                                Ledger
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => snooze(rem.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] cursor-pointer transition-colors"
                                >
                                  Snooze
                                </button>
                                <button
                                  type="button"
                                  onClick={() => payReminder(rem.id)}
                                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-950 shadow-sm cursor-pointer transition-all ${isDividend
                                      ? "bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200"
                                      : "bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200"
                                    }`}
                                >
                                  {isDividend
                                    ? "Claim Dividend"
                                    : "Record Payment"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 p-3.5 rounded-xl bg-sky-500/[0.05] border border-sky-500/20 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>
                      Low-Balance Guardrail: Alerts automatically if account
                      balance drops below {cur}500.00.
                    </span>
                  </div>
                  <span className="text-emerald-400 text-[11px] font-bold shrink-0">
                    ✓ Threshold Safe
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ─── Card 2: Tasks & Routines ─── */}
            <motion.div
              id="ecard-1"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              onViewportEnter={() => setActiveCard(1)}
              className="sticky top-24 sm:top-28 z-20 rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-[#0f1524] shadow-[0_-8px_30px_rgba(0,0,0,0.6)] overflow-hidden scroll-mt-28"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.07] bg-sky-500/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center shrink-0">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.12em] block">
                      Module 02 · Interactive Rituals
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                      Daily Execution: Routines, Habits & Priority Blocks
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {18 + (ritualDoneCount === rituals.length ? 1 : 0)} Days
                  Streak
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Morning Rituals (Clickable) */}
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                        Morning Routine Ritual
                      </span>
                      <span className="text-[11px] text-sky-400 font-semibold">
                        {ritualDoneCount}/{rituals.length} Completed
                      </span>
                    </div>
                    <div className="space-y-2">
                      {rituals.map((item) => (
                        <div
                          key={item.id}
                          onClick={() =>
                            setRituals((p) =>
                              p.map((r) =>
                                r.id === item.id ? { ...r, done: !r.done } : r
                              )
                            )
                          }
                          className="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] flex items-center justify-between text-xs cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${item.done
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                  : "border-white/25"
                                }`}
                            >
                              {item.done && (
                                <Check className="w-3 h-3 stroke-[3]" />
                              )}
                            </div>
                            <span
                              className={
                                item.done
                                  ? "line-through text-slate-400"
                                  : "text-white font-medium"
                              }
                            >
                              {item.label}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${item.done ? "text-emerald-400" : "text-amber-400"
                              }`}
                          >
                            {item.done ? "Done" : "Tap to Complete"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deep Work Schedule (Clickable) */}
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                        Today Deep Work Schedule
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Click block to toggle active focus
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {deepBlocks.map((item) => (
                        <div
                          key={item.id}
                          onClick={() =>
                            setDeepBlocks((p) =>
                              p.map((b) =>
                                b.id === item.id
                                  ? { ...b, active: !b.active }
                                  : b
                              )
                            )
                          }
                          className={`p-3 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${item.active
                              ? "bg-sky-500/10 border-sky-500/35"
                              : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]"
                            }`}
                        >
                          <div>
                            <p className="text-white font-semibold flex items-center gap-2">
                              {item.time}
                              {item.active && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/25 text-sky-300 font-bold uppercase">
                                  Active Timer
                                </span>
                              )}
                            </p>
                            <p className="text-slate-300 text-xs mt-0.5">
                              {item.task}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold ${item.tc}`}
                          >
                            {item.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ─── Card 3: Investments ─── */}
            <motion.div
              id="ecard-2"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              onViewportEnter={() => setActiveCard(2)}
              className="sticky top-28 sm:top-32 z-30 rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-[#0f1524] shadow-[0_-8px_30px_rgba(0,0,0,0.7)] overflow-hidden scroll-mt-28"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.07] bg-emerald-500/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.12em] block">
                      Module 03 · Wealth & Yield
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                      Investment Portfolio & Asset Allocation
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDripEnabled((d) => !d)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${dripEnabled
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-400"
                      }`}
                  >
                    DRIP Auto-Reinvest: {dripEnabled ? "ON" : "OFF"}
                  </button>
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
                    <p className="text-[10px] text-emerald-400 font-semibold">
                      Total Portfolio Value
                    </p>
                    <p className="text-sm sm:text-base font-extrabold text-white">
                      {cur}
                      {dripEnabled ? "132,670.00" : "128,490.00"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {/* Allocation Bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span>Portfolio Asset Allocation</span>
                    <span>53% Equities · 27% Treasuries · 20% Cash & Gold</span>
                  </div>
                  <div className="h-2.5 w-full rounded-md bg-white/5 overflow-hidden flex gap-0.5">
                    <div
                      className="h-full bg-emerald-400 rounded-l-md"
                      style={{ width: "53%" }}
                    />
                    <div
                      className="h-full bg-sky-400"
                      style={{ width: "27%" }}
                    />
                    <div
                      className="h-full bg-amber-400 rounded-r-md"
                      style={{ width: "20%" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  {[
                    {
                      label: "Total Equities & ETFs",
                      value: `${cur}68,200.00`,
                      change: "+12.4% Past 12 Months",
                      color: "text-emerald-400",
                    },
                    {
                      label: "Fixed Income & Treasuries",
                      value: `${cur}35,000.00`,
                      change: "5.15% Locked Yield APY",
                      color: "text-sky-400",
                    },
                    {
                      label: "Projected Annual Dividend",
                      value: `${cur}${dripEnabled ? "4,598.00" : "4,180.00"}`,
                      change: dripEnabled
                        ? "+10% Compounded via DRIP"
                        : "Paid across 12 scheduled dates",
                      color: "text-amber-400",
                    },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                    >
                      <span className="text-[11px] text-slate-400">
                        {c.label}
                      </span>
                      <p className="text-lg font-bold text-white mt-1 tracking-tight">
                        {c.value}
                      </p>
                      <span
                        className={`text-[10px] font-medium mt-1 block ${c.color}`}
                      >
                        {c.change}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider block mb-3">
                    Upcoming Yield & Dividend Events
                  </span>
                  <div className="space-y-2">
                    {[
                      {
                        name: "Vanguard High Dividend Yield ETF (VYM)",
                        sub: `Expected payout: ${cur}142.80 · Ex-Date: Oct 22`,
                        amount: `+${cur}142.80`,
                        ac: "text-emerald-400",
                      },
                      {
                        name: "US Treasury 6-Month T-Bill Maturity",
                        sub: `Principal return: ${cur}10,000.00 · Maturity: Nov 15`,
                        amount: `+${cur}10,257.50`,
                        ac: "text-sky-400",
                      },
                    ].map((i) => (
                      <div
                        key={i.name}
                        className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">
                            {i.name}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {i.sub}
                          </p>
                        </div>
                        <span className={`font-extrabold ${i.ac}`}>
                          {i.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ─── Card 4: Encrypted Vault ─── */}
            <motion.div
              id="ecard-3"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              onViewportEnter={() => setActiveCard(3)}
              className="sticky top-32 sm:top-36 z-40 rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-[#0f1524] shadow-[0_-8px_30px_rgba(0,0,0,0.8)] overflow-hidden scroll-mt-28"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.07] bg-indigo-500/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.12em] block">
                      Module 04 · Zero-Knowledge Security
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                      Zero-Knowledge AES-256-GCM Sensitive Vault
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVaultLocked((l) => !l);
                    setRevealed(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${vaultLocked
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/35 hover:bg-rose-500/30"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/35 hover:bg-indigo-500/30"
                    }`}
                >
                  {vaultLocked ? (
                    <Unlock className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  {vaultLocked ? "Unlock Master Vault" : "Lock Vault Now"}
                </button>
              </div>

              <div className="p-5 sm:p-6">
                <div className="space-y-2.5">
                  {vaultItems.map((item) => {
                    const isRevealed = !vaultLocked && revealed === item.id;
                    const isCopied = copiedId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                            <Key className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-white">
                                {item.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-slate-300">
                                {item.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              AES-256-GCM payload · Last rotated {item.updated}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs px-3 py-1.5 rounded-lg border font-mono tracking-tight transition-colors ${isRevealed
                                ? "bg-indigo-950/60 border-indigo-500/40 text-indigo-200"
                                : "bg-black/50 border-white/[0.08] text-slate-400"
                              }`}
                          >
                            {isRevealed
                              ? item.secret
                              : "••••••••••••••••••••"}
                          </span>
                          {!vaultLocked && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealed((r) =>
                                    r === item.id ? null : item.id
                                  )
                                }
                                title={
                                  isRevealed ? "Hide Secret" : "Reveal Secret"
                                }
                                className="p-2 rounded-lg text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer transition-colors"
                              >
                                {isRevealed ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => copySecret(item.id, item.secret)}
                                title="Copy Secret"
                                className="px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer inline-flex items-center gap-1 transition-colors"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-[10px] text-emerald-400">
                                      Copied
                                    </span>
                                  </>
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3.5 rounded-xl bg-indigo-500/[0.05] border border-indigo-500/20 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Per-Item Custom Passwords & Emergency Email OTP Recovery
                    Supported
                  </span>
                  <span className="text-indigo-400 font-bold text-[11px] shrink-0">
                    ✓ Hardware Enclave Ready
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ─── Card 5: Custom Databases ─── */}
            <motion.div
              id="ecard-4"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              onViewportEnter={() => setActiveCard(4)}
              className="sticky top-36 sm:top-40 z-50 rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-[#0f1524] shadow-[0_-8px_30px_rgba(0,0,0,0.85)] overflow-hidden scroll-mt-28"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.07] bg-sky-500/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.12em] block">
                      Module 05 · Dynamic Schemas
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                      Custom Databases & Multi-View Schemas
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={dbSearch}
                      onChange={(e) => setDbSearch(e.target.value)}
                      placeholder="Filter records..."
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/40 w-36 sm:w-44"
                    />
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-black/40 border border-white/[0.08]">
                    {(["table", "kanban", "list"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setDbView(v)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer capitalize transition-all ${dbView === v
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/35"
                            : "text-slate-400 hover:text-white"
                          }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <AnimatePresence mode="wait">
                  {dbView === "table" && (
                    <motion.div
                      key="table"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-x-auto"
                    >
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.07] text-slate-400">
                            <th className="pb-3 font-semibold pr-4">
                              Record Title
                            </th>
                            <th className="pb-3 font-semibold pr-4">
                              Category
                            </th>
                            <th className="pb-3 font-semibold pr-4">
                              Priority
                            </th>
                            <th className="pb-3 font-semibold pr-4">Status</th>
                            <th className="pb-3 font-semibold">Target Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {filteredDbRows.map((r) => (
                            <tr
                              key={r.id}
                              className="hover:bg-white/[0.025] transition-colors"
                            >
                              <td className="py-3.5 pr-4 font-semibold text-white">
                                {r.name}
                              </td>
                              <td className="py-3.5 pr-4 text-slate-300">
                                {r.category}
                              </td>
                              <td className="py-3.5 pr-4">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${r.priority === "Critical"
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                      : r.priority === "High"
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                        : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                    }`}
                                >
                                  {r.priority}
                                </span>
                              </td>
                              <td className="py-3.5 pr-4 text-slate-300">
                                {r.status}
                              </td>
                              <td className="py-3.5 text-slate-400">
                                {r.date}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                  {dbView === "kanban" && (
                    <motion.div
                      key="kanban"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                      {[
                        {
                          col: "In Progress",
                          rows: [
                            {
                              n: "Q4 Platform Modernization",
                              t: "Engineering · Oct 24",
                              c: "text-sky-400",
                            },
                          ],
                        },
                        {
                          col: "Review",
                          rows: [
                            {
                              n: "Mobile PWA Offline Sync Engine",
                              t: "Critical · Nov 02",
                              c: "text-rose-400",
                            },
                          ],
                        },
                        {
                          col: "Completed",
                          rows: [
                            {
                              n: "Role-Based Invitation Verification",
                              t: "Security · Oct 12",
                              c: "text-emerald-400",
                            },
                            {
                              n: "Stripe Webhook Pipelines",
                              t: "Finance · Oct 10",
                              c: "text-emerald-400",
                            },
                          ],
                        },
                      ].map((col) => (
                        <div
                          key={col.col}
                          className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                            {col.col} ({col.rows.length})
                          </span>
                          <div className="space-y-2">
                            {col.rows.map((r) => (
                              <div
                                key={r.n}
                                className="p-3 rounded-lg bg-[#141c2e] border border-white/[0.07] text-xs"
                              >
                                <p className="font-semibold text-white">
                                  {r.n}
                                </p>
                                <span
                                  className={`text-[10px] font-medium mt-1 block ${r.c}`}
                                >
                                  {r.t}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {dbView === "list" && (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-2"
                    >
                      {filteredDbRows.map((r) => (
                        <div
                          key={r.id}
                          className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs hover:bg-white/[0.04]"
                        >
                          <span className="font-semibold text-white">
                            {r.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-300">{r.category}</span>
                            <span className="text-slate-500">{r.date}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* ─── Card 6: Teams RBAC ─── */}
            <motion.div
              id="ecard-5"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              onViewportEnter={() => setActiveCard(5)}
              className="sticky top-40 sm:top-44 z-60 rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-[#0f1524] shadow-[0_-8px_30px_rgba(0,0,0,0.9)] overflow-hidden scroll-mt-28"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.07] bg-sky-500/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.12em] block">
                      Module 06 · Multi-Tenant Governance
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                      Team Workspaces & Granular RBAC Simulator
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {team.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveTeamId(m.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTeamId === m.id
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                          : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08]"
                        }`}
                    >
                      {m.name.split(" ")[0]}{" "}
                      <span className="opacity-65">({m.role})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {activeMember.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {activeMember.email} · Role: {activeMember.role}
                      </p>
                    </div>
                    <span className="text-[11px] px-3 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/25 font-semibold">
                      Click cards below to toggle {activeMember.name.split(" ")[0]}&apos;s access
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      ["tasks", "projects", "databases", "files"] as const
                    ).map((mk) => {
                      const allowed = activeMember.modules[mk];
                      return (
                        <div
                          key={mk}
                          onClick={() => toggleMod(activeMember.id, mk)}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${allowed
                              ? "bg-sky-500/10 border-sky-500/35 text-white shadow-sm"
                              : "bg-white/[0.01] border-white/[0.06] text-slate-500 hover:border-white/[0.12]"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="capitalize font-bold">{mk}</span>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center ${allowed
                                  ? "bg-sky-400 text-slate-950"
                                  : "bg-white/10"
                                }`}
                            >
                              {allowed && (
                                <Check className="w-3 h-3 stroke-[3]" />
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] block font-medium ${allowed ? "text-sky-300" : "text-slate-500"
                              }`}
                          >
                            {allowed ? "Permission Granted" : "Access Blocked"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/[0.05] border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Zero Contamination Invariant: Even Workspace Admins CANNOT
                    view personal bank balances, financial reminders, or private
                    Vault records of other team members.
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          §5 ZERO DATA CONTAMINATION ARCHITECTURE
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        className="py-20 md:py-28 border-b border-white/[0.06] bg-[#0f1524]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Security Architecture"
            title="Zero Data Contamination Guarantee"
            subtitle="How Manageo mathematically guarantees that your personal finances, encrypted vault, and private routines never leak into collaborative team workspaces."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Manageo Tenant */}
            <div className="p-6 rounded-2xl border border-sky-500/25 bg-gradient-to-b from-sky-500/[0.06] to-transparent flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.12em]">
                    Scope: User Tenant
                  </span>
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Personal Operating System
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Strictly bound to individual session authentication.
                  Unconditionally excluded from workspace indexing.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {[
                    "Personal Tasks & Routine Streaks",
                    "Bank Accounts, Ledgers & Reminders",
                    "AES-256-GCM Encrypted Vault Items",
                    "Private Custom Databases & Notes",
                  ].map((i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-sky-400/80 font-mono">
                Logical Isolation: userId partition
              </div>
            </div>

            {/* Cryptographic Gatekeeper */}
            <div className="p-6 rounded-2xl border border-white/[0.1] bg-[#0a0e1a] shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">
                    Live Firewall Simulator
                  </span>
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">
                  Cryptographic Access Gatekeeper
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Every mutation and query runs through the server-side
                  gatekeeper preventing cross-tenant leakage.
                </p>
                <div className="rounded-xl border border-white/[0.08] bg-black/70 p-3.5 text-[11px] font-mono text-slate-300 space-y-1.5 min-h-[155px] flex flex-col justify-between">
                  <div className="space-y-1">
                    {secLogs.map((log, i) => (
                      <p
                        key={i}
                        className={
                          log.includes("BLOCKED") || log.includes("✓")
                            ? "text-emerald-400 font-semibold"
                            : log.includes("TEST")
                              ? "text-amber-400"
                              : "text-slate-400"
                        }
                      >
                        {log}
                      </p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={runSec}
                    disabled={secRunning}
                    className="w-full mt-3 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-sky-400" />
                    {secRunning
                      ? "Evaluating Boundary..."
                      : "Simulate Unauthorized Query"}
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-indigo-300 font-mono text-center">
                verifyWorkspaceAccess(userId, workspaceId)
              </div>
            </div>

            {/* Team Workspace Tenant */}
            <div className="p-6 rounded-2xl border border-indigo-500/25 bg-gradient-to-b from-indigo-500/[0.06] to-transparent flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.12em]">
                    Scope: Workspace Tenant
                  </span>
                  <Building2 className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Team Workspaces
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Shared collaborative space governed by role permissions. Team
                  members co-manage sprints with zero personal visibility.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {[
                    "Sprint Planning & Kanban Boards",
                    "Role-Based Governance (Admin, Member, Viewer)",
                    "Cryptographic Invitation Hashes",
                    "Shared Team Databases & Document Repositories",
                  ].map((i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-indigo-400/80 font-mono">
                Collaborative Isolation: workspaceId partition
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════
          §6 MOBILE PWA (Fixed Dynamic Tailwind Classes + Interactive Phone)
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        className="py-20 md:py-28 border-b border-white/[0.06] bg-[#0a0e1a]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-sky-400 mb-3">
                Mobile PWA Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
                Engineered for Mobile.
                <br className="hidden sm:block" /> Edge-to-Edge Notch Optimized.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
                Install Manageo directly on iOS, Android, macOS, and Windows.
                Built with edge-to-edge safe-area styling, Dynamic Island
                support, and offline-first persistence.
              </p>

              <div className="space-y-3">
                {[
                  {
                    key: "notch" as const,
                    icon: Smartphone,
                    activeCardCls:
                      "bg-sky-500/[0.09] border-sky-500/35 shadow-sm",
                    iconBoxCls:
                      "bg-sky-500/15 border-sky-500/25 text-sky-400",
                    title: "iPhone Notch & Dynamic Island Safe-Areas",
                    desc: "Headers, floating action bars, and bottom sheets are mathematically positioned using standard safe-area insets without clipping.",
                  },
                  {
                    key: "offline" as const,
                    icon: RefreshCw,
                    activeCardCls:
                      "bg-emerald-500/[0.09] border-emerald-500/35 shadow-sm",
                    iconBoxCls:
                      "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
                    title: "Offline-First Service Worker Cache",
                    desc: "Review routines, check off focus tasks, and inspect balances even when offline. Changes sync seamlessly upon reconnection.",
                  },
                  {
                    key: "notifications" as const,
                    icon: Bell,
                    activeCardCls:
                      "bg-indigo-500/[0.09] border-indigo-500/35 shadow-sm",
                    iconBoxCls:
                      "bg-indigo-500/15 border-indigo-500/25 text-indigo-400",
                    title: "Real-Time Background Push Notifications",
                    desc: "Receive proactive notifications for upcoming bills, dividend credits, and team project mentions right on your lock screen.",
                  },
                ].map((feat) => {
                  const isActive = pwaFeat === feat.key;
                  return (
                    <button
                      key={feat.key}
                      type="button"
                      onClick={() => setPwaFeat(feat.key)}
                      className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${isActive
                          ? feat.activeCardCls
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                        }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${feat.iconBoxCls}`}
                      >
                        <feat.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {feat.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {feat.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Phone Mockup */}
            <div className="relative mx-auto max-w-[280px] w-full">
              <div className="absolute -inset-6 bg-gradient-to-b from-sky-500/20 via-indigo-500/15 to-emerald-500/10 blur-2xl rounded-3xl" />
              <div className="relative rounded-[2.4rem] border-[3px] border-white/15 bg-[#0f1524] shadow-2xl overflow-hidden p-1">
                {/* Dynamic Island */}
                <div className="flex items-center justify-center pt-2.5 pb-1.5">
                  <div className="w-24 h-5 rounded-lg bg-black border border-white/10 flex items-center justify-center gap-1.5 px-2">
                    <span className="w-1.5 h-1.5 rounded-xs bg-emerald-400 animate-pulse" />
                    <span className="text-[8px] font-bold text-slate-300 tracking-tight">
                      PWA Active
                    </span>
                  </div>
                </div>

                <div className="px-3.5 pb-3.5">
                  <div className="flex items-center justify-between py-2.5 mb-2.5 border-b border-white/[0.07]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-sky-500/25 text-sky-400 flex items-center justify-center text-[10px] font-black">
                        M
                      </div>
                      <span className="text-xs font-bold text-white">
                        Manageo OS
                      </span>
                    </div>
                    <span className="text-[9px] text-sky-300 font-bold bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-500/25">
                      {phoneTab}
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${pwaFeat}-${phoneTab}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2.5 min-h-[195px]"
                    >
                      {pwaFeat === "notch" && (
                        <>
                          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25">
                            <span className="text-[9px] text-sky-400 font-bold block mb-1">
                              SAFE-AREA INSET ENGINE
                            </span>
                            <p className="text-xs font-bold text-white">
                              Status Bar Clearance: Exact
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                              Zero notch overlap across modern iOS & Android
                              viewports.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <span className="text-[10px] text-slate-300 font-mono block">
                              env(safe-area-inset-top)
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">
                              ✓ Active on {phoneTab} View
                            </span>
                          </div>
                        </>
                      )}

                      {pwaFeat === "offline" && (
                        <>
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                            <span className="text-[9px] text-emerald-400 font-bold block mb-1">
                              OFFLINE LOCAL CACHE
                            </span>
                            <p className="text-xs font-bold text-white">
                              Cache State: Ready & Synced
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                              Service Worker pre-caches static routes and recent
                              ledger state.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <span className="text-[10px] text-slate-300 font-medium">
                              Offline Mutation Queue: 0 pending
                            </span>
                          </div>
                        </>
                      )}

                      {pwaFeat === "notifications" && (
                        <>
                          <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30">
                            <div className="flex items-center justify-between text-[9px] text-indigo-300 mb-1">
                              <span className="font-bold">
                                FINANCIAL ALERT
                              </span>
                              <span>Just now</span>
                            </div>
                            <p className="text-xs font-bold text-white">
                              AWS Cloud Due Tomorrow ({cur}84.00)
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              1-tap payment available right from lock screen.
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              ✓ Web Push Subscriptions: Active
                            </span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Interactive Bottom Nav inside Phone */}
                  <div className="mt-3 pt-2.5 border-t border-white/[0.08] grid grid-cols-4 gap-1 text-center">
                    {(["Today", "Money", "Vault", "Teams"] as const).map(
                      (tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setPhoneTab(tab)}
                          className={`py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${phoneTab === tab
                              ? "bg-sky-500/20 text-sky-300"
                              : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                          {tab}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════
          §7 SAVINGS CALCULATOR
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        className="py-20 md:py-28 border-b border-white/[0.06] bg-[#0f1524]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Cost Comparison"
            title="Replace 5 disjointed subscriptions with one engine."
            subtitle="Consolidate tasks, financial ledgers, bill reminders, encrypted vaults, and team boards into one unified cockpit at a fraction of the cost."
          />

          <div className="max-w-4xl mx-auto rounded-2xl border border-white/[0.09] bg-[#141c2e] p-6 sm:p-8 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-4">
              Select the tools you currently pay for:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
              {(
                [
                  { key: "notion", name: "Notion", price: "$10.00" },
                  { key: "ynab", name: "YNAB", price: "$14.99" },
                  { key: "todoist", name: "Todoist", price: "$5.00" },
                  { key: "onepassword", name: "1Password", price: "$3.00" },
                  { key: "asana", name: "Asana", price: "$13.49" },
                ] as const
              ).map((tool) => {
                const active = tools[tool.key];
                return (
                  <div
                    key={tool.key}
                    onClick={() =>
                      setTools((p) => ({ ...p, [tool.key]: !p[tool.key] }))
                    }
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.02] ${active
                        ? "bg-sky-500/15 border-sky-500/40 text-white shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold">{tool.name}</span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${active ? "bg-sky-400 text-slate-950" : "bg-white/10"
                          }`}
                      >
                        {active && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {tool.price}/mo
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-5 sm:p-6 rounded-xl bg-black/45 border border-white/[0.08] flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-xs text-slate-400 mb-1">
                  Current Disjointed Stack
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-400 line-through">
                  ${total.toFixed(2)}/mo
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-400 font-bold mb-1">
                  Manageo Pro — only $3.69/mo
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  Save ${saved.toFixed(2)} / year
                </p>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Plus zero data contamination & unified global search
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════
          §8 HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        id="how-it-works"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        className="py-20 md:py-28 border-b border-white/[0.06] bg-[#0a0e1a]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Quick Start"
            title="Up and running in four minutes."
            subtitle="Experience the clarity of a unified operating system from day one."
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden md:block" />
            {[
              {
                n: "01",
                title: "Claim Your Cockpit",
                desc: "Sign up in 30 seconds. Choose modular presets or customize your dashboard blocks.",
                icon: Zap,
              },
              {
                n: "02",
                title: "Establish Focus & Money",
                desc: "Set daily routines, record initial bank account balances, and configure recurring bills.",
                icon: BarChart3,
              },
              {
                n: "03",
                title: "Encrypt Master Vault",
                desc: "Set your AES-256 vault passphrase. Store access credentials and private recovery seeds safely.",
                icon: Lock,
              },
              {
                n: "04",
                title: "Invite Collaborators",
                desc: "Spawn collaborative team workspaces with cryptographic token invites. Zero data leakage guaranteed.",
                icon: Users,
              },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative p-6 rounded-2xl border border-white/[0.07] bg-[#0f1524] shadow-lg group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] text-slate-400 flex items-center justify-center mb-4 group-hover:border-sky-500/35 group-hover:text-sky-400 transition-all">
                  <step.icon className="w-4 h-4" />
                </div>
                <span className="absolute top-5 right-5 text-3xl font-black text-white/[0.05] group-hover:text-sky-400/10 transition-colors">
                  {step.n}
                </span>
                <h3 className="text-sm font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════
          §9 PRICING (With Monthly / Annual Toggle)
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        id="pricing"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        className="py-20 md:py-28 border-b border-white/[0.06] bg-[#0f1524]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Pricing"
            title="Predictable, fair pricing for individuals and teams."
            subtitle="Start free forever with full Manageo access. Upgrade when you need team capacity and advanced workflows."
          />

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span
              className={`text-xs font-semibold ${!annualBilling ? "text-white" : "text-slate-400"
                }`}
            >
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setAnnualBilling((a) => !a)}
              className="w-12 h-6 rounded-xl bg-sky-500/20 border border-sky-500/40 p-1 flex items-center cursor-pointer transition-colors"
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-4 h-4 rounded-lg bg-sky-400 ${annualBilling ? "ml-auto" : "ml-0"
                  }`}
              />
            </button>
            <span
              className={`text-xs font-semibold flex items-center gap-1.5 ${annualBilling ? "text-white" : "text-slate-400"
                }`}
            >
              Annual Billing
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                Save 20%
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-7 rounded-2xl border border-white/[0.07] bg-[#141c2e] flex flex-col justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] block mb-3">
                  Starter
                </span>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-sm text-slate-400">/forever</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Complete Manageo for individuals organizing daily life,
                  habits, and tasks.
                </p>
                <ul className="space-y-3 text-xs text-slate-300">
                  {[
                    "Full Manageo (Tasks, Routines, Notes, Ideas)",
                    "Personal Money & AES-256 Encrypted Vault",
                    "Up to 2 Custom Sections",
                    "Up to 5 Workspace Collaborators (Early Access)",
                    "100 MB Cloud Storage",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/register?type=individual"
                className="mt-8 w-full inline-flex items-center justify-center py-3 rounded-xl border border-white/[0.09] hover:border-white/[0.18] bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-sm transition-all"
              >
                Start Free Forever
              </Link>
            </div>

            {/* Pro */}
            <div className="relative p-7 rounded-2xl border-2 border-sky-500/45 bg-gradient-to-b from-[#17233b] to-[#141c2e] flex flex-col justify-between shadow-2xl shadow-sky-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-md bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.12em] block mb-3">
                  Professional
                </span>
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-4xl font-extrabold text-white">
                    ${proPrice}
                  </span>
                  <span className="text-sm text-slate-400">/month</span>
                  {annualBilling && (
                    <span className="text-xs text-slate-500 line-through ml-1">
                      $3.69
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Designed for team owners and power users who need advanced
                  collaboration and custom workflows.
                </p>
                <ul className="space-y-3 text-xs text-slate-300">
                  {[
                    "Everything in Starter",
                    "Up to 10 Custom Database Sections",
                    "Up to 10 Team Members with Role Management",
                    "Team Dashboards & Shared Workspaces",
                    "5 GB Cloud Document & Asset Storage",
                    "Priority Email Support",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/pricing"
                className="mt-8 w-full inline-flex items-center justify-center py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 transition-all"
              >
                Upgrade to Pro (${proPrice}/mo)
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-7 rounded-2xl border border-white/[0.07] bg-[#141c2e] flex flex-col justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] block mb-3">
                  Enterprise
                </span>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-extrabold text-white">
                    Custom
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  High-scale workspace governance, unlimited teams, custom
                  limits, and enterprise SLA.
                </p>
                <ul className="space-y-3 text-xs text-slate-300">
                  {[
                    "Everything in Professional",
                    "Up to 100 Custom Sections",
                    "Unlimited Workspace Members",
                    "Advanced Access Logs & Audit Trails",
                    "50 GB Storage with Custom Retention",
                    "Dedicated Account Management",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/contact"
                className="mt-8 w-full inline-flex items-center justify-center py-3 rounded-xl border border-white/[0.09] hover:border-white/[0.18] bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-sm transition-all"
              >
                Contact Enterprise Sales
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════
          §10 FAQ SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        id="faq"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        className="py-20 md:py-28 border-b border-white/[0.06] bg-[#0a0e1a]"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="FAQ"
            title="Frequently asked questions."
            subtitle="Clear answers regarding privacy, data segregation, financial reminders, and workspace roles."
          />
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
            {(
              [
                "all",
                "privacy",
                "personal_vs_team",
                "financial",
                "pricing",
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setFaqCat(cat);
                  setFaqOpen(0);
                }}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${faqCat === cat
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.07]"
                  }`}
              >
                {cat === "all"
                  ? "All"
                  : cat === "privacy"
                    ? "Privacy & Security"
                    : cat === "personal_vs_team"
                      ? "Personal vs Team"
                      : cat === "financial"
                        ? "Financial"
                        : "Pricing"}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => (
              <div
                key={`${faqCat}-${idx}`}
                className="rounded-xl border border-white/[0.07] bg-[#0f1524] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.025] transition-colors"
                >
                  <span className="text-sm font-semibold text-white leading-snug">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${faqOpen === idx ? "rotate-180 text-sky-400" : ""
                      }`}
                  />
                </button>
                <AnimatePresence>
                  {faqOpen === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="px-5 pb-5 pt-2 text-xs sm:text-[13px] text-slate-400 leading-relaxed border-t border-white/[0.05]"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════
          §11 FINAL CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-36 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0e1a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(56,189,248,0.14),transparent)]" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.span
              variants={fadeUp}
              className="inline-block mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-400"
            >
              Get Started Today
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.06] mb-5"
            >
              Take full sovereignty of your life
              <br className="hidden sm:block" /> and team today.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed"
            >
              No credit card required. Experience complete clarity across
              routines, finances, reminders, and collaborative workspaces.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/register?type=individual"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-bold text-sm shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Launch Your Manageo (Free)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl border border-white/[0.12] hover:border-white/[0.22] bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-sm transition-all"
              >
                Explore Team Workspaces
              </Link>
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="text-xs text-slate-500 mt-6"
            >
              Free forever for personal users · Pro features for teams · Strict
              Zero Contamination guarantee
            </motion.p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}