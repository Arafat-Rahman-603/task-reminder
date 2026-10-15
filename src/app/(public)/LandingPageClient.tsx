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
  Clock,
  Database,
  FolderKanban,
  Plus,
  Filter,
  Layers,
  Settings,
  Users,
  CheckCircle2,
  Wallet,
  FileText,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Zap,
  DollarSign
} from "lucide-react";

export default function LandingPageClient() {
  // Hero interactive workspace switcher
  const [heroMode, setHeroMode] = useState<"personal" | "team">("personal");

  // Tasks & Routines state
  const [tasks, setTasks] = useState([
    { id: 1, title: "08:30 AM • Morning Review & Priority Calibration", done: true, tag: "Routine" },
    { id: 2, title: "10:00 AM • Finalize Core Product Architecture & API Contracts", done: true, tag: "Deep Work" },
    { id: 3, title: "02:00 PM • Reconcile Monthly Financial Ledger", done: false, tag: "Finance" },
    { id: 4, title: "04:30 PM • Sync Cryptographic Credential Rotation in Vault", done: false, tag: "Security" },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  // Financial Ledger state
  const [showLedgerBalances, setShowLedgerBalances] = useState<boolean>(true);

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

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is Manageo?",
      a: "Manageo is a unified Personal Operating System and Collaborative Team Workspaces platform. It gives individuals a single private cockpit for their daily schedules, routines, financial ledgers, and encrypted vault records, while providing team workspaces for collaborative projects, sprints, and role-governed task execution."
    },
    {
      q: "What is the difference between Personal OS and a Team Workspace?",
      a: "Your Personal OS is strictly bound to your individual user account. It houses your personal daily routines, private financial accounts, custom personal databases, and encrypted vault records. Team Workspaces are shared collaborative spaces where invited members can co-manage projects, assign tasks, and share files. Personal records never enter team workspaces."
    },
    {
      q: "Can team members see my personal finances or private Vault?",
      a: "No. Never. Personal financial schemas (transactions, bank accounts, balances) and Vault items are strictly excluded from workspace scoping. They are cryptographically and logically isolated by your individual userId. Even if you invite team members into a collaborative workspace, your personal finances and vault remain 100% invisible to them."
    },
    {
      q: "How do workspace invitations work?",
      a: "Workspace owners or administrators generate secure, cryptographic invitation tokens sent via email or direct link. Teammates accept the invitation and authenticate with their individual account. No shared passwords or credential sharing are ever required."
    },
    {
      q: "Can a member's permissions be restricted?",
      a: "Yes. Workspaces feature granular role-based access control (Owner, Admin, Member, Viewer) as well as per-module permissions. You can grant access to team tasks and project boards while restricting custom databases, file repositories, or billing settings."
    },
    {
      q: "What happens when someone leaves a workspace?",
      a: "When a member leaves or is removed from a workspace, their access to collaborative projects, documents, and workspace tasks is immediately revoked. Their personal OS, individual tasks, and private records remain completely intact and unaffected."
    },
    {
      q: "Which features are included in each plan?",
      a: "The Starter plan ($0/mo) includes full Personal OS access, 2 custom sections, and up to 5 team workspace members. The Pro plan ($3.69/mo) increases capacity to 10 custom sections, 10 team members, and advanced productivity analytics. Enterprise plans include up to 100 custom sections, custom member allocations, and dedicated SLA support."
    }
  ];

  return (
    <div className="w-full text-slate-100 selection:bg-sky-500/20 selection:text-sky-300 font-sans">

      {/* =========================================================================
          HERO SECTION (High-Impact Dark SaaS Design inspired by Employo / Linear)
          ========================================================================= */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 border-b border-white/[0.08] overflow-hidden bg-gradient-to-b from-[#09090b] via-[#0c101a] to-[#09090b]">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-sky-500/10 blur-[140px] pointer-events-none rounded-3xl" />
        <div className="absolute -top-24 right-10 w-[420px] h-[320px] bg-indigo-500/10 blur-[130px] pointer-events-none rounded-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            
            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-bold tracking-tight text-white leading-[1.08] mb-6">
              Your life, in order.<br />
              <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Your team, in sync.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8">
              The unified <strong className="text-slate-200 font-medium">Personal Operating System</strong> and collaborative <strong className="text-slate-200 font-medium">Team Workspaces</strong>. Master routines, private finances, and priority tasks, then collaborate effortlessly with <strong className="text-slate-200 font-medium">Zero Data Contamination</strong>.
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
          <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-[#0c101a]/95 backdrop-blur-xl shadow-2xl p-4 sm:p-6">
            
            {/* Top Workspace Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                  {heroMode === "personal" ? "P" : "T"}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    {heroMode === "personal" ? "Personal Operating System" : "Acme Studio Team Workspace"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {heroMode === "personal" ? "Private Cockpit • Single User" : "Collaborative Workspace • 6 Active Members"}
                  </p>
                </div>
              </div>

              {/* Quick Tab Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/[0.04] border border-white/10">
                <button
                  type="button"
                  onClick={() => setHeroMode("personal")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
                  {heroMode === "personal" ? "3 of 4 Done" : "12 Active"}
                </p>
                <span className="text-[11px] text-sky-400 mt-1 block">
                  {heroMode === "personal" ? "75% completed today" : "Sprint 24 on track"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Financial Privacy</span>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl font-bold text-white font-mono">
                  {heroMode === "personal" ? "$14,820.00" : "Isolated"}
                </p>
                <span className="text-[11px] text-emerald-400 mt-1 block">
                  {heroMode === "personal" ? "+2.4% Net Worth" : "100% Invisible to Team"}
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

              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Data Isolation</span>
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-xl font-bold text-white font-mono">
                  Zero Leakage
                </p>
                <span className="text-[11px] text-sky-400 mt-1 block">
                  Strict userId Scope
                </span>
              </div>
            </div>

            {/* Dynamic Content Section */}
            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  {heroMode === "personal" ? "Today Focus & Priority Blocks" : "Active Collaborative Sprint Tasks"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {heroMode === "personal" ? "Private Ledger Active" : "Role: Workspace Owner"}
                </span>
              </div>

              <div className="space-y-2.5">
                {heroMode === "personal" ? (
                  <>
                    <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-slate-300 font-medium">08:30 AM • Morning Routine & Focus Calibration</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.08]">Personal</span>
                    </div>

                    <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-slate-300 font-medium">10:00 AM • Deep Work: Architecture Design Review</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.08]">Deep Work</span>
                    </div>

                    <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md border border-white/20 bg-white/[0.02]" />
                        <span className="text-white font-medium">02:30 PM • Reconcile Financial Ledger & Invoices</span>
                      </div>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">Private Ledger</span>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 2 — THE THREE CORE PILLARS
          ========================================================================= */}
      <section className="py-20 border-b border-white/[0.08] bg-[#0c101a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              One system for your personal life. One controlled space for team work.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Eliminate app sprawl without compromising privacy. Manageo unifies daily routines, personal wealth, and team projects into deliberate, isolated environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-6">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Personal Operating System
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Build disciplined morning routines, structure your priority tasks, and track personal time blocks with a unified view of your entire day.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Team Workspaces
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Invite team members into distinct workspaces for client sprints and project delivery with granular role-based governance.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Zero Data Contamination
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Financial accounts, personal transactions, and sensitive vault records remain strictly isolated to your individual account.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 3 — PERSONAL OS VS TEAM WORKSPACE (Side by Side)
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#09090b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Two distinct environments. Zero compromise.
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              Switching between your private sanctuary and collaborative workspaces takes one click, keeping daily focus and teamwork clearly separated.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Personal OS Card */}
            <div className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Your personal space.</h3>
                      <p className="text-xs text-slate-400">Personal Operating System</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
                    Private Only
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-6">
                  Plan your days, manage personal finances, maintain routines, and organize your records in a workspace designed around you.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Daily Habit: 30m Reading & System Review</span>
                    <span className="text-[10px] text-sky-400 font-mono font-medium">Completed</span>
                  </div>
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Personal Finance Ledger Reconciliation</span>
                    <span className="text-[10px] text-slate-400 font-mono">Pending</span>
                  </div>
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
                    <span>Encrypted Vault: 14 Items Protected</span>
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/register?type=individual"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold text-sm transition-colors cursor-pointer shadow-xs"
                >
                  Start Personal OS
                </Link>
              </div>
            </div>

            {/* Team Workspace Card */}
            <div className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Your shared workspace.</h3>
                      <p className="text-xs text-slate-400">Collaborative Team Workspace</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                    Multi-User
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-6">
                  Bring projects, tasks, and team workflows together. Give each person the access they need without exposing private personal data.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Design System Review & Asset Tokens</span>
                    <span className="text-[10px] bg-white/[0.04] px-2 py-0.5 rounded-md text-slate-300">Elena R.</span>
                  </div>
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Automated E2E Regression Test Suite</span>
                    <span className="text-[10px] bg-white/[0.04] px-2 py-0.5 rounded-md text-slate-300">Marcus B.</span>
                  </div>
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
                    <span>Role Access: Granular Member Control</span>
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/pricing"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-sm transition-colors cursor-pointer shadow-xs"
                >
                  Create Team Workspace
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 4 — TASKS & ROUTINES (Execution Engine)
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0c101a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-5">
              <span className="text-xs font-mono font-medium text-sky-400 uppercase tracking-wider block mb-2">
                Execution Engine
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Make progress visible.
              </h2>
              <p className="text-base text-slate-400 leading-relaxed mb-8">
                Organize priorities, build recurring routines, and keep important tasks moving throughout the day.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Contextual timeblocking and recurring routines
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Habits and daily focus blocks reset predictably each morning without manual re-entry.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Real-time task state transitions
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Instant feedback and history logging preserve an immutable timeline of what you achieved.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Focused clarity without notification overload
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Clean visual indicators and scheduled digests replace invasive popups and badge anxiety.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Task List */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#09090b] shadow-2xl">
                
                <div className="flex items-center justify-between pb-5 border-b border-white/[0.08] mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Daily Focus Schedule
                    </h3>
                    <p className="text-xs text-slate-400">
                      Click any task to toggle state and update daily progress
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-sky-400">
                      {progressPercent}% Complete
                    </span>
                    <div className="w-24 h-1.5 rounded-sm bg-white/10 overflow-hidden mt-1">
                      <div 
                        className="h-full bg-sky-400 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        task.done
                          ? "bg-white/[0.02] border-white/[0.04] text-slate-500"
                          : "bg-white/[0.04] border-white/[0.08] hover:border-sky-500/40 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            task.done
                              ? "bg-sky-500/20 border-sky-500/30 text-sky-400"
                              : "border-white/20 bg-white/[0.02] hover:border-sky-400"
                          }`}
                        >
                          {task.done && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-xs sm:text-sm ${task.done ? "line-through text-slate-500" : "font-medium text-slate-200"}`}>
                          {task.title}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.02] text-slate-400">
                        {task.tag}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                  <span>Next: 06:00 PM • Day Close & Evening Reflection</span>
                  <span className="font-mono text-sky-400 font-medium">Scheduled</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 5 — FINANCIAL LEDGER & PRIVACY
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#09090b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider block mb-2">
                Strict Personal Isolation
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Your personal data stays personal.
              </h2>
              <p className="text-base text-slate-400 leading-relaxed mb-6">
                Keep your financial records and other private information in your Personal OS, separate from shared team projects and workspace activity.
              </p>

              <div className="space-y-4 text-xs text-slate-400">
                <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                  <h3 className="font-semibold text-white mb-1">
                    Strict userId Ownership Model
                  </h3>
                  <p className="leading-relaxed">
                    Financial models (Accounts, Transactions, Invoices) are logically blocked from Workspace memberships. Team members cannot view, query, or audit your personal finances.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                  <h3 className="font-semibold text-white mb-1">
                    AES-256-GCM Encrypted Storage
                  </h3>
                  <p className="leading-relaxed">
                    Sensitive notes and credential entries utilize AES-256-GCM authenticated encryption, guaranteeing tamper-proof client authorization.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#0c101a] shadow-2xl">
                
                <div className="flex items-center justify-between pb-5 border-b border-white/[0.08] mb-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                      Personal Financial Ledger
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      Liquid Balances & Accounts
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLedgerBalances(!showLedgerBalances)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/10 bg-white/[0.04] text-xs font-medium text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    {showLedgerBalances ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showLedgerBalances ? "Hide Balances" : "Show Balances"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-xs text-slate-400">Primary Operations</span>
                    <p className="text-lg font-semibold text-white font-mono mt-1">
                      {showLedgerBalances ? "$12,450.80" : "••••••••"}
                    </p>
                    <span className="text-[10px] text-slate-500">Business Checking • Chase</span>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-xs text-slate-400">High-Yield Reserves</span>
                    <p className="text-lg font-semibold text-white font-mono mt-1">
                      {showLedgerBalances ? "$38,200.00" : "••••••••"}
                    </p>
                    <span className="text-[10px] text-slate-500">4.75% APY • Treasury Vault</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Recent Verified Transactions
                  </span>

                  <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-white">Retainer Invoice #1042 Payment</p>
                      <p className="text-[10px] text-slate-500">Client Work • Direct Deposit</p>
                    </div>
                    <span className="font-mono text-emerald-400 font-medium">
                      {showLedgerBalances ? "+$4,800.00" : "••••••"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-white">AWS Cloud Services Monthly</p>
                      <p className="text-[10px] text-slate-500">Infrastructure • Card 4912</p>
                    </div>
                    <span className="font-mono text-slate-400 font-medium">
                      {showLedgerBalances ? "-$342.18" : "••••••"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Cryptographic Boundary: Strictly userId-bound</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Zero Data Contamination Guaranteed
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 6 — CUSTOM DATABASES
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0c101a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <span className="text-xs font-mono font-medium text-sky-400 uppercase tracking-wider block mb-2">
                Relational Flexibility
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                Shape your workspace around the way you work.
              </h2>
              <p className="text-base text-slate-400 leading-relaxed">
                Create custom sections, organize records, choose the fields you need, and build views that fit your workflow.
              </p>
            </div>

            {/* View Switchers */}
            <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] rounded-lg border border-white/10 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setActiveDatabaseView("table")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeDatabaseView === "table" ? "bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30" : "text-slate-400 hover:text-white"
                }`}
              >
                Table View
              </button>
              <button
                type="button"
                onClick={() => setActiveDatabaseView("kanban")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeDatabaseView === "kanban" ? "bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30" : "text-slate-400 hover:text-white"
                }`}
              >
                Kanban Cards
              </button>
              <button
                type="button"
                onClick={() => setActiveDatabaseView("list")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeDatabaseView === "list" ? "bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30" : "text-slate-400 hover:text-white"
                }`}
              >
                Simple List
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#09090b] shadow-2xl overflow-hidden">
            
            <div className="px-5 py-3 border-b border-white/[0.08] bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <span className="font-semibold text-white">Engineering Roadmap & Deliverables</span>
                <span className="text-slate-500">({databaseRecords.length} records)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span>Filter: All Active</span>
                <span>•</span>
                <span>Sort: Due Date (Asc)</span>
              </div>
            </div>

            {activeDatabaseView === "table" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.08] font-medium">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-white">Record Name</th>
                      <th className="py-3 px-4 font-semibold text-white">Category</th>
                      <th className="py-3 px-4 font-semibold text-white">Priority</th>
                      <th className="py-3 px-4 font-semibold text-white">Status</th>
                      <th className="py-3 px-4 font-semibold text-white">Target Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {databaseRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {record.name}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          <span className="px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.02] text-[11px]">
                            {record.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-mono ${
                            record.priority === "Critical" ? "text-rose-400 font-semibold" :
                            record.priority === "High" ? "text-amber-400 font-medium" : "text-slate-400"
                          }`}>
                            {record.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            record.status === "Completed" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                            record.status === "In Progress" ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "bg-white/[0.04] text-slate-300 border border-white/[0.08]"
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {record.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeDatabaseView === "kanban" && (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#09090b]">
                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <p className="text-xs font-semibold text-white mb-3 pb-2 border-b border-white/[0.06]">Ready / Planned (1)</p>
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs">
                    <p className="font-medium text-slate-200">Stripe Billing & Invoicing Webhooks</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Due Nov 15</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <p className="text-xs font-semibold text-white mb-3 pb-2 border-b border-white/[0.06]">In Progress (2)</p>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs">
                      <p className="font-medium text-slate-200">Q4 Platform Modernization</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Due Oct 24</span>
                    </div>
                    <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs">
                      <p className="font-medium text-slate-200">Mobile PWA Offline Sync Engine</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Due Nov 02</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <p className="text-xs font-semibold text-white mb-3 pb-2 border-b border-white/[0.06]">Completed (1)</p>
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs">
                    <p className="font-medium text-slate-200">Role-Based Invitation Verification</p>
                    <span className="text-[10px] text-emerald-400 font-medium mt-1 block">Shipped Oct 12</span>
                  </div>
                </div>
              </div>
            )}

            {activeDatabaseView === "list" && (
              <div className="p-4 divide-y divide-white/[0.06]">
                {databaseRecords.map((record) => (
                  <div key={record.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-200">{record.name}</span>
                      <span className="text-slate-400 ml-2">({record.category})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400">{record.date}</span>
                      <span className="px-2 py-0.5 rounded-md border border-white/[0.08] text-[11px] text-slate-300">{record.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 py-3 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
              <span>Selected Schema: <strong className="text-slate-200 font-medium">Custom Section • Text, Select, Date, User</strong></span>
              <span className="text-sky-400 font-medium">Relational Database Integration</span>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 7 — ENCRYPTED VAULT (AES-256-GCM)
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#09090b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <span className="text-xs font-mono font-medium text-sky-400 uppercase tracking-wider block mb-2">
                Zero-Knowledge Boundary
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Keep sensitive information under control.
              </h2>
              <p className="text-base text-slate-400 leading-relaxed mb-6">
                Organize credentials, private documents, and other sensitive records with the access controls available in your Manageo Vault.
              </p>

              <div className="space-y-3 text-xs text-slate-400">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <p>
                    <strong className="text-slate-200">AES-256-GCM Encrypted:</strong> All payload items are encrypted before transport and can only be decrypted with your verified session.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <p>
                    <strong className="text-slate-200">Granular Item Passwords:</strong> In addition to your global master password, set isolated custom passwords for ultra-sensitive keys.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <p>
                    <strong className="text-slate-200">Non-Shared Privacy:</strong> Vault items cannot be mapped or shared into Team Workspaces.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#0c101a] shadow-2xl">
                
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Manageo Vault • Encrypted Store
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVaultLocked(!isVaultLocked)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-white/10 bg-white/[0.04] text-xs font-medium text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    {isVaultLocked ? <Unlock className="w-3.5 h-3.5 text-sky-400" /> : <Lock className="w-3.5 h-3.5 text-sky-400" />}
                    <span>{isVaultLocked ? "Unlock Vault" : "Lock Vault"}</span>
                  </button>
                </div>

                {isVaultLocked ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] text-sky-400 flex items-center justify-center mx-auto border border-white/10">
                      <Lock className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Vault is Locked with AES-256-GCM
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Enter your master password or authenticate session to decrypt items.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vaultItems.map((item) => {
                      const isRevealed = revealedSecretId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{item.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.08]">
                                {item.type}
                              </span>
                            </div>
                            <p className="font-mono text-slate-400 mt-1">
                              {isRevealed ? item.secret : "••••••••••••••••••••••••••••••"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setRevealedSecretId(isRevealed ? null : item.id)}
                              className="px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
                            >
                              {isRevealed ? "Hide" : "Reveal"}
                            </button>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {item.updated}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Encryption: AES-256-GCM Authenticated Cipher</span>
                  <span className="text-sky-400 font-medium">Isolated from Workspaces</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 8 — TEAM GOVERNANCE & PERMISSIONS
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0c101a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <span className="text-xs font-mono font-medium text-sky-400 uppercase tracking-wider block mb-2">
                Team Governance
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Give every teammate the right access.
              </h2>
              <p className="text-base text-slate-400 leading-relaxed mb-6">
                Invite people to a workspace, assign responsibilities, and control which workspace features and actions they can use.
              </p>

              <div className="space-y-3 text-xs text-slate-400">
                <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <strong className="text-white block mb-0.5">Cryptographic Invitation Tokens</strong>
                  Invite collaborators via unique invitation hashes. Members accept invitations with their own independent login credentials.
                </div>
                <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <strong className="text-white block mb-0.5">Configurable Module Scope</strong>
                  Enable or restrict access per module (Tasks, Projects, Custom Databases, Files).
                </div>
                <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <strong className="text-white block mb-0.5">Absolute Personal Protection</strong>
                  Team permissions never apply to personal Money or private Vault records.
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#09090b] shadow-2xl">
                
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Acme Studio • Member Permissions
                    </h3>
                    <p className="text-xs text-slate-400">
                      Select a teammate to review and configure module access
                    </p>
                  </div>
                  <span className="text-xs font-mono text-sky-400 font-medium">
                    3 Active Members
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedTeammate(member.id)}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedTeammate === member.id
                          ? "bg-white/[0.08] border-sky-400/50 shadow-xs"
                          : "bg-white/[0.02] border-white/[0.06] hover:border-white/20"
                      }`}
                    >
                      <p className="text-xs font-semibold text-white truncate">{member.name}</p>
                      <span className="text-[10px] text-slate-400 block">{member.role}</span>
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div>
                      <span className="text-xs font-semibold text-white">{activeMember.name}</span>
                      <p className="text-[11px] text-slate-400">{activeMember.email}</p>
                    </div>
                    <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
                      Role: {activeMember.role}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Module Access Permissions
                    </p>

                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <span className="font-medium text-slate-200">Workspace Tasks</span>
                      <button
                        type="button"
                        onClick={() => toggleTeammateModule(activeMember.id, "tasks")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          activeMember.modules.tasks ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "bg-white/[0.04] text-slate-500 border border-white/[0.06]"
                        }`}
                      >
                        {activeMember.modules.tasks ? "Allowed" : "Restricted"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <span className="font-medium text-slate-200">Shared Projects</span>
                      <button
                        type="button"
                        onClick={() => toggleTeammateModule(activeMember.id, "projects")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          activeMember.modules.projects ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "bg-white/[0.04] text-slate-500 border border-white/[0.06]"
                        }`}
                      >
                        {activeMember.modules.projects ? "Allowed" : "Restricted"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <span className="font-medium text-slate-200">Custom Databases</span>
                      <button
                        type="button"
                        onClick={() => toggleTeammateModule(activeMember.id, "databases")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          activeMember.modules.databases ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "bg-white/[0.04] text-slate-500 border border-white/[0.06]"
                        }`}
                      >
                        {activeMember.modules.databases ? "Allowed" : "Restricted"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <span className="font-medium text-slate-200">File Attachments</span>
                      <button
                        type="button"
                        onClick={() => toggleTeammateModule(activeMember.id, "files")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          activeMember.modules.files ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "bg-white/[0.04] text-slate-500 border border-white/[0.06]"
                        }`}
                      >
                        {activeMember.modules.files ? "Allowed" : "Restricted"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Changes take effect immediately on next sync</span>
                    <span className="text-sky-400 font-medium">Owner Verified</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 9 — HOW MANAGEO WORKS
          ========================================================================= */}
      <section id="how-it-works" className="py-20 md:py-28 border-b border-white/[0.08] bg-[#09090b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="mb-12 max-w-2xl">
            <span className="text-xs font-mono font-medium text-sky-400 uppercase tracking-wider block mb-2">
              Implementation Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              How Manageo works.
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              From your initial morning schedule to collaborative project delivery, Manageo scales naturally with your operational needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between">
              <div>
                <span className="text-3xl font-mono font-bold text-sky-400 block mb-4">
                  01
                </span>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Set up your Personal OS or create a Team Workspace.
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Start in your private sanctuary for personal routines, finances, and focus, or initiate a team workspace for collaborative client projects.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-white/[0.08] text-xs font-mono text-slate-500">
                Zero setup friction
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between">
              <div>
                <span className="text-3xl font-mono font-bold text-sky-400 block mb-4">
                  02
                </span>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Organize tasks, routines, and the appropriate workspace records.
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Structure your day with recurring morning schedules, log priority tasks, and build flexible custom database sections tailored to your workflow.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-white/[0.08] text-xs font-mono text-slate-500">
                Continuous clarity
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between">
              <div>
                <span className="text-3xl font-mono font-bold text-sky-400 block mb-4">
                  03
                </span>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Invite teammates and manage access as your collaboration grows.
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Issue secure invitation tokens and configure granular permissions while keeping private personal data completely isolated.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-white/[0.08] text-xs font-mono text-slate-500">
                Granular governance
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 10 — TRANSPARENT PRICING
          ========================================================================= */}
      <section id="pricing" className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0c101a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-medium text-sky-400 uppercase tracking-wider block mb-2">
              Transparent Investment
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Clear, predictable pricing for individuals and teams.
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              Every plan includes our complete Personal Operating System. Choose the capacity and team limits that match your collaboration needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* Starter Plan ($0/month) */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#09090b] flex flex-col justify-between shadow-xl">
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white">Starter</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    For individuals organizing daily productivity and personal systems.
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-white/[0.08]">
                  <span className="text-4xl font-semibold text-white font-mono">$0</span>
                  <span className="text-xs text-slate-400 ml-1.5">/ month</span>
                </div>

                <div className="space-y-3 text-xs mb-8">
                  <p className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Included Capabilities
                  </p>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Full Personal Operating System</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>2 Custom Sections & Databases</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Up to 5 Team Workspace Members</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Daily Habits & Focus Blocks</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Private Financial Ledger</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>AES-256-GCM Encrypted Vault</span>
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/register?type=individual"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  Start with Starter
                </Link>
              </div>
            </div>

            {/* Pro Plan ($3.69/month) */}
            <div className="p-8 rounded-2xl border-2 border-sky-400/50 bg-[#09090b] flex flex-col justify-between shadow-2xl relative">
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white">Pro</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    For operators and teams demanding expanded database capacity and analytics.
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-white/[0.08]">
                  <span className="text-4xl font-semibold text-white font-mono">$3.69</span>
                  <span className="text-xs text-slate-400 ml-1.5">/ month</span>
                </div>

                <div className="space-y-3 text-xs mb-8">
                  <p className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Everything in Starter, plus:
                  </p>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Up to 10 Custom Sections & Databases</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Up to 10 Team Workspace Members</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Advanced Productivity & Execution Trends</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Expanded File & Cloudinary Attachment Storage</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Priority Push & Notification Dispatch</span>
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/pricing"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-sky-500/10"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>

            {/* Enterprise Plan (Custom pricing) */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#09090b] flex flex-col justify-between shadow-xl">
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white">Enterprise</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    For multi-team organizations requiring custom tenancy and dedicated support.
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-white/[0.08]">
                  <span className="text-4xl font-semibold text-white font-mono">Custom</span>
                  <span className="text-xs text-slate-400 ml-1.5">/ organization</span>
                </div>

                <div className="space-y-3 text-xs mb-8">
                  <p className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Everything in Pro, plus:
                  </p>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Up to 100 Custom Sections & Databases</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Custom Workspace Member Allocations</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Dedicated SLA & Support Engineer</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Custom Onboarding & Database Migration</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Custom Audit Logs & Compliance Verification</span>
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/contact"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  Contact Sales
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 11 — FREQUENTLY ASKED QUESTIONS
          ========================================================================= */}
      <section id="faq" className="py-20 md:py-28 border-b border-white/[0.08] bg-[#09090b]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-mono font-medium text-sky-400 uppercase tracking-wider block mb-2">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Frequently asked questions.
            </h2>
            <p className="text-base text-slate-400">
              Everything you need to know about Manageo's architecture, tenancy, and privacy model.
            </p>
          </div>

          <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full py-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-sky-400" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 12 — FINAL CTA
          ========================================================================= */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-[#09090b] via-[#0c101a] to-[#09090b] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/10 blur-[140px] pointer-events-none rounded-3xl" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
          
          <h2 className="text-4xl sm:text-6xl font-bold text-white tracking-tight mb-5">
            Make space for better work.
          </h2>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
            Bring your daily priorities and team collaboration into one organized system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?type=individual"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-sky-500/10 cursor-pointer"
            >
              Start Personal OS
            </Link>

            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-sm transition-all cursor-pointer backdrop-blur-md"
            >
              Create Team Workspace
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
