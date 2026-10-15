"use client";

import { useState, useEffect } from "react";
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
  Sliders,
  DollarSign
} from "lucide-react";

export default function LandingPageClient() {
  // ==========================================
  // SECTION 2: Hero Interactive Animation State
  // ==========================================
  const [heroMode, setHeroMode] = useState<"personal" | "team">("personal");
  const [heroTaskCompleted, setHeroTaskCompleted] = useState<boolean>(false);
  const [isHeroAutoPlaying, setIsHeroAutoPlaying] = useState<boolean>(true);

  // Automatic looping demonstration (7s cycle)
  useEffect(() => {
    if (!isHeroAutoPlaying) return;
    const interval = setInterval(() => {
      setHeroMode((prev) => (prev === "personal" ? "team" : "personal"));
    }, 7000);
    return () => clearInterval(interval);
  }, [isHeroAutoPlaying]);

  // ==========================================
  // SECTION 5: Tasks & Routines State
  // ==========================================
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

  // ==========================================
  // SECTION 6: Money & Privacy State
  // ==========================================
  const [showLedgerBalances, setShowLedgerBalances] = useState<boolean>(true);

  // ==========================================
  // SECTION 7: Custom Database State
  // ==========================================
  const [activeDatabaseView, setActiveDatabaseView] = useState<"table" | "kanban" | "list">("table");
  const [selectedRecordId, setSelectedRecordId] = useState<number>(1);

  const databaseRecords = [
    { id: 1, name: "Q4 Platform Modernization", category: "Engineering", priority: "High", status: "In Progress", date: "Oct 24, 2026" },
    { id: 2, name: "Mobile PWA Offline Sync Engine", category: "Core", priority: "Critical", status: "Review", date: "Nov 02, 2026" },
    { id: 3, name: "Stripe Billing & Invoicing Webhooks", category: "Finance", priority: "Medium", status: "Ready", date: "Nov 15, 2026" },
    { id: 4, name: "Role-Based Invitation Verification", category: "Security", priority: "High", status: "Completed", date: "Oct 12, 2026" },
  ];

  // ==========================================
  // SECTION 8: Vault & Sensitive Records State
  // ==========================================
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(false);
  const [revealedSecretId, setRevealedSecretId] = useState<number | null>(null);

  const vaultItems = [
    { id: 1, name: "AWS Production Infrastructure Keys", type: "Access Token", secret: "AKIA_9492_PROD_DEPLOY_KEY", updated: "3d ago" },
    { id: 2, name: "Primary Cold Storage Recovery Phrase", type: "Seed Words", secret: "harvest matrix orbital cascade copper", updated: "2w ago" },
    { id: 3, name: "Stripe Production Webhook Signing Key", type: "API Secret", secret: "whsec_984fbc901e8284ca902e", updated: "1m ago" },
  ];

  // ==========================================
  // SECTION 9: Team Invitations & Permissions State
  // ==========================================
  const [selectedTeammate, setSelectedTeammate] = useState<number>(1);
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah.chen@axiomixs.com",
      role: "Admin",
      modules: { tasks: true, projects: true, databases: true, files: true, settings: false }
    },
    {
      id: 2,
      name: "Marcus Brody",
      email: "marcus.b@axiomixs.com",
      role: "Member",
      modules: { tasks: true, projects: true, databases: false, files: true, settings: false }
    },
    {
      id: 3,
      name: "Elena Rostova",
      email: "elena.r@axiomixs.com",
      role: "Viewer",
      modules: { tasks: true, projects: false, databases: false, files: false, settings: false }
    }
  ]);

  const toggleTeammateModule = (memberId: number, moduleKey: "tasks" | "projects" | "databases" | "files" | "settings") => {
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, modules: { ...m.modules, [moduleKey]: !m.modules[moduleKey] } }
          : m
      )
    );
  };

  const activeMember = teamMembers.find((m) => m.id === selectedTeammate) || teamMembers[0];

  // ==========================================
  // SECTION 12: Frequently Asked Questions State
  // ==========================================
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
    <div className="w-full bg-[#F7F8F4] text-[#18211B] font-sans">

      {/* =========================================================================
          SECTION 2 — HERO: Personal Life and Team Work, One System
          ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#DFE4DC] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column (Approx 44% width on desktop) */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight text-[#18211B] leading-[1.08] mb-6">
                Your life, in order.<br />
                Your team, in sync.
              </h1>

              <p className="text-base sm:text-lg text-[#687169] leading-relaxed mb-8 max-w-lg">
                Manage your routines, personal finances, tasks, and private records in one Personal OS. Switch to a Team Workspace when it’s time to plan projects and work together.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-5">
                <Link
                  href="/register?type=individual"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-[#245A43] hover:bg-[#17392D] text-white font-medium text-sm transition-colors shadow-xs"
                >
                  Start Personal OS
                </Link>

                <a
                  href="#workspaces"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg border border-[#DFE4DC] hover:border-[#245A43] bg-white text-[#18211B] font-medium text-sm transition-colors shadow-xs"
                >
                  Explore Team Workspaces
                </a>
              </div>

              {/* Strict Privacy Invariant Note */}
              <div className="pt-2 text-xs text-[#687169] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#245A43] shrink-0" />
                <span>
                  Personal Operating System records and Team Workspaces are strictly partitioned with Zero Data Contamination.
                </span>
              </div>
            </div>

            {/* Right Column (Approx 56% width on desktop) — Custom Animated Product Interface */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-[#DFE4DC] bg-white shadow-xl overflow-hidden">
                
                {/* Browser / Application Top Bar */}
                <div className="px-4 py-3 border-b border-[#DFE4DC] bg-[#EEF1EA] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#DFE4DC]" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#DFE4DC]" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#DFE4DC]" />
                    <span className="ml-2 text-xs font-mono text-[#687169]">
                      app.manageo.io
                    </span>
                  </div>

                  {/* Context Switcher Buttons with Live State */}
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#DFE4DC]">
                    <button
                      type="button"
                      onClick={() => {
                        setHeroMode("personal");
                        setIsHeroAutoPlaying(false);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        heroMode === "personal"
                          ? "bg-[#245A43] text-white"
                          : "text-[#687169] hover:text-[#18211B]"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Personal OS
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroMode("team");
                        setIsHeroAutoPlaying(false);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        heroMode === "team"
                          ? "bg-[#245A43] text-white"
                          : "text-[#687169] hover:text-[#18211B]"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Acme Team
                    </button>
                  </div>
                </div>

                {/* Main Product Frame */}
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
                  
                  {/* Internal Sidebar Preview */}
                  <div className="md:col-span-4 p-4 border-r border-[#DFE4DC] bg-[#F7F8F4] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 px-2 py-1.5 mb-3 border border-[#DFE4DC] rounded-md bg-white">
                        <div className="w-6 h-6 rounded-md bg-[#245A43] text-white text-[11px] font-semibold flex items-center justify-center">
                          {heroMode === "personal" ? "P" : "A"}
                        </div>
                        <div className="leading-tight">
                          <p className="text-xs font-semibold text-[#18211B]">
                            {heroMode === "personal" ? "Personal OS" : "Acme Studio"}
                          </p>
                          <p className="text-[10px] text-[#687169]">
                            {heroMode === "personal" ? "Private Cockpit" : "Shared Workspace"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        {heroMode === "personal" ? (
                          <>
                            <div className="px-2.5 py-1.5 rounded-md bg-[#245A43]/10 text-[#245A43] font-medium flex items-center justify-between">
                              <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Today Focus</span>
                              <span className="text-[10px] font-mono">4</span>
                            </div>
                            <div className="px-2.5 py-1.5 rounded-md text-[#687169] hover:text-[#18211B] flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" /> Routines
                            </div>
                            <div className="px-2.5 py-1.5 rounded-md text-[#687169] hover:text-[#18211B] flex items-center gap-2">
                              <Wallet className="w-3.5 h-3.5" /> Personal Ledger
                            </div>
                            <div className="px-2.5 py-1.5 rounded-md text-[#687169] hover:text-[#18211B] flex items-center gap-2">
                              <Lock className="w-3.5 h-3.5" /> Private Vault
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="px-2.5 py-1.5 rounded-md bg-[#245A43]/10 text-[#245A43] font-medium flex items-center justify-between">
                              <span className="flex items-center gap-2"><FolderKanban className="w-3.5 h-3.5" /> Sprint Board</span>
                              <span className="text-[10px] font-mono">12</span>
                            </div>
                            <div className="px-2.5 py-1.5 rounded-md text-[#687169] hover:text-[#18211B] flex items-center gap-2">
                              <Database className="w-3.5 h-3.5" /> Team Specs
                            </div>
                            <div className="px-2.5 py-1.5 rounded-md text-[#687169] hover:text-[#18211B] flex items-center gap-2">
                              <Users className="w-3.5 h-3.5" /> Members (6)
                            </div>
                            <div className="px-2.5 py-1.5 rounded-md text-[#687169] hover:text-[#18211B] flex items-center gap-2">
                              <Settings className="w-3.5 h-3.5" /> Permissions
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#DFE4DC] text-[11px] text-[#687169] flex items-center justify-between">
                      <span>Status: Online</span>
                      <span className="text-[10px] font-mono text-[#245A43]">v2.0 Active</span>
                    </div>
                  </div>

                  {/* Content Area Preview */}
                  <div className="md:col-span-8 p-5 bg-white flex flex-col justify-between">
                    {heroMode === "personal" ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[#DFE4DC] pb-3">
                          <div>
                            <h2 className="text-sm font-semibold text-[#18211B]">
                              Today • Personal Overview
                            </h2>
                            <p className="text-xs text-[#687169]">
                              Private daily schedule & routines
                            </p>
                          </div>
                          <span className="text-xs font-mono text-[#245A43] font-medium">
                            3 of 4 Completed
                          </span>
                        </div>

                        {/* Interactive Task Rows */}
                        <div className="space-y-2">
                          <div
                            onClick={() => setHeroTaskCompleted(!heroTaskCompleted)}
                            className="p-2.5 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4] flex items-center justify-between cursor-pointer hover:border-[#245A43] transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                                heroTaskCompleted ? "bg-[#245A43] border-[#245A43] text-white" : "border-[#DFE4DC] bg-white"
                              }`}>
                                {heroTaskCompleted && <Check className="w-3 h-3" />}
                              </div>
                              <span className={`text-xs ${heroTaskCompleted ? "line-through text-[#687169]" : "text-[#18211B] font-medium"}`}>
                                09:00 AM • Review Personal Investment Portfolio
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#687169] bg-white px-2 py-0.5 rounded-md border border-[#DFE4DC]">
                              Private
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-4 h-4 rounded-md bg-[#245A43] border border-[#245A43] text-white flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </div>
                              <span className="text-xs line-through text-[#687169]">
                                07:30 AM • 45m Focused Mobility & Hydration
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#687169] bg-white px-2 py-0.5 rounded-md border border-[#DFE4DC]">
                              Routine
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-4 h-4 rounded-md bg-[#245A43] border border-[#245A43] text-white flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </div>
                              <span className="text-xs line-through text-[#687169]">
                                11:30 AM • Architecture Design Review
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#687169] bg-white px-2 py-0.5 rounded-md border border-[#DFE4DC]">
                              Deep Work
                            </span>
                          </div>
                        </div>

                        {/* Personal Finance Ledger Snapshot */}
                        <div className="p-3 rounded-lg border border-[#DFE4DC] bg-[#EEF1EA]/70 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#687169]">
                              Private Balance
                            </span>
                            <p className="text-base font-semibold text-[#18211B] font-mono">
                              $14,820.00 USD
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-[#245A43] font-medium block">
                              +2.4% this month
                            </span>
                            <span className="text-[10px] text-[#687169]">
                              Hidden from team
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[#DFE4DC] pb-3">
                          <div>
                            <h2 className="text-sm font-semibold text-[#18211B]">
                              Acme Studio • Active Sprint
                            </h2>
                            <p className="text-xs text-[#687169]">
                              Collaborative tasks & assigned milestones
                            </p>
                          </div>
                          <span className="text-xs font-mono text-[#245A43] font-medium">
                            6 Members Active
                          </span>
                        </div>

                        {/* Team Tasks */}
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2 h-2 rounded-sm bg-[#245A43]" />
                              <span className="text-xs font-medium text-[#18211B]">
                                Release v2.0 Production Deployment Pipeline
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded-md border border-[#DFE4DC]">
                                Sarah C.
                              </span>
                              <span className="text-[10px] font-medium bg-[#245A43] text-white px-2 py-0.5 rounded-md">
                                Done
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2 h-2 rounded-sm bg-[#D6EE83]" />
                              <span className="text-xs font-medium text-[#18211B]">
                                API Gateway Multi-Tenant Rate Limiting
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded-md border border-[#DFE4DC]">
                                Marcus B.
                              </span>
                              <span className="text-[10px] font-medium bg-[#EEF1EA] text-[#18211B] px-2 py-0.5 rounded-md border border-[#DFE4DC]">
                                In Review
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2 h-2 rounded-sm bg-[#DFE4DC]" />
                              <span className="text-xs font-medium text-[#18211B]">
                                Design System Editorial Typography Refresh
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded-md border border-[#DFE4DC]">
                                Elena R.
                              </span>
                              <span className="text-[10px] font-medium bg-[#EEF1EA] text-[#18211B] px-2 py-0.5 rounded-md border border-[#DFE4DC]">
                                To Do
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Member Permissions Scope Indicator */}
                        <div className="p-3 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4] flex items-center justify-between text-xs">
                          <span className="text-[#687169]">
                            Workspace Scope: <strong className="text-[#18211B]">Projects & Tasks Only</strong>
                          </span>
                          <span className="text-[10px] font-mono text-[#245A43] font-medium">
                            Private Data Isolated
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bottom Status Bar */}
                    <div className="pt-3 border-t border-[#DFE4DC] flex items-center justify-between text-[11px] text-[#687169]">
                      <span>Click to toggle tasks or switch views manually</span>
                      <button
                        type="button"
                        onClick={() => setIsHeroAutoPlaying(!isHeroAutoPlaying)}
                        className="text-[#245A43] hover:underline"
                      >
                        {isHeroAutoPlaying ? "Pause Auto Demo" : "Resume Auto Demo"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 3 — Product identity and core workflow
          ========================================================================= */}
      <section className="py-14 md:py-20 border-b border-[#DFE4DC] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#18211B] tracking-tight mb-3">
              One system for your personal life. One controlled space for team work.
            </h2>
            <p className="text-sm sm:text-base text-[#687169] leading-relaxed">
              Manageo unifies the tools you need into two deliberate domains, eliminating fragmented apps while safeguarding individual privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#DFE4DC] border-y border-[#DFE4DC]">
            
            <div className="py-8 md:px-8 first:md:pl-0">
              <span className="text-xs font-mono font-medium text-[#245A43] uppercase tracking-wider block mb-2">
                01 • Daily Focus
              </span>
              <h3 className="text-lg font-semibold text-[#18211B] mb-2">
                Organize daily life.
              </h3>
              <p className="text-sm text-[#687169] leading-relaxed">
                Build disciplined morning routines, structure your priority tasks, and track personal time blocks with a unified view of your entire day.
              </p>
            </div>

            <div className="py-8 md:px-8">
              <span className="text-xs font-mono font-medium text-[#245A43] uppercase tracking-wider block mb-2">
                02 • Cryptographic Privacy
              </span>
              <h3 className="text-lg font-semibold text-[#18211B] mb-2">
                Keep personal information private.
              </h3>
              <p className="text-sm text-[#687169] leading-relaxed">
                Personal financial balances, bank transactions, and sensitive vault records remain rigidly bound to your individual account with zero team contamination.
              </p>
            </div>

            <div className="py-8 md:px-8 last:md:pr-0">
              <span className="text-xs font-mono font-medium text-[#245A43] uppercase tracking-wider block mb-2">
                03 • Team Synchronization
              </span>
              <h3 className="text-lg font-semibold text-[#18211B] mb-2">
                Collaborate in shared workspaces.
              </h3>
              <p className="text-sm text-[#687169] leading-relaxed">
                Invite team members into distinct workspaces for client sprints and project delivery with granular role-based governance.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 4 — Personal OS versus Team Workspace (Split Screen)
          ========================================================================= */}
      <section id="workspaces" className="py-16 md:py-24 border-b border-[#DFE4DC] bg-[#F7F8F4]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#18211B] tracking-tight mb-4">
              Two distinct environments. Zero compromise.
            </h2>
            <p className="text-base text-[#687169] leading-relaxed">
              Switching between your personal sanctuary and collaborative workspaces takes one click, keeping daily focus and teamwork clearly separated.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Personal OS Side */}
            <div className="p-8 sm:p-10 rounded-2xl border border-[#DFE4DC] bg-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#245A43]/10 text-[#245A43] flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#18211B]">Your personal space.</h3>
                      <p className="text-xs text-[#687169]">Dedicated Personal Operating System</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#245A43] bg-[#245A43]/10 px-2.5 py-1 rounded-md border border-[#245A43]/20">
                    Private Only
                  </span>
                </div>

                <p className="text-sm sm:text-base text-[#687169] leading-relaxed mb-6">
                  Plan your days, manage personal finances, maintain routines, and organize your records in a workspace designed around you.
                </p>

                {/* Simulated UI Window */}
                <div className="p-4 rounded-xl border border-[#DFE4DC] bg-[#F7F8F4] space-y-3 mb-8">
                  <div className="flex items-center justify-between text-xs border-b border-[#DFE4DC] pb-2">
                    <span className="font-semibold text-[#18211B]">Personal Overview</span>
                    <span className="text-[#687169] font-mono">Today</span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 rounded-md bg-white border border-[#DFE4DC] flex items-center justify-between text-xs">
                      <span className="text-[#18211B] font-medium">Daily Habit: 30m Reading & System Review</span>
                      <span className="text-[10px] text-[#245A43] font-mono font-medium">Completed</span>
                    </div>
                    <div className="p-2 rounded-md bg-white border border-[#DFE4DC] flex items-center justify-between text-xs">
                      <span className="text-[#18211B] font-medium">Personal Finance Ledger Reconciliation</span>
                      <span className="text-[10px] text-[#687169] font-mono">Pending</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-[#687169]">
                    <span>Encrypted Vault: 14 Items Protected</span>
                    <Lock className="w-3.5 h-3.5 text-[#245A43]" />
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/register?type=individual"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#245A43] hover:bg-[#17392D] text-white font-medium text-sm transition-colors shadow-xs"
                >
                  Start Personal OS
                </Link>
              </div>
            </div>

            {/* Team Workspace Side */}
            <div className="p-8 sm:p-10 rounded-2xl border border-[#DFE4DC] bg-[#EEF1EA] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#245A43] text-white flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#18211B]">Your shared workspace.</h3>
                      <p className="text-xs text-[#687169]">Collaborative Team Workspace</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#18211B] bg-white px-2.5 py-1 rounded-md border border-[#DFE4DC]">
                    Multi-User
                  </span>
                </div>

                <p className="text-sm sm:text-base text-[#687169] leading-relaxed mb-6">
                  Bring projects, tasks, and team workflows together. Give each person the access they need without exposing private personal data.
                </p>

                {/* Simulated UI Window */}
                <div className="p-4 rounded-xl border border-[#DFE4DC] bg-white space-y-3 mb-8">
                  <div className="flex items-center justify-between text-xs border-b border-[#DFE4DC] pb-2">
                    <span className="font-semibold text-[#18211B]">Acme Studio • Active Sprints</span>
                    <span className="text-[#687169] font-mono">Sprint 24</span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 rounded-md bg-[#F7F8F4] border border-[#DFE4DC] flex items-center justify-between text-xs">
                      <span className="text-[#18211B] font-medium">Design System Review & Asset Tokens</span>
                      <span className="text-[10px] bg-[#EEF1EA] px-2 py-0.5 rounded-md text-[#18211B]">Elena R.</span>
                    </div>
                    <div className="p-2 rounded-md bg-[#F7F8F4] border border-[#DFE4DC] flex items-center justify-between text-xs">
                      <span className="text-[#18211B] font-medium">Automated E2E Regression Test Suite</span>
                      <span className="text-[10px] bg-[#EEF1EA] px-2 py-0.5 rounded-md text-[#18211B]">Marcus B.</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-[#687169]">
                    <span>Role Access: Granular Member Control</span>
                    <Users className="w-3.5 h-3.5 text-[#245A43]" />
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/register?type=team"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg border border-[#DFE4DC] hover:border-[#245A43] bg-white text-[#18211B] font-medium text-sm transition-colors shadow-xs"
                >
                  Create Team Workspace
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 5 — Tasks and Routines: A day that moves forward
          ========================================================================= */}
      <section className="py-16 md:py-24 border-b border-[#DFE4DC] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Editorial Copy */}
            <div className="lg:col-span-5">
              <span className="text-xs font-mono font-medium text-[#245A43] uppercase tracking-wider block mb-2">
                Execution Engine
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#18211B] tracking-tight mb-4">
                Make progress visible.
              </h2>
              <p className="text-base text-[#687169] leading-relaxed mb-8">
                Organize priorities, build recurring routines, and keep important tasks moving throughout the day.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-md bg-[#245A43]/10 text-[#245A43] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#18211B] mb-1">
                      Contextual timeblocking and recurring routines
                    </h3>
                    <p className="text-xs text-[#687169] leading-relaxed">
                      Habits and daily focus blocks reset predictably each morning without manual re-entry.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-md bg-[#245A43]/10 text-[#245A43] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#18211B] mb-1">
                      Real-time task state transitions
                    </h3>
                    <p className="text-xs text-[#687169] leading-relaxed">
                      Instant feedback and history logging preserve an immutable timeline of what you achieved.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-md bg-[#245A43]/10 text-[#245A43] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#18211B] mb-1">
                      Focused clarity without notification overload
                    </h3>
                    <p className="text-xs text-[#687169] leading-relaxed">
                      Clean visual indicators and scheduled digests replace invasive popups and badge anxiety.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Animated Task Interface */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl border border-[#DFE4DC] bg-[#F7F8F4] shadow-sm">
                
                {/* Progress Header */}
                <div className="flex items-center justify-between pb-5 border-b border-[#DFE4DC] mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[#18211B]">
                      Daily Focus Schedule
                    </h3>
                    <p className="text-xs text-[#687169]">
                      Click any task to toggle state and update daily progress
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-[#245A43]">
                      {progressPercent}% Complete
                    </span>
                    <div className="w-24 h-1.5 rounded-sm bg-[#DFE4DC] overflow-hidden mt-1">
                      <div 
                        className="h-full bg-[#245A43] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        task.done
                          ? "bg-white/80 border-[#DFE4DC] text-[#687169]"
                          : "bg-white border-[#DFE4DC] hover:border-[#245A43] text-[#18211B] shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            task.done
                              ? "bg-[#245A43] border-[#245A43] text-white"
                              : "border-[#DFE4DC] bg-white hover:border-[#245A43]"
                          }`}
                        >
                          {task.done && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-xs sm:text-sm ${task.done ? "line-through text-[#687169]" : "font-medium text-[#18211B]"}`}>
                          {task.title}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-[#DFE4DC] bg-[#F7F8F4] text-[#687169]">
                        {task.tag}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer cue */}
                <div className="mt-6 pt-4 border-t border-[#DFE4DC] flex items-center justify-between text-xs text-[#687169]">
                  <span>Next: 06:00 PM • Day Close & Evening Reflection</span>
                  <span className="font-mono text-[#245A43] font-medium">Scheduled</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 6 — Money and Private Information (Deep Green Surface #17392D)
          ========================================================================= */}
      <section className="py-16 md:py-24 border-b border-[#245A43] bg-[#17392D] text-[#F5F7F1]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Privacy Explanation */}
            <div className="lg:col-span-5">
              <span className="text-xs font-mono font-medium text-[#D6EE83] uppercase tracking-wider block mb-2">
                Strict Personal Isolation
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#F5F7F1] tracking-tight mb-4">
                Your personal data stays personal.
              </h2>
              <p className="text-base text-[#D6EE83]/90 leading-relaxed mb-6">
                Keep your financial records and other private information in your Personal OS, separate from shared team projects and workspace activity.
              </p>

              <div className="space-y-4 text-xs text-[#F5F7F1]/80">
                <div className="p-4 rounded-xl border border-[#245A43] bg-[#245A43]/40">
                  <h3 className="font-semibold text-white mb-1">
                    Strict userId Ownership Model
                  </h3>
                  <p className="leading-relaxed">
                    Financial models (Accounts, Transactions, Invoices) are logically blocked from Workspace memberships. Team members cannot view, query, or audit your personal finances.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#245A43] bg-[#245A43]/40">
                  <h3 className="font-semibold text-white mb-1">
                    AES-256-GCM Encrypted Storage
                  </h3>
                  <p className="leading-relaxed">
                    Sensitive notes and credential entries utilize AES-256-GCM authenticated encryption, guaranteeing tamper-proof client authorization.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Carefully Structured Finance UI Preview */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl border border-[#245A43] bg-[#1F4A3B] shadow-2xl">
                
                {/* Ledger Header */}
                <div className="flex items-center justify-between pb-5 border-b border-[#245A43] mb-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#D6EE83]">
                      Personal Financial Ledger
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      Liquid Balances & Accounts
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLedgerBalances(!showLedgerBalances)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#245A43] bg-[#17392D] text-xs font-medium text-[#F5F7F1] hover:bg-[#245A43] transition-colors"
                  >
                    {showLedgerBalances ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showLedgerBalances ? "Hide Balances" : "Show Balances"}</span>
                  </button>
                </div>

                {/* Account Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl border border-[#245A43] bg-[#17392D]/70">
                    <span className="text-xs text-[#D6EE83]">Primary Operations</span>
                    <p className="text-lg font-semibold text-white font-mono mt-1">
                      {showLedgerBalances ? "$12,450.80" : "••••••••"}
                    </p>
                    <span className="text-[10px] text-[#A3B899]">Business Checking • Chase</span>
                  </div>

                  <div className="p-4 rounded-xl border border-[#245A43] bg-[#17392D]/70">
                    <span className="text-xs text-[#D6EE83]">High-Yield Reserves</span>
                    <p className="text-lg font-semibold text-white font-mono mt-1">
                      {showLedgerBalances ? "$38,200.00" : "••••••••"}
                    </p>
                    <span className="text-[10px] text-[#A3B899]">4.75% APY • Treasury Vault</span>
                  </div>
                </div>

                {/* Recent Entries */}
                <div className="space-y-2 mb-6">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A3B899] block mb-1">
                    Recent Verified Transactions
                  </span>

                  <div className="p-2.5 rounded-lg border border-[#245A43] bg-[#17392D]/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-white">Retainer Invoice #1042 Payment</p>
                      <p className="text-[10px] text-[#A3B899]">Client Work • Direct Deposit</p>
                    </div>
                    <span className="font-mono text-[#D6EE83] font-medium">
                      {showLedgerBalances ? "+$4,800.00" : "••••••"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[#245A43] bg-[#17392D]/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-white">AWS Cloud Services Monthly</p>
                      <p className="text-[10px] text-[#A3B899]">Infrastructure • Card 4912</p>
                    </div>
                    <span className="font-mono text-white/90 font-medium">
                      {showLedgerBalances ? "-$342.18" : "••••••"}
                    </span>
                  </div>
                </div>

                {/* Visible Security Boundary Tag */}
                <div className="pt-4 border-t border-[#245A43] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#D6EE83]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Cryptographic Boundary: Strictly userId-bound</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#A3B899]">
                    Zero Data Contamination Guaranteed
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 7 — Custom Databases
          ========================================================================= */}
      <section className="py-16 md:py-24 border-b border-[#DFE4DC] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <span className="text-xs font-mono font-medium text-[#245A43] uppercase tracking-wider block mb-2">
                Relational Flexibility
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#18211B] tracking-tight mb-3">
                Shape your workspace around the way you work.
              </h2>
              <p className="text-base text-[#687169] leading-relaxed">
                Create custom sections, organize records, choose the fields you need, and build views that fit your workflow.
              </p>
            </div>

            {/* View Switchers */}
            <div className="flex items-center gap-1.5 p-1 bg-[#EEF1EA] rounded-lg border border-[#DFE4DC] self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setActiveDatabaseView("table")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeDatabaseView === "table" ? "bg-white text-[#18211B] shadow-xs" : "text-[#687169] hover:text-[#18211B]"
                }`}
              >
                Table View
              </button>
              <button
                type="button"
                onClick={() => setActiveDatabaseView("kanban")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeDatabaseView === "kanban" ? "bg-white text-[#18211B] shadow-xs" : "text-[#687169] hover:text-[#18211B]"
                }`}
              >
                Kanban Cards
              </button>
              <button
                type="button"
                onClick={() => setActiveDatabaseView("list")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeDatabaseView === "list" ? "bg-white text-[#18211B] shadow-xs" : "text-[#687169] hover:text-[#18211B]"
                }`}
              >
                Simple List
              </button>
            </div>
          </div>

          {/* Database Demonstration Table */}
          <div className="rounded-xl border border-[#DFE4DC] bg-white shadow-sm overflow-hidden">
            
            <div className="px-5 py-3 border-b border-[#DFE4DC] bg-[#F7F8F4] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#245A43]" />
                <span className="font-semibold text-[#18211B]">Engineering Roadmap & Deliverables</span>
                <span className="text-[#687169]">({databaseRecords.length} records)</span>
              </div>
              <div className="flex items-center gap-3 text-[#687169]">
                <span>Filter: All Active</span>
                <span>•</span>
                <span>Sort: Due Date (Asc)</span>
              </div>
            </div>

            {activeDatabaseView === "table" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EEF1EA]/60 text-[#687169] border-b border-[#DFE4DC] font-medium">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-[#18211B]">Record Name</th>
                      <th className="py-3 px-4 font-semibold text-[#18211B]">Category</th>
                      <th className="py-3 px-4 font-semibold text-[#18211B]">Priority</th>
                      <th className="py-3 px-4 font-semibold text-[#18211B]">Status</th>
                      <th className="py-3 px-4 font-semibold text-[#18211B]">Target Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFE4DC]">
                    {databaseRecords.map((record) => (
                      <tr 
                        key={record.id}
                        onClick={() => setSelectedRecordId(record.id)}
                        className={`hover:bg-[#F7F8F4] cursor-pointer transition-colors ${
                          selectedRecordId === record.id ? "bg-[#245A43]/5" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-[#18211B]">
                          {record.name}
                        </td>
                        <td className="py-3 px-4 text-[#687169]">
                          <span className="px-2 py-0.5 rounded-md border border-[#DFE4DC] bg-[#F7F8F4] text-[11px]">
                            {record.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-mono ${
                            record.priority === "Critical" ? "text-red-700 font-semibold" :
                            record.priority === "High" ? "text-amber-800 font-medium" : "text-[#687169]"
                          }`}>
                            {record.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            record.status === "Completed" ? "bg-[#245A43] text-white" :
                            record.status === "In Progress" ? "bg-[#245A43]/15 text-[#245A43]" : "bg-[#EEF1EA] text-[#18211B]"
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#687169]">
                          {record.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeDatabaseView === "kanban" && (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F7F8F4]">
                <div className="p-3 rounded-lg border border-[#DFE4DC] bg-white">
                  <p className="text-xs font-semibold text-[#18211B] mb-3 pb-2 border-b border-[#DFE4DC]">Ready / Planned (1)</p>
                  <div className="p-3 rounded-md border border-[#DFE4DC] bg-[#F7F8F4] text-xs">
                    <p className="font-medium text-[#18211B]">Stripe Billing & Invoicing Webhooks</p>
                    <span className="text-[10px] text-[#687169] mt-1 block">Due Nov 15</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-[#DFE4DC] bg-white">
                  <p className="text-xs font-semibold text-[#18211B] mb-3 pb-2 border-b border-[#DFE4DC]">In Progress (2)</p>
                  <div className="space-y-2">
                    <div className="p-3 rounded-md border border-[#DFE4DC] bg-[#F7F8F4] text-xs">
                      <p className="font-medium text-[#18211B]">Q4 Platform Modernization</p>
                      <span className="text-[10px] text-[#687169] mt-1 block">Due Oct 24</span>
                    </div>
                    <div className="p-3 rounded-md border border-[#DFE4DC] bg-[#F7F8F4] text-xs">
                      <p className="font-medium text-[#18211B]">Mobile PWA Offline Sync Engine</p>
                      <span className="text-[10px] text-[#687169] mt-1 block">Due Nov 02</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-[#DFE4DC] bg-white">
                  <p className="text-xs font-semibold text-[#18211B] mb-3 pb-2 border-b border-[#DFE4DC]">Completed (1)</p>
                  <div className="p-3 rounded-md border border-[#DFE4DC] bg-[#F7F8F4] text-xs">
                    <p className="font-medium text-[#18211B]">Role-Based Invitation Verification</p>
                    <span className="text-[10px] text-[#245A43] font-medium mt-1 block">Shipped Oct 12</span>
                  </div>
                </div>
              </div>
            )}

            {activeDatabaseView === "list" && (
              <div className="p-4 divide-y divide-[#DFE4DC]">
                {databaseRecords.map((record) => (
                  <div key={record.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-[#18211B]">{record.name}</span>
                      <span className="text-[#687169] ml-2">({record.category})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#687169]">{record.date}</span>
                      <span className="px-2 py-0.5 rounded-md border border-[#DFE4DC] text-[11px]">{record.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom details of selected record */}
            <div className="px-5 py-3 border-t border-[#DFE4DC] bg-[#EEF1EA]/50 flex items-center justify-between text-xs text-[#687169]">
              <span>Selected Schema: <strong>Custom Section • Text, Select, Date, User</strong></span>
              <span className="text-[#245A43] font-medium">Click rows to inspect properties</span>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 8 — Vault and Sensitive Records
          ========================================================================= */}
      <section className="py-16 md:py-24 border-b border-[#DFE4DC] bg-[#F7F8F4]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Security Narrative */}
            <div className="lg:col-span-5">
              <span className="text-xs font-mono font-medium text-[#245A43] uppercase tracking-wider block mb-2">
                Zero-Knowledge Boundary
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#18211B] tracking-tight mb-4">
                Keep sensitive information under control.
              </h2>
              <p className="text-base text-[#687169] leading-relaxed mb-6">
                Organize credentials, private documents, and other sensitive records with the access controls available in your Manageo Vault.
              </p>

              <div className="space-y-3 text-xs text-[#687169]">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-[#245A43]/10 text-[#245A43] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <p>
                    <strong>AES-256-GCM Encrypted:</strong> All payload items are encrypted before transport and can only be decrypted with your verified session.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-[#245A43]/10 text-[#245A43] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <p>
                    <strong>Granular Item Passwords:</strong> In addition to your global master password, set isolated custom passwords for ultra-sensitive keys.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-[#245A43]/10 text-[#245A43] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <p>
                    <strong>Non-Shared Privacy:</strong> Vault items cannot be mapped or shared into Team Workspaces.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Realistic Vault UI Interface */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl border border-[#DFE4DC] bg-white shadow-sm">
                
                <div className="flex items-center justify-between pb-4 border-b border-[#DFE4DC] mb-5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#245A43]" />
                    <h3 className="text-sm font-semibold text-[#18211B]">
                      Manageo Vault • Encrypted Store
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVaultLocked(!isVaultLocked)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-[#DFE4DC] bg-[#F7F8F4] text-xs font-medium text-[#18211B] hover:bg-[#EEF1EA] transition-colors"
                  >
                    {isVaultLocked ? <Unlock className="w-3.5 h-3.5 text-[#245A43]" /> : <Lock className="w-3.5 h-3.5 text-[#245A43]" />}
                    <span>{isVaultLocked ? "Unlock Vault" : "Lock Vault"}</span>
                  </button>
                </div>

                {isVaultLocked ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[#EEF1EA] text-[#245A43] flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-[#18211B]">
                      Vault is Locked with AES-256-GCM
                    </p>
                    <p className="text-xs text-[#687169] max-w-xs mx-auto">
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
                          className="p-3.5 rounded-xl border border-[#DFE4DC] bg-[#F7F8F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#18211B]">{item.name}</span>
                              <span className="text-[10px] font-mono text-[#687169] bg-white px-2 py-0.5 rounded-md border border-[#DFE4DC]">
                                {item.type}
                              </span>
                            </div>
                            <p className="font-mono text-[#687169] mt-1">
                              {isRevealed ? item.secret : "••••••••••••••••••••••••••••••"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setRevealedSecretId(isRevealed ? null : item.id)}
                              className="px-2.5 py-1 rounded-md border border-[#DFE4DC] bg-white text-[#18211B] hover:bg-[#EEF1EA] transition-colors"
                            >
                              {isRevealed ? "Hide" : "Reveal"}
                            </button>
                            <span className="text-[10px] text-[#687169] font-mono">
                              {item.updated}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-5 pt-3 border-t border-[#DFE4DC] flex items-center justify-between text-[11px] text-[#687169]">
                  <span>Encryption: AES-256-GCM Authenticated Cipher</span>
                  <span className="text-[#245A43] font-medium">Isolated from Workspaces</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 9 — Team Invitations and Permissions
          ========================================================================= */}
      <section className="py-16 md:py-24 border-b border-[#DFE4DC] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Permissions Overview */}
            <div className="lg:col-span-5">
              <span className="text-xs font-mono font-medium text-[#245A43] uppercase tracking-wider block mb-2">
                Team Governance
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#18211B] tracking-tight mb-4">
                Give every teammate the right access.
              </h2>
              <p className="text-base text-[#687169] leading-relaxed mb-6">
                Invite people to a workspace, assign responsibilities, and control which workspace features and actions they can use.
              </p>

              <div className="space-y-3 text-xs text-[#687169]">
                <div className="p-3 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4]">
                  <strong className="text-[#18211B] block mb-0.5">Cryptographic Invitation Tokens</strong>
                  Invite collaborators via unique invitation hashes. Members accept invitations with their own independent login credentials.
                </div>
                <div className="p-3 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4]">
                  <strong className="text-[#18211B] block mb-0.5">Configurable Module Scope</strong>
                  Enable or restrict access per module (Tasks, Projects, Custom Databases, Files, Settings).
                </div>
                <div className="p-3 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4]">
                  <strong className="text-[#18211B] block mb-0.5">Absolute Personal Protection</strong>
                  Team permissions never apply to personal Money or private Vault records.
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Member Management UI */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl border border-[#DFE4DC] bg-[#F7F8F4] shadow-sm">
                
                <div className="flex items-center justify-between pb-4 border-b border-[#DFE4DC] mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-[#18211B]">
                      Acme Studio • Member Permissions
                    </h3>
                    <p className="text-xs text-[#687169]">
                      Select a teammate to review and configure module access
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#245A43] font-medium">
                    3 Active Members
                  </span>
                </div>

                {/* Teammate Selector Tabs */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedTeammate(member.id)}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        selectedTeammate === member.id
                          ? "bg-white border-[#245A43] shadow-xs"
                          : "bg-white/60 border-[#DFE4DC] hover:border-[#687169]"
                      }`}
                    >
                      <p className="text-xs font-semibold text-[#18211B] truncate">{member.name}</p>
                      <span className="text-[10px] text-[#687169] block">{member.role}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Member Active Controls */}
                <div className="p-4 rounded-xl border border-[#DFE4DC] bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-[#DFE4DC] pb-3">
                    <div>
                      <span className="text-xs font-semibold text-[#18211B]">{activeMember.name}</span>
                      <p className="text-[11px] text-[#687169]">{activeMember.email}</p>
                    </div>
                    <span className="text-xs font-mono text-[#245A43] bg-[#245A43]/10 px-2.5 py-1 rounded-md border border-[#245A43]/20">
                      Role: {activeMember.role}
                    </span>
                  </div>

                  {/* Toggleable Permissions */}
                  <div className="space-y-2 text-xs">
                    <p className="text-[11px] font-semibold text-[#687169] uppercase tracking-wider">
                      Module Access Permissions
                    </p>

                    <div className="flex items-center justify-between p-2 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4]">
                      <span className="font-medium text-[#18211B]">Workspace Tasks</span>
                      <button
                        type="button"
                        onClick={() => toggleTeammateModule(activeMember.id, "tasks")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          activeMember.modules.tasks ? "bg-[#245A43] text-white" : "bg-[#DFE4DC] text-[#687169]"
                        }`}
                      >
                        {activeMember.modules.tasks ? "Allowed" : "Restricted"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4]">
                      <span className="font-medium text-[#18211B]">Shared Projects</span>
                      <button
                        type="button"
                        onClick={() => toggleTeammateModule(activeMember.id, "projects")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          activeMember.modules.projects ? "bg-[#245A43] text-white" : "bg-[#DFE4DC] text-[#687169]"
                        }`}
                      >
                        {activeMember.modules.projects ? "Allowed" : "Restricted"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4]">
                      <span className="font-medium text-[#18211B]">Custom Databases</span>
                      <button
                        type="button"
                        onClick={() => toggleTeammateModule(activeMember.id, "databases")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          activeMember.modules.databases ? "bg-[#245A43] text-white" : "bg-[#DFE4DC] text-[#687169]"
                        }`}
                      >
                        {activeMember.modules.databases ? "Allowed" : "Restricted"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg border border-[#DFE4DC] bg-[#F7F8F4]">
                      <span className="font-medium text-[#18211B]">File Attachments</span>
                      <button
                        type="button"
                        onClick={() => toggleTeammateModule(activeMember.id, "files")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          activeMember.modules.files ? "bg-[#245A43] text-white" : "bg-[#DFE4DC] text-[#687169]"
                        }`}
                      >
                        {activeMember.modules.files ? "Allowed" : "Restricted"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#DFE4DC] text-[11px] text-[#687169] flex items-center justify-between">
                    <span>Changes take effect on next tenant sync</span>
                    <span className="text-[#245A43] font-medium">Owner Verified</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 10 — How Manageo Works (Numbered Horizontal Sequence)
          ========================================================================= */}
      <section id="how-it-works" className="py-16 md:py-24 border-b border-[#DFE4DC] bg-[#EEF1EA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="mb-12 max-w-2xl">
            <span className="text-xs font-mono font-medium text-[#245A43] uppercase tracking-wider block mb-2">
              Implementation Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#18211B] tracking-tight mb-3">
              How Manageo works.
            </h2>
            <p className="text-base text-[#687169] leading-relaxed">
              From your initial morning schedule to collaborative project delivery, Manageo scales naturally with your operational needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-8 rounded-2xl border border-[#DFE4DC] bg-white shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-2xl font-mono font-bold text-[#245A43] block mb-4">
                  01
                </span>
                <h3 className="text-lg font-semibold text-[#18211B] mb-2">
                  Set up your Personal OS or create a Team Workspace.
                </h3>
                <p className="text-sm text-[#687169] leading-relaxed">
                  Start in your private sanctuary for personal routines, finances, and focus, or initiate a team workspace for collaborative client projects.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#DFE4DC] text-xs font-mono text-[#687169]">
                Zero setup friction
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-[#DFE4DC] bg-white shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-2xl font-mono font-bold text-[#245A43] block mb-4">
                  02
                </span>
                <h3 className="text-lg font-semibold text-[#18211B] mb-2">
                  Organize tasks, routines, and the appropriate workspace records.
                </h3>
                <p className="text-sm text-[#687169] leading-relaxed">
                  Structure your day with recurring morning schedules, log priority tasks, and build flexible custom database sections tailored to your workflow.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#DFE4DC] text-xs font-mono text-[#687169]">
                Continuous clarity
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-[#DFE4DC] bg-white shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-2xl font-mono font-bold text-[#245A43] block mb-4">
                  03
                </span>
                <h3 className="text-lg font-semibold text-[#18211B] mb-2">
                  Invite teammates and manage access as your collaboration grows.
                </h3>
                <p className="text-sm text-[#687169] leading-relaxed">
                  Issue secure invitation tokens and configure granular permissions while keeping private personal data completely isolated.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#DFE4DC] text-xs font-mono text-[#687169]">
                Granular governance
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 11 — Pricing (Strict Non-Negotiable Requirements: No Popular Badges)
          ========================================================================= */}
      <section id="pricing" className="py-16 md:py-24 border-b border-[#DFE4DC] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono font-medium text-[#245A43] uppercase tracking-wider block mb-2">
              Transparent Investment
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#18211B] tracking-tight mb-4">
              Clear, predictable pricing for individuals and teams.
            </h2>
            <p className="text-base text-[#687169] leading-relaxed">
              Every plan includes our complete Personal Operating System. Choose the capacity and team limits that match your collaboration needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* Starter Plan ($0/month) */}
            <div className="p-8 rounded-2xl border border-[#DFE4DC] bg-[#F7F8F4] flex flex-col justify-between shadow-xs">
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-[#18211B]">Starter</h3>
                  <p className="text-xs text-[#687169] mt-1">
                    For individuals organizing daily productivity and personal systems.
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-[#DFE4DC]">
                  <span className="text-4xl font-semibold text-[#18211B] font-mono">$0</span>
                  <span className="text-xs text-[#687169] ml-1.5">/ month</span>
                </div>

                <div className="space-y-3 text-xs mb-8">
                  <p className="font-semibold text-[#18211B] uppercase tracking-wider text-[11px]">
                    Included Capabilities
                  </p>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Full Personal Operating System</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>2 Custom Sections & Databases</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Up to 5 Team Workspace Members</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Daily Habits & Focus Blocks</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Private Financial Ledger</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>AES-256-GCM Encrypted Vault</span>
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/register?type=individual"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg border border-[#DFE4DC] hover:border-[#245A43] bg-white text-[#18211B] font-medium text-sm transition-colors shadow-xs"
                >
                  Start with Starter
                </Link>
              </div>
            </div>

            {/* Pro Plan ($3.69/month) */}
            <div className="p-8 rounded-2xl border-2 border-[#245A43] bg-white flex flex-col justify-between shadow-md relative">
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-[#18211B]">Pro</h3>
                  <p className="text-xs text-[#687169] mt-1">
                    For operators and teams demanding expanded database capacity and analytics.
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-[#DFE4DC]">
                  <span className="text-4xl font-semibold text-[#18211B] font-mono">$3.69</span>
                  <span className="text-xs text-[#687169] ml-1.5">/ month</span>
                </div>

                <div className="space-y-3 text-xs mb-8">
                  <p className="font-semibold text-[#18211B] uppercase tracking-wider text-[11px]">
                    Everything in Starter, plus:
                  </p>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Up to 10 Custom Sections & Databases</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Up to 10 Team Workspace Members</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Advanced Productivity & Execution Trends</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Expanded File & Cloudinary Attachment Storage</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Priority Push & Notification Dispatch</span>
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/pricing"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#245A43] hover:bg-[#17392D] text-white font-medium text-sm transition-colors shadow-xs"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>

            {/* Enterprise Plan (Custom pricing) */}
            <div className="p-8 rounded-2xl border border-[#DFE4DC] bg-[#F7F8F4] flex flex-col justify-between shadow-xs">
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-[#18211B]">Enterprise</h3>
                  <p className="text-xs text-[#687169] mt-1">
                    For multi-team organizations requiring custom tenancy and dedicated support.
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-[#DFE4DC]">
                  <span className="text-4xl font-semibold text-[#18211B] font-mono">Custom</span>
                  <span className="text-xs text-[#687169] ml-1.5">/ organization</span>
                </div>

                <div className="space-y-3 text-xs mb-8">
                  <p className="font-semibold text-[#18211B] uppercase tracking-wider text-[11px]">
                    Everything in Pro, plus:
                  </p>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Up to 100 Custom Sections & Databases</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Custom Workspace Member Allocations</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Dedicated SLA & Support Engineer</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Custom Onboarding & Database Migration</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#18211B]">
                    <Check className="w-4 h-4 text-[#245A43] shrink-0" />
                    <span>Custom Audit Logs & Compliance Verification</span>
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/contact"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg border border-[#DFE4DC] hover:border-[#245A43] bg-white text-[#18211B] font-medium text-sm transition-colors shadow-xs"
                >
                  Contact Sales
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          SECTION 12 — Frequently Asked Questions (Accordion)
          ========================================================================= */}
      <section id="faq" className="py-16 md:py-24 border-b border-[#DFE4DC] bg-[#F7F8F4]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-medium text-[#245A43] uppercase tracking-wider block mb-2">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#18211B] tracking-tight mb-3">
              Frequently asked questions.
            </h2>
            <p className="text-base text-[#687169]">
              Everything you need to know about Manageo's architecture, tenancy, and privacy model.
            </p>
          </div>

          <div className="divide-y divide-[#DFE4DC] border-y border-[#DFE4DC] bg-white rounded-xl shadow-xs overflow-hidden">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <span className="text-sm sm:text-base font-semibold text-[#18211B]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#687169] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-[#245A43]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#687169] leading-relaxed border-t border-[#DFE4DC]/50 bg-[#F7F8F4]/50">
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
          SECTION 13 — Final CTA
          ========================================================================= */}
      <section className="py-20 md:py-28 bg-[#17392D] text-[#F5F7F1]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-3xl sm:text-5xl font-semibold text-[#F5F7F1] tracking-tight mb-5">
            Make space for better work.
          </h2>

          <p className="text-base sm:text-lg text-[#D6EE83]/90 leading-relaxed max-w-2xl mx-auto mb-10">
            Bring your daily priorities and team collaboration into one organized system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?type=individual"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-[#D6EE83] hover:bg-[#c2dc6e] text-[#17392D] font-semibold text-sm transition-colors shadow-xs"
            >
              Start Personal OS
            </Link>

            <Link
              href="/register?type=team"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-lg border border-[#245A43] hover:border-[#D6EE83] bg-[#245A43]/50 text-white font-medium text-sm transition-colors shadow-xs"
            >
              Create Team Workspace
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
