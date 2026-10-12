"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Check, 
  Lock, 
  Wallet, 
  Users, 
  User, 
  Building2, 
  Calendar, 
  FolderKanban, 
  Database, 
  FileKey, 
  Play, 
  Pause,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Server,
  Layers
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function LandingPageClient() {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  // HERO ANIMATED WORKFLOW SIMULATION STATE
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Workflow steps for the hero demonstration
  const workflowSteps = [
    {
      id: 0,
      label: "01. Personal Agenda",
      subtitle: "Daily routines & time blocks",
    },
    {
      id: 1,
      label: "02. Financial Ledger",
      subtitle: "Private accounts & net worth",
    },
    {
      id: 2,
      label: "03. Workspace Switch",
      subtitle: "Instant tenant transition",
    },
    {
      id: 3,
      label: "04. Collaborative Sprint",
      subtitle: "Shared tasks & member roles",
    },
  ];

  // Auto-advance workflow demonstration
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, workflowSteps.length]);

  // Interactive Personal Tasks in Step 1
  const [tasks, setTasks] = useState([
    { id: 1, title: "Review quarterly investment allocations", time: "08:30 AM", done: true },
    { id: 2, title: "Deep work: Core architecture documentation", time: "10:00 AM", done: true },
    { id: 3, title: "Reconcile business transaction receipts", time: "02:30 PM", done: false },
    { id: 4, title: "Sync encrypted server keys to Vault", time: "05:00 PM", done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  // FEATURE: Interactive Custom Database View Switcher
  const [dbView, setDbView] = useState<"table" | "kanban" | "metrics">("table");

  // Sample database records
  const dbRecords = [
    { id: "REC-101", title: "Enterprise Contract SLA", category: "Legal", status: "Active", value: "$48,000" },
    { id: "REC-102", title: "Security Vulnerability Audit", category: "Infra", status: "In Review", value: "$12,500" },
    { id: "REC-103", title: "Database Sharding Roadmap", category: "Core", status: "Planning", value: "$32,000" },
  ];

  // FEATURE: Interactive Role Simulator
  const [simulatedRole, setSimulatedRole] = useState<"owner" | "admin" | "member" | "viewer">("member");

  return (
    <div className="w-full text-slate-200 selection:bg-sky-500/20 selection:text-sky-300 font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 border-b border-white/[0.08] relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Main Hero Header */}
          <div className="max-w-3xl mb-12 md:mb-16">
            <p className="text-xs font-mono text-sky-400 mb-3 tracking-wide">
              Manageo 2.0 • Personal OS & Collaborative Workspaces
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-6 leading-[1.08]">
              A personal operating system with real team boundaries.
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mb-8">
              Manage your private finances, encrypted vault, and daily routines with complete individual sovereignty. Switch to isolated workspaces to collaborate with your team without data cross-contamination.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/register?type=individual"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-400 px-5 py-2.5 text-xs font-medium text-slate-950 hover:bg-sky-300 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Start Personal OS (Free)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/register?type=team_owner"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.03] px-5 py-2.5 text-xs font-medium text-white hover:bg-white/[0.06] transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Create Team Workspace</span>
              </Link>
            </div>
          </div>

          {/* HERO ANIMATED PRODUCT WORKFLOW ENGINE */}
          <div className="rounded-xl border border-white/[0.1] bg-[#0c0f17] overflow-hidden shadow-2xl">
            
            {/* Window Navigation & Stepper Header */}
            <div className="border-b border-white/[0.08] bg-[#090c14] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-white/20" />
                </div>
                <span className="text-xs font-mono text-slate-400">
                  manageo.app / {activeStep < 2 ? "personal" : "workspace/acme-engineering"}
                </span>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {workflowSteps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        setActiveStep(step.id);
                        setIsPlaying(false);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                        activeStep === step.id
                          ? "bg-white/10 text-white font-medium"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {step.id + 1}
                    </button>
                  ))}
                </div>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                  title={isPlaying ? "Pause walkthrough" : "Resume walkthrough"}
                  aria-label={isPlaying ? "Pause walkthrough" : "Resume walkthrough"}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-4 border-b border-white/[0.08] text-left">
              {workflowSteps.map((step) => {
                const isActive = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setActiveStep(step.id);
                      setIsPlaying(false);
                    }}
                    className={`p-3 sm:p-4 text-left border-r border-white/[0.08] last:border-r-0 transition-colors ${
                      isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-mono ${isActive ? "text-sky-400 font-medium" : "text-slate-500"}`}>
                        {step.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate hidden md:block">
                      {step.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Live Interactive Simulation Viewport */}
            <div className="p-4 sm:p-6 lg:p-8 min-h-[380px] bg-[#0c0f17]">
              <AnimatePresence mode="wait">
                
                {/* STAGE 0: PERSONAL AGENDA */}
                {activeStep === 0 && (
                  <motion.div
                    key="step-agenda"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6"
                  >
                    <div className="md:col-span-7 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <div>
                          <h3 className="text-sm font-medium text-white">Daily Routines & Priorities</h3>
                          <p className="text-xs text-slate-400">Personal space • Interactivity active</p>
                        </div>
                        <span className="text-xs font-mono text-sky-400">
                          {tasks.filter((t) => t.done).length}/{tasks.length} Completed
                        </span>
                      </div>

                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                              task.done
                                ? "bg-white/[0.02] border-white/[0.06] text-slate-500"
                                : "bg-white/[0.04] border-white/[0.1] text-slate-200 hover:border-sky-500/30"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                                  task.done ? "bg-sky-400 border-sky-400 text-slate-950" : "border-white/20"
                                }`}
                              >
                                {task.done && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className={`text-xs truncate ${task.done ? "line-through text-slate-500" : ""}`}>
                                {task.title}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-slate-500 shrink-0 ml-3">
                              {task.time}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-5 space-y-4">
                      <div className="p-4 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                        <span className="text-xs text-slate-400 block mb-1">Consistency Streak</span>
                        <div className="text-2xl font-mono font-medium text-white mb-2">15 Days</div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Recurring morning and evening routines execute without notification spam through the debounced reminder engine.
                        </p>
                      </div>

                      <div className="p-4 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                        <span className="text-xs text-slate-400 block mb-1">Upcoming Time Block</span>
                        <div className="text-sm font-medium text-white">02:30 PM — Financial Ledger Review</div>
                        <span className="text-xs font-mono text-slate-500 mt-1 block">Scheduled: 45 minutes</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STAGE 1: FINANCIAL LEDGER & NET WORTH */}
                {activeStep === 1 && (
                  <motion.div
                    key="step-ledger"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6"
                  >
                    <div className="md:col-span-7 space-y-4">
                      <div className="p-4 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">Total Calculated Net Worth</span>
                          <span className="text-xs font-mono text-emerald-400">+8.4% this month</span>
                        </div>
                        <div className="text-3xl font-mono font-medium text-white mb-3">$48,250.00</div>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06] text-xs">
                          <div>
                            <span className="text-slate-500 block">Liquid Checking</span>
                            <span className="font-mono text-slate-300">$14,200.00</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Investment Brokerage</span>
                            <span className="font-mono text-slate-300">$34,050.00</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                        <span className="text-xs text-slate-400 block mb-2">Recent Transactions</span>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-white/[0.04]">
                            <span className="text-slate-300">Software Architecture Consulting</span>
                            <span className="font-mono text-emerald-400">+$3,500.00</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-white/[0.04]">
                            <span className="text-slate-300">Cloud Infrastructure Reserved Instances</span>
                            <span className="font-mono text-slate-400">-$420.00</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-300">Hardware Security Key Setup</span>
                            <span className="font-mono text-slate-400">-$110.00</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-5 p-5 rounded-lg border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Lock className="w-4 h-4 text-sky-400" />
                          <h4 className="text-xs font-medium text-white uppercase tracking-wider">
                            Strict Schema Isolation
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          Transactions, Accounts, and Vault items are physically isolated to the user ID. Even if you belong to multiple team workspaces, team owners and admins have zero query access to your ledger.
                        </p>
                        <div className="p-3 rounded border border-white/[0.06] bg-[#090c14] font-mono text-[11px] text-slate-400 space-y-1">
                          <p><span className="text-sky-400">SELECT</span> * FROM accounts</p>
                          <p><span className="text-sky-400">WHERE</span> userId = current_user</p>
                          <p className="text-slate-500">// workspaceId excluded by design</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs text-slate-500">
                        Balance math enforced via immutable invariants
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STAGE 2: WORKSPACE SWITCHER */}
                {activeStep === 2 && (
                  <motion.div
                    key="step-switch"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-2xl mx-auto py-4"
                  >
                    <div className="p-6 rounded-lg border border-white/[0.1] bg-[#090c14] space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                        <div>
                          <h3 className="text-sm font-medium text-white">Tenancy Context Switcher</h3>
                          <p className="text-xs text-slate-400">Selecting tenant sets secure HTTP-only active workspace cookie</p>
                        </div>
                        <span className="text-xs font-mono text-sky-400">Dual-Write Safe</span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="p-3.5 rounded-lg border border-white/[0.08] bg-white/[0.02] flex items-center justify-between opacity-60">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded border border-white/10 bg-white/[0.04] flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white">Personal Workspace</p>
                              <span className="text-[11px] text-slate-500">Private routines, money, and vault</span>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">Current Tenant</span>
                        </div>

                        <div className="p-3.5 rounded-lg border border-sky-500/40 bg-sky-500/[0.05] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded border border-sky-500/30 bg-sky-500/10 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-sky-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white">Acme Engineering Workspace</p>
                              <span className="text-[11px] text-sky-300/80">Role: Workspace Admin • 8 Collaborators</span>
                            </div>
                          </div>
                          <span className="text-xs text-sky-400 font-mono font-medium">Switching...</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed pt-2">
                        Switching workspaces dynamically updates your sidebar modules, team permissions, and project views while leaving your personal identity and records completely untouchable.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* STAGE 3: COLLABORATIVE SPRINT */}
                {activeStep === 3 && (
                  <motion.div
                    key="step-sprint"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.08] gap-2">
                      <div>
                        <h3 className="text-sm font-medium text-white">Acme Engineering — Sprint 14</h3>
                        <p className="text-xs text-slate-400">Active Tenant: Workspace #842 • All queries scoped to workspaceId</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <span>Role: Admin</span>
                        <span>•</span>
                        <span>8 Members</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Backlog */}
                      <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                        <span className="text-xs font-mono text-slate-400 block mb-2">Backlog (1)</span>
                        <div className="p-2.5 rounded border border-white/[0.06] bg-[#090c14] space-y-1">
                          <p className="text-xs font-medium text-white">Audit Log Retention Policy</p>
                          <span className="text-[11px] text-slate-500 font-mono">Assigned: Alex</span>
                        </div>
                      </div>

                      {/* In Progress */}
                      <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                        <span className="text-xs font-mono text-sky-400 block mb-2">In Progress (2)</span>
                        <div className="space-y-2">
                          <div className="p-2.5 rounded border border-white/[0.06] bg-[#090c14] space-y-1">
                            <p className="text-xs font-medium text-white">AES-256 Key Decoupling</p>
                            <span className="text-[11px] text-slate-400 font-mono">Assigned: Maya</span>
                          </div>
                          <div className="p-2.5 rounded border border-white/[0.06] bg-[#090c14] space-y-1">
                            <p className="text-xs font-medium text-white">Tokenized Invitation Flow</p>
                            <span className="text-[11px] text-slate-400 font-mono">Assigned: David</span>
                          </div>
                        </div>
                      </div>

                      {/* Done */}
                      <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                        <span className="text-xs font-mono text-emerald-400 block mb-2">Done (2)</span>
                        <div className="space-y-2 opacity-75">
                          <div className="p-2.5 rounded border border-white/[0.06] bg-[#090c14] space-y-1">
                            <p className="text-xs font-medium text-white line-through">Multi-tenant Schema Indexes</p>
                            <span className="text-[11px] text-emerald-400 font-mono">Verified in CI</span>
                          </div>
                          <div className="p-2.5 rounded border border-white/[0.06] bg-[#090c14] space-y-1">
                            <p className="text-xs font-medium text-white line-through">Owner Protection Invariants</p>
                            <span className="text-[11px] text-emerald-400 font-mono">Merged</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

        </div>
      </section>

      {/* 2. DUAL ARCHITECTURE: INDIVIDUAL OS VS TEAM WORKSPACES */}
      <section className="py-20 md:py-28 border-b border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-16">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-3">
              One architecture. Two explicit modes.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Most productivity apps fail at collaboration because they either force teams into a personal tool or force individuals into a company workspace. Manageo keeps both worlds strictly separate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Personal OS (Asymmetrical 6-col) */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-xl border border-white/[0.08] bg-[#0c0f17] space-y-6">
              <div>
                <span className="text-xs font-mono text-sky-400 block mb-2">Individual Focus</span>
                <h3 className="text-lg font-medium text-white mb-2">The Personal Operating System</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  A private, distraction-free environment for habits, routines, net worth accounting, and encrypted credentials. Nothing created here is ever exposed to team members.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-sm bg-sky-400 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-white">Daily Routines & Habit Progression</h4>
                    <p className="text-xs text-slate-400">Morning and evening checklists, streak tracking, and priority scheduling.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-sm bg-sky-400 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-white">Money & Net Worth Ledger</h4>
                    <p className="text-xs text-slate-400">Multi-currency balance math, automated cash-flow categorization, and receipt storage.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-sm bg-sky-400 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-white">Zero-Knowledge Encrypted Vault</h4>
                    <p className="text-xs text-slate-400">AES-256-GCM ciphering for server credentials, seed phrases, and private notes.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/register?type=individual"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <span>Start Free Personal Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right: Team Workspaces (Asymmetrical 6-col) */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-xl border border-white/[0.08] bg-[#0c0f17] space-y-6">
              <div>
                <span className="text-xs font-mono text-slate-400 block mb-2">Team Collaboration</span>
                <h3 className="text-lg font-medium text-white mb-2">Secure Team Workspaces</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Multi-tenant workspaces for teams to collaborate on sprint tasks, shared databases, and documentation under strict role governance.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-sm bg-white/40 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-white">Tenant Boundary Isolation</h4>
                    <p className="text-xs text-slate-400">Strict workspaceId database scoping verified on every mutation.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-sm bg-white/40 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-white">Hashed, Email-Bound Invitations</h4>
                    <p className="text-xs text-slate-400">Single-use tokens validated against recipient emails to eliminate interception.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-sm bg-white/40 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-white">Role Hierarchy & Protected Invariants</h4>
                    <p className="text-xs text-slate-400">Owner, Admin, Member, and Viewer tiers with protections preventing owner demotion.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/register?type=team_owner"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white hover:text-slate-300 transition-colors"
                >
                  <span>Set Up Team Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. PRIVACY & SECURITY ARCHITECTURAL EXPLANATION */}
      <section className="py-20 md:py-28 border-b border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-14">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-3">
              Cryptographic separation, verified at the schema layer.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              We do not rely on UI toggles to hide your private information. The database architecture enforces total isolation between your personal assets and team projects with Zero Data Contamination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0c0f17]">
              <Wallet className="w-5 h-5 text-emerald-400 mb-4" />
              <h3 className="text-sm font-medium text-white mb-2">Zero-Workspace Financial Schemas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Account and Transaction database schemas do not contain a workspaceId field. They are bound strictly to your authenticated userId at the database layer.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0c0f17]">
              <Lock className="w-5 h-5 text-amber-400 mb-4" />
              <h3 className="text-sm font-medium text-white mb-2">AES-256-GCM Encrypted Vault</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Vault credentials and secure notes are encrypted with unique initialization vectors and authentication tags. Team endpoints have no decrypt privileges.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0c0f17]">
              <Server className="w-5 h-5 text-sky-400 mb-4" />
              <h3 className="text-sm font-medium text-white mb-2">Server Gatekeeper Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every team API invocation runs verifyWorkspaceAccess before executing queries, validating session identity, active status, and action permission flags.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. PRODUCT FEATURE DEMONSTRATIONS (COMPOSED ASYMMETRICAL LAYOUTS) */}
      <section className="py-20 md:py-28 border-b border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-16">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-3">
              Purpose-built product modules.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every tool in Manageo is an integrated part of the operating system—not an external plugin or disconnected template.
            </p>
          </div>

          <div className="space-y-12">
            
            {/* FEATURE 1: CUSTOM DATABASES WITH VIEW SWITCHER */}
            <div className="p-6 sm:p-8 rounded-xl border border-white/[0.08] bg-[#0c0f17]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/[0.08] gap-4">
                <div>
                  <span className="text-xs font-mono text-sky-400 block mb-1">Custom Section Engine</span>
                  <h3 className="text-lg font-medium text-white">Relational Databases & Dynamic Views</h3>
                  <p className="text-xs text-slate-400 mt-1">Design bespoke schemas with custom column types and transform views in real-time.</p>
                </div>

                {/* View Switcher Controls */}
                <div className="flex items-center gap-1 p-1 rounded-lg border border-white/[0.08] bg-[#090c14] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setDbView("table")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                      dbView === "table" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDbView("kanban")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                      dbView === "kanban" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Kanban</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDbView("metrics")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                      dbView === "metrics" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Metrics</span>
                  </button>
                </div>
              </div>

              {/* View Output */}
              <div className="pt-6 min-h-[220px]">
                <AnimatePresence mode="wait">
                  {dbView === "table" && (
                    <motion.div
                      key="table"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="overflow-x-auto"
                    >
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06] text-slate-500 font-mono">
                            <th className="py-2.5 pr-4 font-normal">Record ID</th>
                            <th className="py-2.5 px-4 font-normal">Title</th>
                            <th className="py-2.5 px-4 font-normal">Category</th>
                            <th className="py-2.5 px-4 font-normal">Status</th>
                            <th className="py-2.5 pl-4 font-normal text-right">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {dbRecords.map((r) => (
                            <tr key={r.id} className="text-slate-300">
                              <td className="py-3 pr-4 font-mono text-slate-500">{r.id}</td>
                              <td className="py-3 px-4 font-medium text-white">{r.title}</td>
                              <td className="py-3 px-4 text-slate-400">{r.category}</td>
                              <td className="py-3 px-4">
                                <span className="font-mono text-slate-300">{r.status}</span>
                              </td>
                              <td className="py-3 pl-4 text-right font-mono text-sky-400">{r.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                  {dbView === "kanban" && (
                    <motion.div
                      key="kanban"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                      <div className="p-3 rounded-lg border border-white/[0.06] bg-[#090c14]">
                        <span className="text-xs font-mono text-slate-400 block mb-2">Planning</span>
                        <div className="p-2.5 rounded border border-white/[0.04] bg-white/[0.02] text-xs">
                          <p className="font-medium text-white">Database Sharding Roadmap</p>
                          <span className="text-slate-500 font-mono mt-1 block">$32,000</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border border-white/[0.06] bg-[#090c14]">
                        <span className="text-xs font-mono text-amber-400 block mb-2">In Review</span>
                        <div className="p-2.5 rounded border border-white/[0.04] bg-white/[0.02] text-xs">
                          <p className="font-medium text-white">Security Vulnerability Audit</p>
                          <span className="text-slate-500 font-mono mt-1 block">$12,500</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border border-white/[0.06] bg-[#090c14]">
                        <span className="text-xs font-mono text-emerald-400 block mb-2">Active</span>
                        <div className="p-2.5 rounded border border-white/[0.04] bg-white/[0.02] text-xs">
                          <p className="font-medium text-white">Enterprise Contract SLA</p>
                          <span className="text-slate-500 font-mono mt-1 block">$48,000</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {dbView === "metrics" && (
                    <motion.div
                      key="metrics"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                      <div className="p-4 rounded-lg border border-white/[0.06] bg-[#090c14]">
                        <span className="text-xs text-slate-400 block mb-1">Total Pipeline Value</span>
                        <span className="text-2xl font-mono text-white">$92,500</span>
                        <span className="text-[11px] text-slate-500 block mt-1">3 active database records</span>
                      </div>
                      <div className="p-4 rounded-lg border border-white/[0.06] bg-[#090c14]">
                        <span className="text-xs text-slate-400 block mb-1">Active Deliverables</span>
                        <span className="text-2xl font-mono text-sky-400">1</span>
                        <span className="text-[11px] text-slate-500 block mt-1">Contract SLA in execution</span>
                      </div>
                      <div className="p-4 rounded-lg border border-white/[0.06] bg-[#090c14]">
                        <span className="text-xs text-slate-400 block mb-1">Pending Review</span>
                        <span className="text-2xl font-mono text-amber-400">1</span>
                        <span className="text-[11px] text-slate-500 block mt-1">Vulnerability audit report</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* FEATURE 2: ROLE SIMULATOR & PERMISSION MATRIX */}
            <div className="p-6 sm:p-8 rounded-xl border border-white/[0.08] bg-[#0c0f17]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/[0.08] gap-4">
                <div>
                  <span className="text-xs font-mono text-sky-400 block mb-1">Access Control</span>
                  <h3 className="text-lg font-medium text-white">Role Hierarchy & Action Permissions</h3>
                  <p className="text-xs text-slate-400 mt-1">Select a role to inspect server-enforced privileges in real time.</p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-lg border border-white/[0.08] bg-[#090c14] self-start sm:self-auto">
                  {(["owner", "admin", "member", "viewer"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSimulatedRole(role)}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono capitalize transition-colors ${
                        simulatedRole === role ? "bg-white/10 text-white font-medium" : "text-slate-500 hover:text-white"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#090c14]">
                  <span className="text-slate-500 block mb-1 font-mono">Tasks: Edit/Delete</span>
                  <span className={`font-medium ${simulatedRole === "viewer" ? "text-red-400" : "text-emerald-400"}`}>
                    {simulatedRole === "viewer" ? "Denied (Read-Only)" : "Authorized"}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#090c14]">
                  <span className="text-slate-500 block mb-1 font-mono">Databases: Manage</span>
                  <span className={`font-medium ${["owner", "admin"].includes(simulatedRole) ? "text-emerald-400" : "text-red-400"}`}>
                    {["owner", "admin"].includes(simulatedRole) ? "Authorized" : "Denied"}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#090c14]">
                  <span className="text-slate-500 block mb-1 font-mono">Workspace: Settings</span>
                  <span className={`font-medium ${["owner", "admin"].includes(simulatedRole) ? "text-emerald-400" : "text-red-400"}`}>
                    {["owner", "admin"].includes(simulatedRole) ? "Authorized" : "Denied"}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#090c14]">
                  <span className="text-slate-500 block mb-1 font-mono">Workspace: Delete</span>
                  <span className={`font-medium ${simulatedRole === "owner" ? "text-emerald-400" : "text-red-400"}`}>
                    {simulatedRole === "owner" ? "Authorized" : "Owner Only"}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. PRICING SECTION (STRICTLY NO PILL BADGES OR POPULAR CAPSULES) */}
      <section className="py-20 md:py-28 border-b border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-16">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-3">
              Simple, predictable plans.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every plan includes the complete Personal OS with full cryptographic privacy. Upgrade when your team or custom databases expand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Starter Plan */}
            <div className="p-6 sm:p-7 rounded-xl border border-white/[0.08] bg-[#0c0f17] flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 block mb-1">Starter</span>
                <h3 className="text-lg font-medium text-white mb-2">Individual & Small Team</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-mono font-medium text-white">$0</span>
                  <span className="text-xs text-slate-500 font-mono">/month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Complete personal operating system for individual organization and small workspace collaboration.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-8 border-t border-white/[0.06] pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Full Personal OS (Tasks, Routines, Notes)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Personal Money & Encrypted Vault</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Up to 2 Custom Database Sections</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Up to 5 Workspace Members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>100 MB Cloud Document Storage</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register?type=individual"
                className="w-full py-2.5 px-4 rounded-lg text-center text-xs font-medium border border-white/[0.1] bg-white/[0.03] text-white hover:bg-white/[0.06] transition-colors"
              >
                Start Free with Personal OS
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-6 sm:p-7 rounded-xl border border-sky-500/40 bg-[#0c0f17] flex flex-col justify-between relative shadow-lg shadow-sky-500/[0.03]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-sky-400">Professional</span>
                  <span className="text-[11px] font-mono text-sky-400">Recommended for Teams</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Power Users & Growing Teams</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-mono font-medium text-white">$3.69</span>
                  <span className="text-xs text-slate-500 font-mono">/month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Expanded custom sections and collaborative member controls for scaling teams.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-8 border-t border-white/[0.06] pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Everything in Starter included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Up to 10 Custom Database Sections</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Up to 10 Team Workspace Members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Role Management (Owner, Admin, Member, Viewer)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>5 GB Cloud Document & Asset Storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Priority Email Support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/pricing"
                className="w-full py-2.5 px-4 rounded-lg text-center text-xs font-medium bg-sky-400 text-slate-950 hover:bg-sky-300 transition-colors"
              >
                Upgrade to Professional
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="p-6 sm:p-7 rounded-xl border border-white/[0.08] bg-[#0c0f17] flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 block mb-1">Enterprise</span>
                <h3 className="text-lg font-medium text-white mb-2">Scale & Organizations</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-mono font-medium text-white">Custom</span>
                  <span className="text-xs text-slate-500 font-mono">pricing</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Tailored workspace governance, high custom database limits, and dedicated support.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-8 border-t border-white/[0.06] pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Everything in Professional included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Up to 100 Custom Sections</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Unlimited Workspace Members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Advanced Access Logs & Security Audit Trails</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>50 GB Cloud Storage with Extended Retention</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Dedicated SLA & Account Representative</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/contact"
                className="w-full py-2.5 px-4 rounded-lg text-center text-xs font-medium border border-white/[0.1] bg-white/[0.03] text-white hover:bg-white/[0.06] transition-colors"
              >
                Contact Sales
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white mb-4">
            Build your personal system today.
          </h2>

          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Begin with the free Personal OS. No credit card required, instant setup, and cryptographic privacy built-in from day one.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register?type=individual"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-sky-400 px-6 py-2.5 text-xs font-medium text-slate-950 hover:bg-sky-300 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-6 py-2.5 text-xs font-medium text-white hover:bg-white/[0.06] transition-colors"
            >
              <span>Sign in to Account</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
