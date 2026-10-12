"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Wallet, 
  Users, 
  User, 
  Building2, 
  Calendar, 
  FolderKanban, 
  Database, 
  FileKey, 
  Activity, 
  ChevronRight,
  TrendingUp,
  FileCheck,
  UserCheck,
  ShieldAlert,
  Server
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function LandingPageClient() {
  const { t } = useLanguage();
  const [heroMode, setHeroMode] = useState<"personal" | "team">("personal");
  const [personalTasks, setPersonalTasks] = useState([
    { id: 1, title: "Review quarterly investment portfolio", time: "09:00 AM", done: true },
    { id: 2, title: "Morning routine: 20m cardio & meditation", time: "07:30 AM", done: true },
    { id: 3, title: "Sync encrypted API credentials to Vault", time: "02:00 PM", done: false },
    { id: 4, title: "Reconcile business transaction receipts", time: "05:30 PM", done: false },
  ]);

  const toggleTask = (id: number) => {
    setPersonalTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="w-full text-slate-100 selection:bg-stitch-primary/20 selection:text-stitch-primary">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-surface-variant/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Main Hero Copy */}
          <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-surface-container border border-surface-variant/50 text-xs font-semibold text-stitch-primary mb-5 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-sm bg-stitch-primary animate-pulse" />
              <span>Manageo 2.0 • Personal OS & Collaborative Workspaces</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 font-headline leading-[1.12]">
              One operating system for your{" "}
              <span className="text-stitch-primary">personal life</span> and{" "}
              <span className="text-sky-400">team workflows</span>.
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto mb-8">
              Maintain total cryptographic privacy over your personal finances, encrypted vaults, and daily habits—while seamlessly switching into isolated workspaces for team collaboration.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
              <Link
                href="/register?type=individual"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-stitch-primary px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-stitch-primary/90 transition-all shadow-md active:scale-95"
              >
                <User className="w-4 h-4" />
                <span>Start Personal OS (Free)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register?type=team_owner"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container border border-surface-variant/50 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-surface-container-high hover:text-white transition-all active:scale-95"
              >
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Create Team Workspace</span>
              </Link>
            </div>
          </div>

          {/* HERO VISUALIZATION — INTERACTIVE PERSONAL OS VS TEAM WORKSPACE PREVIEW */}
          <div className="max-w-5xl mx-auto">
            {/* Mode Switcher Tabs */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex p-1 rounded-xl bg-surface-container border border-surface-variant/50">
                <button
                  type="button"
                  onClick={() => setHeroMode("personal")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    heroMode === "personal"
                      ? "bg-stitch-primary text-slate-950 shadow-sm"
                      : "text-on-surface-variant hover:text-white"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Personal Operating System</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroMode("team")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    heroMode === "team"
                      ? "bg-sky-400 text-slate-950 shadow-sm"
                      : "text-on-surface-variant hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Team Workspace & Projects</span>
                </button>
              </div>
            </div>

            {/* Dashboard Mock Container */}
            <div className="rounded-2xl bg-surface-container/80 border border-surface-variant/60 shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Window Header */}
              <div className="px-4 py-3 border-b border-surface-variant/40 bg-surface-container-high/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-on-surface-variant/80">
                    manageo.app / {heroMode === "personal" ? "personal-os" : "workspaces/engineering"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-medium text-on-surface-variant">
                  {heroMode === "personal" ? (
                    <span className="flex items-center gap-1.5 text-stitch-primary">
                      <Lock className="w-3 h-3" /> Zero-Knowledge Isolation
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <Building2 className="w-3 h-3" /> Tenant: Core Workspace
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic View Body */}
              <div className="p-4 sm:p-6 lg:p-8 min-h-[360px]">
                <AnimatePresence mode="wait">
                  {heroMode === "personal" ? (
                    <motion.div
                      key="personal-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-5"
                    >
                      {/* Left: Interactive Daily Tasks & Routines */}
                      <div className="md:col-span-7 bg-surface-container-high/40 rounded-xl p-4 sm:p-5 border border-surface-variant/40">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-stitch-primary" />
                              Today&apos;s Focus & Routines
                            </h3>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">Click items to mark completed</p>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20">
                            {personalTasks.filter(t => t.done).length}/{personalTasks.length} Done
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {personalTasks.map(task => (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => toggleTask(task.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                                task.done
                                  ? "bg-surface-container/40 border-surface-variant/30 text-on-surface-variant"
                                  : "bg-surface-container border-surface-variant/50 text-white hover:border-stitch-primary/40"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                  task.done ? "bg-stitch-primary border-stitch-primary text-slate-950" : "border-surface-variant"
                                }`}>
                                  {task.done && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className={`text-xs font-medium truncate ${task.done ? "line-through text-on-surface-variant" : ""}`}>
                                  {task.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-on-surface-variant shrink-0 ml-2">
                                {task.time}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right: Personal Finance & Vault Previews */}
                      <div className="md:col-span-5 space-y-4">
                        {/* Money Card */}
                        <div className="bg-surface-container-high/40 rounded-xl p-4 border border-surface-variant/40">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                              Personal Net Worth
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              +12.4% MoM
                            </span>
                          </div>
                          <div className="text-xl sm:text-2xl font-bold font-mono text-white mb-2">
                            $48,250.00
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-surface-variant/30">
                            <div>
                              <span className="text-on-surface-variant block">Liquid Balance</span>
                              <span className="font-mono text-slate-200 font-semibold">$12,400.00</span>
                            </div>
                            <div>
                              <span className="text-on-surface-variant block">Monthly Inflow</span>
                              <span className="font-mono text-emerald-400 font-semibold">+$4,200.00</span>
                            </div>
                          </div>
                          <div className="mt-2.5 text-[10px] text-on-surface-variant/80 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-stitch-primary" />
                            <span>Strictly isolated to your account • Never shared with teams</span>
                          </div>
                        </div>

                        {/* Encrypted Vault Card */}
                        <div className="bg-surface-container-high/40 rounded-xl p-4 border border-surface-variant/40">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              Encrypted Vault
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              AES-256-GCM
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-white font-medium">Production API Keys & Tokens</span>
                            <span className="text-amber-400 text-[11px] font-mono">••••••••••••</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-white font-medium">Offshore Banking Credentials</span>
                            <span className="text-amber-400 text-[11px] font-mono">••••••••••••</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="team-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-5"
                    >
                      {/* Left: Team Kanban Board */}
                      <div className="md:col-span-8 bg-surface-container-high/40 rounded-xl p-4 sm:p-5 border border-surface-variant/40">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                              <FolderKanban className="w-4 h-4 text-sky-400" />
                              Engineering Workspace — Sprint 14
                            </h3>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">Role: Workspace Admin • 6 Active Collaborators</p>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            Tenant Isolated
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Column 1 */}
                          <div className="p-3 rounded-lg bg-surface-container/60 border border-surface-variant/40">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-2">
                              In Progress (2)
                            </span>
                            <div className="space-y-2">
                              <div className="p-2.5 rounded-md bg-surface-container-high border border-surface-variant/50 text-xs">
                                <p className="font-medium text-white mb-1.5">Workspace Token Revocation</p>
                                <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                                  <span>Assigned: Maya</span>
                                  <span className="text-amber-400 font-mono">High Priority</span>
                                </div>
                              </div>
                              <div className="p-2.5 rounded-md bg-surface-container-high border border-surface-variant/50 text-xs">
                                <p className="font-medium text-white mb-1.5">Cloudinary Asset Access Policy</p>
                                <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                                  <span>Assigned: Alex</span>
                                  <span className="text-sky-400 font-mono">In Review</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Column 2 */}
                          <div className="p-3 rounded-lg bg-surface-container/60 border border-surface-variant/40">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-2">
                              Completed (2)
                            </span>
                            <div className="space-y-2">
                              <div className="p-2.5 rounded-md bg-surface-container-high/60 border border-surface-variant/30 text-xs opacity-80">
                                <p className="font-medium text-white mb-1.5 line-through">Multi-tenant Schema Indexing</p>
                                <div className="flex items-center justify-between text-[10px] text-emerald-400">
                                  <span>Verified</span>
                                  <Check className="w-3 h-3" />
                                </div>
                              </div>
                              <div className="p-2.5 rounded-md bg-surface-container-high/60 border border-surface-variant/30 text-xs opacity-80">
                                <p className="font-medium text-white mb-1.5 line-through">Role Hierarchy Invariants</p>
                                <div className="flex items-center justify-between text-[10px] text-emerald-400">
                                  <span>Merged</span>
                                  <Check className="w-3 h-3" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Team Access & Members Roster */}
                      <div className="md:col-span-4 space-y-4">
                        <div className="bg-surface-container-high/40 rounded-xl p-4 border border-surface-variant/40">
                          <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                            Role Governance
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between py-1 border-b border-surface-variant/30">
                              <span className="text-slate-300">Sarah Jenkins</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20">
                                Owner
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-surface-variant/30">
                              <span className="text-slate-300">David Miller</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                Admin
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-surface-variant/30">
                              <span className="text-slate-300">Elena Rostova</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                                Member
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-slate-300">External Auditor</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                                Viewer
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-surface-variant/30 text-[10px] text-on-surface-variant flex items-center gap-1.5">
                            <FileCheck className="w-3 h-3 text-sky-400" />
                            <span>Email-bound invite verification enabled</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DUAL ARCHITECTURE: INDIVIDUAL OS VS TEAM WORKSPACES */}
      <section className="py-16 md:py-24 bg-surface-container/30 border-b border-surface-variant/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3 font-headline">
              Engineered with Two Explicit Modes
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant">
              Manageo is not a simple to-do list or an unconstrained team wiki. It is a strictly architected operating system built for both personal sovereignty and safe collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left: Personal OS Architectural Card */}
            <div className="rounded-2xl bg-surface-container/70 border border-surface-variant/50 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary mb-6">
                  <User className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-stitch-primary/10 text-stitch-primary text-xs font-semibold uppercase tracking-wider mb-2">
                  Individual Sanctuary
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  The Personal Operating System
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Your private command center for personal execution. Nothing you record in your Personal OS can ever be viewed, queried, or exported by workspace team members or platform admins.
                </p>

                <div className="space-y-3.5 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-stitch-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-semibold text-white block">Personal Finances & Net Worth</strong>
                      <span className="text-xs text-on-surface-variant">Accounts, transactions, and cash flows scoped strictly to user ID with balance invariants.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-stitch-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-semibold text-white block">AES-256-GCM Encrypted Vault</strong>
                      <span className="text-xs text-on-surface-variant">Store credentials, recovery phrases, and documents with master and per-item passwords.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-stitch-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-semibold text-white block">Routines, Habits & Time Blocks</strong>
                      <span className="text-xs text-on-surface-variant">Recurring daily routines, intelligent reminder dispatching, and priority task scheduling.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-stitch-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-semibold text-white block">Private Custom Databases</strong>
                      <span className="text-xs text-on-surface-variant">Configurable columns, relational records, and personalized dashboard blocks.</span>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/register?type=individual"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stitch-primary text-slate-950 font-semibold text-xs hover:bg-stitch-primary/90 transition-all"
              >
                <span>Get Started with Personal OS (Free)</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right: Team Workspace Architectural Card */}
            <div className="rounded-2xl bg-surface-container/70 border border-surface-variant/50 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-6">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Multi-Tenant Governance
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Secure Team Workspaces
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Shared multi-tenant workspaces where teams coordinate tasks, build shared databases, and execute workflows without compromising anyone&apos;s personal privacy.
                </p>

                <div className="space-y-3.5 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-semibold text-white block">Tenant Boundary Isolation</strong>
                      <span className="text-xs text-on-surface-variant">Explicit workspace scoping with server-enforced membership and permission verification.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-semibold text-white block">Hashed, Email-Bound Invitations</strong>
                      <span className="text-xs text-on-surface-variant">Cryptographically secure tokens validated atomically with expiration and single-use checks.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-semibold text-white block">Role Hierarchy & Invariant Protection</strong>
                      <span className="text-xs text-on-surface-variant">Owner, Admin, Member, and Viewer tiers with protections preventing accidental owner removal.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-semibold text-white block">Granular Module Permissions & Audit Trails</strong>
                      <span className="text-xs text-on-surface-variant">Module-level action toggles and actor-attributed security logging across all operations.</span>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/register?type=team_owner"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface-container-high border border-surface-variant/50 text-white font-semibold text-xs hover:bg-surface-variant/40 transition-all"
              >
                <span>Provision a Team Workspace</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* CRYPTOGRAPHIC PRIVACY & TENANT ISOLATION EXPLANATION */}
      <section className="py-16 md:py-20 bg-stitch-background border-b border-surface-variant/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/60 p-6 sm:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-surface-variant/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Cryptographic Privacy Guarantee
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    How Manageo ensures team collaboration never compromises personal data.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-stitch-primary bg-stitch-primary/5 px-3 py-1.5 rounded-lg border border-stitch-primary/20">
                <Server className="w-3.5 h-3.5" />
                <span>Zero Data Contamination</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div>
                <div className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  Financial Isolation
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Financial models (Accounts, Transactions, Invoices) are strictly constrained by <code className="text-stitch-primary font-mono text-[11px]">userId</code> at the database level and never accept workspace identifiers.
                </p>
              </div>

              <div>
                <div className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  AES-256-GCM Vault
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Vault records are encrypted using AES-256-GCM with master passphrases and isolated custom keys. Raw unencrypted credentials never touch team endpoints.
                </p>
              </div>

              <div>
                <div className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-sky-400" />
                  Tenant Boundaries
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Every workspace query is guarded by server-side verification (<code className="text-sky-400 font-mono text-[11px]">verifyWorkspaceAccess</code>) ensuring unauthorized actors cannot read cross-tenant records.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DISTINCT PRODUCT FEATURE DEMONSTRATIONS */}
      <section className="py-16 md:py-24 bg-surface-container/20 border-b border-surface-variant/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3 font-headline">
              Purpose-Built Capabilities
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant">
              Every feature in Manageo is implemented directly into the product core—not simulated with generic templates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Tasks & Routines */}
            <div className="rounded-2xl bg-surface-container/70 border border-surface-variant/40 p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary mb-4">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Tasks & Daily Routines</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  Schedule prioritized daily sprints, organize morning/evening habits, and configure debounced notifications that keep you consistent without spamming.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-variant/30 text-[11px] font-mono text-stitch-primary">
                Reminders • Recurring Cycles • Priority Matrix
              </div>
            </div>

            {/* 2. Money & Wealth */}
            <div className="rounded-2xl bg-surface-container/70 border border-surface-variant/40 p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Money & Wealth Tracking</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  Track multi-currency accounts, cash flows, and investments. Balances are calculated through mathematical invariants rather than ad-hoc state mutations.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-variant/30 text-[11px] font-mono text-emerald-400">
                Auto Reconciliation • Cash Flows • Invoicing
              </div>
            </div>

            {/* 3. Custom Databases */}
            <div className="rounded-2xl bg-surface-container/70 border border-surface-variant/40 p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Custom Databases & Views</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  Design bespoke relational databases with text, date, select, and currency fields. Organize records into customized dashboard widgets and Kanban boards.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-variant/30 text-[11px] font-mono text-purple-400">
                Custom Schemas • Column Builder • Widget Blocks
              </div>
            </div>

            {/* 4. Encrypted Vault */}
            <div className="rounded-2xl bg-surface-container/70 border border-surface-variant/40 p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Zero-Knowledge Encrypted Vault</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  Safeguard seed phrases, server credentials, and private documents with dual-layer encryption: global vault authentication plus item-specific isolated passcodes.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-variant/30 text-[11px] font-mono text-amber-400">
                AES-256-GCM • Master Lock • OTP Reset Flow
              </div>
            </div>

            {/* 5. Team Collaboration */}
            <div className="rounded-2xl bg-surface-container/70 border border-surface-variant/40 p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Team Collaboration & Access</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  Issue tokenized invitations bounded to specific recipient emails. Manage member roles with Owner, Admin, Member, and Viewer permissions, backed by audit logging.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-variant/30 text-[11px] font-mono text-sky-400">
                Email-Bound Invites • Role Matrix • Audit Trail
              </div>
            </div>

            {/* 6. Authenticated Media */}
            <div className="rounded-2xl bg-surface-container/70 border border-surface-variant/40 p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <FileKey className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Secure Authenticated Media</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  Assets and attachments uploaded to Manageo are stored with authenticated access policies and delivered via short-lived signed URLs to prevent public scraping.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-variant/30 text-[11px] font-mono text-indigo-400">
                Signed URLs • Private Storage • Orphan Cleanup
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* PRICING COMPARISON SECTION */}
      <section className="py-16 md:py-24 bg-stitch-background border-b border-surface-variant/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3 font-headline">
              Simple, Transparent Pricing
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant">
              Every tier delivers full Personal OS privacy. Scale up when you need more custom databases or team workspace collaborators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Starter Plan */}
            <div className="rounded-2xl bg-surface-container/50 border border-surface-variant/40 p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Personal & Solo Use
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Starter</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">$0</span>
                  <span className="text-xs text-on-surface-variant font-medium">/month</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                  Complete personal operating system for individuals organizing daily tasks, finances, and habits.
                </p>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Full Personal OS (Tasks, Routines, Notes)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Personal Money & AES-256 Encrypted Vault</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Up to 2 Custom Database Sections</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Up to 5 Team Workspace Members</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>100 MB Cloud Document Storage</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register?type=individual"
                className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold bg-surface-container-high border border-surface-variant/50 text-white hover:bg-surface-variant/40 transition-colors"
              >
                Start Free with Personal OS
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="rounded-2xl bg-surface-container border-2 border-stitch-primary/60 p-6 sm:p-7 flex flex-col justify-between relative shadow-xl shadow-stitch-primary/5">
              <div className="absolute -top-3 left-6">
                <span className="bg-stitch-primary text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Popular Choice
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-stitch-primary uppercase tracking-wider mb-2">
                  Power Users & Teams
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Professional</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">$3.69</span>
                  <span className="text-xs text-on-surface-variant font-medium">/month</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                  For growing teams and power users requiring expanded database capacity and member controls.
                </p>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Everything in Starter included</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Up to 10 Custom Database Sections</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Up to 10 Team Workspace Members</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Role Management (Owner, Admin, Member, Viewer)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>5 GB Cloud Document & Asset Storage</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Priority Email Support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/pricing"
                className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold bg-stitch-primary text-slate-950 hover:bg-stitch-primary/90 transition-colors shadow-sm"
              >
                Upgrade to Professional
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-2xl bg-surface-container/50 border border-surface-variant/40 p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Scale & Organizations
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Enterprise</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Custom</span>
                  <span className="text-xs text-on-surface-variant font-medium">pricing</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                  Tailored governance, dedicated infrastructure limits, and enterprise SLA assistance.
                </p>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Everything in Professional included</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Up to 100 Custom Sections</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Unlimited Workspace Members</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Advanced Access Logs & Security Audit Trails</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>50 GB Cloud Storage with Extended Retention</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-stitch-primary shrink-0" />
                    <span>Dedicated Account Representative & SLA</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/contact"
                className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold bg-surface-container-high border border-surface-variant/50 text-white hover:bg-surface-variant/40 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 md:py-28 bg-surface-container/20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-surface-container border border-surface-variant/50 text-xs font-semibold text-stitch-primary mb-5 tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for Sovereign Productivity</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 font-headline leading-tight">
            Take control of your personal systems and team collaboration.
          </h2>

          <p className="text-sm sm:text-base text-on-surface-variant max-w-xl mx-auto mb-8 leading-relaxed">
            Begin with the free Personal OS today. Zero credit card required, instant setup, and cryptographic privacy built-in from day one.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Link
              href="/register?type=individual"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-stitch-primary px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-stitch-primary/90 transition-all shadow-md active:scale-95"
            >
              <User className="w-4 h-4" />
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container border border-surface-variant/50 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-surface-container-high hover:text-white transition-all active:scale-95"
            >
              <span>Sign in to Account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
