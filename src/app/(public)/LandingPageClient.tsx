"use client";

import { useState } from "react";
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
  Bell, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Copy, 
  ChevronRight, 
  Plus, 
  Zap, 
  Laptop, 
  Smartphone,
  CheckCircle2,
  FolderKanban,
  Database,
  HelpCircle,
  ChevronDown
} from "lucide-react";

export default function LandingPageClient() {
  // Interactive Hero Demo State
  const [activeTab, setActiveTab] = useState<"personal" | "team">("personal");
  const [showBalance, setShowBalance] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, title: "08:30 AM • Morning Routine & Focus Blocks", done: true },
    { id: 2, title: "10:00 AM • Core Architecture Sprint", done: true },
    { id: 3, title: "02:30 PM • Reconcile Ledger & Invoices", done: false },
    { id: 4, title: "05:00 PM • Sync Encrypted Keys to Vault", done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const copyApiKey = () => {
    navigator.clipboard?.writeText("mg_live_948fec0389b21a");
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is my personal finance and vault data visible to team workspace members?",
      a: "Absolutely not. In Manageo, your financial ledgers (accounts, transactions) and encrypted vault items are rigidly user-owned and cryptographically isolated. Even if you share a collaborative workspace with teammates, your personal data is 100% invisible to everyone else."
    },
    {
      q: "Does Manageo work offline on mobile and desktop?",
      a: "Yes! Manageo includes a full Progressive Web App (PWA) with client-side caching. You can install it on iOS, Android, macOS, or Windows, review your daily routines offline, and changes will automatically sync when you reconnect."
    },
    {
      q: "How does the Conflict-Free Language Switcher work?",
      a: "Manageo features a headless instant translation engine between English and Filipino (Tagalog). We engineered a runtime DOM reconciliation guard that protects React from Virtual DOM mismatches, permanently blocks intrusive banners, and preserves your preference across all 83 static pages."
    },
    {
      q: "Can I invite team members and assign specific roles?",
      a: "Yes. Collaborative workspaces feature granular role-based access control (Owner, Admin, Member, Viewer). You can invite collaborators via secure tokens, organize shared task boards, and run sprints without compromising personal boundaries."
    },
    {
      q: "Is personal use really free?",
      a: "Yes! Personal workspaces and core modules (Tasks, Routines, Ledger, Ideas, Vault) are free. We believe in providing individuals with an uncompromised operating system without artificial paywalls."
    }
  ];

  return (
    <div className="w-full text-slate-200 selection:bg-sky-500/20 selection:text-sky-300 font-sans">
      
      {/* =========================================================================
          1. HERO SECTION (Inspired by employoapp.com high-contrast punchy style)
          ========================================================================= */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-32 border-b border-white/[0.08] relative overflow-hidden bg-gradient-to-b from-[#09090b] via-[#0c101a] to-[#09090b]">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-sky-500/10 blur-[140px] pointer-events-none rounded-3xl" />
        <div className="absolute -top-24 right-10 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] pointer-events-none rounded-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Top Pill / Badge */}
          <div className="flex justify-center md:justify-start mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-sky-400/20 bg-sky-500/10 backdrop-blur-md text-xs font-medium text-sky-300 shadow-sm">
              <span className="w-2 h-2 rounded-sm bg-sky-400 animate-pulse" />
              <span>Manageo 2.0 • Personal Operating System & Collaborative Team Workspaces</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Headline Column */}
            <div className="lg:col-span-7 text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold tracking-tight text-white leading-[1.08] mb-6">
                Simple <span className="text-sky-400">Personal Operating System</span> <br className="hidden sm:inline" />
                for teams <span className="inline-block px-3 py-1 rounded-xl bg-white/[0.08] border border-white/10 text-white text-3xl sm:text-4xl md:text-5xl font-semibold align-middle my-1">without</span> <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">the enterprise bloat.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mb-8 mx-auto md:mx-0">
                Attendance, daily habits, private finances, encrypted vault, and Team Workspaces in one place with Zero Data Contamination. Set up in 2 minutes, no consultant, zero spreadsheets. Free for personal use.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mb-6">
                <Link
                  href="/register?type=individual"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 px-6 py-3.5 text-sm font-semibold text-slate-950 transition-all duration-200 shadow-lg shadow-sky-400/20 group"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 px-6 py-3.5 text-sm font-medium text-slate-200 transition-all duration-200"
                >
                  <span>View Pricing</span>
                </Link>
                <Link
                  href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 px-6 py-3.5 text-sm font-medium text-slate-200 transition-all duration-200"
                >
                  <span>Contact Sales</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>AES-256-GCM encrypted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Zero Data Contamination</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Preview Card (Employo-style floating app preview) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-[#0c101a]/90 backdrop-blur-xl shadow-2xl p-5 sm:p-6 relative overflow-hidden">
                
                {/* Header Switcher: Personal vs Team */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setActiveTab("personal")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === "personal"
                          ? "bg-sky-400 text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Personal OS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("team")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === "team"
                          ? "bg-sky-400 text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Team Workspace</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
                    Live
                  </span>
                </div>

                {/* Tab 1: Personal OS Content */}
                {activeTab === "personal" ? (
                  <div className="space-y-4">
                    {/* Mini Ledger Card */}
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-sky-400" />
                          Private Net Worth
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowBalance(!showBalance)}
                          className="text-slate-400 hover:text-white transition-colors"
                          aria-label="Toggle balance visibility"
                        >
                          {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-white tracking-tight">
                          {showBalance ? "$48,920.00" : "••••••••"}
                        </span>
                        <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          +14.2% MoM
                        </span>
                      </div>
                    </div>

                    {/* Interactive Habits / Agenda Checklist */}
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          Today&apos;s Focus & Routines
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tasks.filter((t) => t.done).length}/{tasks.length} Completed
                        </span>
                      </div>
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => toggleTask(task.id)}
                            className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-all cursor-pointer text-xs"
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                task.done
                                  ? "bg-sky-400 text-slate-950"
                                  : "border border-slate-600"
                              }`}
                            >
                              {task.done && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span
                              className={`flex-1 transition-all ${
                                task.done ? "text-slate-500 line-through" : "text-slate-200"
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Encrypted Vault Item Preview */}
                    <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white flex items-center gap-1.5">
                            Stripe Production Secret
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">AES-256</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            sk_live_••••••••••••948f
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={copyApiKey}
                        className="p-1.5 rounded-lg border border-white/10 hover:bg-white/[0.06] text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{copiedKey ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Tab 2: Team Workspace Content */
                  <div className="space-y-4">
                    {/* Tenant Info Card */}
                    <div className="p-4 rounded-xl border border-sky-400/20 bg-sky-500/[0.04]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-sky-400" />
                          <span className="text-xs font-semibold text-white">Acme Corp Sprint Q4</span>
                        </div>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sky-400 text-slate-950">
                          Admin
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Isolated team tenant. Financial records & personal vault are 100% hidden.
                      </p>
                    </div>

                    {/* Shared Sprint Tasks */}
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm bg-emerald-400" />
                          <span className="text-slate-200">Deploy conflict-free language switcher</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded">
                          Done
                        </span>
                      </div>
                      <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm bg-amber-400" />
                          <span className="text-slate-200">FCM Web Push reminder test</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                          In Review
                        </span>
                      </div>
                      <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm bg-sky-400" />
                          <span className="text-slate-200">Audit multi-tenant workspace isolation</span>
                        </div>
                        <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded">
                          In Progress
                        </span>
                      </div>
                    </div>

                    {/* Team Members Stack */}
                    <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs">
                      <span className="text-slate-400">Active Collaborators</span>
                      <div className="flex items-center -space-x-1.5">
                        <div className="w-6 h-6 rounded-lg bg-sky-500 border border-[#0c101a] flex items-center justify-center text-[10px] font-bold text-white">AR</div>
                        <div className="w-6 h-6 rounded-lg bg-indigo-500 border border-[#0c101a] flex items-center justify-center text-[10px] font-bold text-white">MR</div>
                        <div className="w-6 h-6 rounded-lg bg-emerald-500 border border-[#0c101a] flex items-center justify-center text-[10px] font-bold text-white">SK</div>
                        <div className="w-6 h-6 rounded-lg bg-slate-700 border border-[#0c101a] flex items-center justify-center text-[10px] text-slate-300">+4</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          2. INFINITE MARQUEE TICKER (Employo-style vibrant ribbon)
          ========================================================================= */}
      <div className="border-y border-white/[0.08] bg-[#0c101a] py-3.5 overflow-hidden relative">
        <div className="animate-marquee whitespace-nowrap flex items-center text-xs font-medium text-slate-300 tracking-wider">
          <span className="mx-4 text-sky-400">⚡ DAILY ROUTINES</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-emerald-400">💰 SOVEREIGN LEDGER</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-indigo-400">🔐 ENCRYPTED VAULT</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-amber-400">🏢 ISOLATED WORKSPACES</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-sky-300">📊 CUSTOM DATABASES</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-rose-400">🔔 REAL-TIME PUSH REMINDERS</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-teal-400">📱 OFFLINE PWA</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-violet-400">🌐 CONFLICT-FREE TRANSLATION</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-sky-400">⚡ DAILY ROUTINES</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-emerald-400">💰 SOVEREIGN LEDGER</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-indigo-400">🔐 ENCRYPTED VAULT</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-amber-400">🏢 ISOLATED WORKSPACES</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-sky-300">📊 CUSTOM DATABASES</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-rose-400">🔔 REAL-TIME PUSH REMINDERS</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-teal-400">📱 OFFLINE PWA</span>
          <span className="mx-2 text-slate-600">•</span>
          <span className="mx-4 text-violet-400">🌐 CONFLICT-FREE TRANSLATION</span>
          <span className="mx-2 text-slate-600">•</span>
        </div>
      </div>

      {/* =========================================================================
          3. PAIN-POINT CALLOUT (Employo's "You're running HR in spreadsheets...")
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] relative bg-[#09090b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-16 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
              You&apos;re running your life & team across 5 different apps, <br className="hidden sm:inline" />
              messy spreadsheets, and <span className="text-sky-400">WhatsApp notes.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
              Someone asks for a past invoice, API credential, or project task. You search Notion, open your bank app, dig through Slack, and guess.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Box 1 */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0c101a] hover:border-white/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-6">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Built for your life, not Fortune 500 bureaucracy.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Ten tasks or ten thousand. Freelancers, software engineers, lean startup founders, and creators. People who need their systems executed cleanly, not a 3-week onboarding manual.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
                <span>Personal sovereignty first</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Box 2 */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0c101a] hover:border-white/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Just execution. Zero clunky bloat.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                No complicated relationship models nobody understands. No performance review forms that gather dust. We stay rigidly focused on daily productivity, money, and secrets.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <span>Uncluttered flow</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Box 3 */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0c101a] hover:border-white/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                We separate personal life from team sprints.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                You already have Slack or Telegram for chats. We don&apos;t try to replace your messenger; we prevent your team members from seeing your private finances or personal routine logs.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span>Strict multi-tenant walls</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Box 4 */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0c101a] hover:border-white/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Set up in 2 minutes. Not 15 meetings.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Toggle the modules you want. Set your preferred currency. Invite your team with a 1-click secure token. No demo sales call, no consultant invoice, no IT support ticket.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <span>Instant time-to-value</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          4. FEATURE SHOWCASE GRID (Employo's signature tools cards with mini-UIs)
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-gradient-to-b from-[#09090b] via-[#0c101a] to-[#09090b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-16 text-center md:text-left">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-3 block">
              Core Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Everything in one simple, modular dashboard.
            </h2>
            <p className="text-base text-slate-400">
              Each module operates independently or harmoniously together. Enable what you need, hide what you don&apos;t.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Tool Card 1: Routines */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] overflow-hidden hover:border-white/20 transition-all flex flex-col">
              <div className="h-44 bg-gradient-to-br from-sky-900/30 to-sky-600/10 flex items-center justify-center p-6 border-b border-white/[0.06]">
                {/* Mini UI Preview */}
                <div className="w-56 rounded-xl bg-[#09090b] border border-white/10 p-3 shadow-xl transform -rotate-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-sky-400 font-bold">09:00 AM</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="text-xs font-semibold text-white mb-1">Deep Work Sprints</div>
                  <div className="w-full bg-white/[0.08] h-1.5 rounded-lg overflow-hidden">
                    <div className="bg-sky-400 h-full w-3/4 rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Daily Routines & Habit Blocks</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Build recurring habits, time blocks, and accountability streaks without bloated calendar plugins.
                  </p>
                </div>
              </div>
            </div>

            {/* Tool Card 2: Sovereign Ledger */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] overflow-hidden hover:border-white/20 transition-all flex flex-col">
              <div className="h-44 bg-gradient-to-br from-emerald-900/30 to-emerald-600/10 flex items-center justify-center p-6 border-b border-white/[0.06]">
                {/* Mini UI Preview */}
                <div className="w-56 rounded-xl bg-[#09090b] border border-white/10 p-3 shadow-xl transform rotate-1">
                  <div className="text-[10px] text-slate-400">Total Checking & Cash</div>
                  <div className="text-base font-bold text-white mb-2">$32,450.00</div>
                  <div className="flex items-center justify-between text-[9px] pt-1.5 border-t border-white/[0.06]">
                    <span className="text-slate-400">Verified Balance Math</span>
                    <span className="text-emerald-400 font-bold">+18.5%</span>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Sovereign Financial Ledger</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Track income, accounts, and net worth using server-side ledger consistency. Rigidly user-owned.
                  </p>
                </div>
              </div>
            </div>

            {/* Tool Card 3: Military Vault */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] overflow-hidden hover:border-white/20 transition-all flex flex-col">
              <div className="h-44 bg-gradient-to-br from-indigo-900/30 to-indigo-600/10 flex items-center justify-center p-6 border-b border-white/[0.06]">
                {/* Mini UI Preview */}
                <div className="w-56 rounded-xl bg-[#09090b] border border-white/10 p-3 shadow-xl transform -rotate-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-1">
                      <Lock className="w-3 h-3 text-indigo-400" />
                      AWS Root Secret
                    </span>
                    <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded font-mono">GCM</span>
                  </div>
                  <div className="bg-white/[0.04] p-1.5 rounded text-[10px] font-mono text-slate-300">
                    ••••••••••••••••
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">AES-256-GCM Encrypted Vault</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Store sensitive passwords, API keys, and private attachments with isolated custom password protection.
                  </p>
                </div>
              </div>
            </div>

            {/* Tool Card 4: Tenant Workspaces */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] overflow-hidden hover:border-white/20 transition-all flex flex-col">
              <div className="h-44 bg-gradient-to-br from-amber-900/30 to-amber-600/10 flex items-center justify-center p-6 border-b border-white/[0.06]">
                {/* Mini UI Preview */}
                <div className="w-56 rounded-xl bg-[#09090b] border border-white/10 p-3 shadow-xl transform rotate-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">Acme Workspace</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">Admin</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Strict tenant isolation
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Multi-Tenant Workspaces</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Switch between Personal OS and team sprint workspaces instantly without data leakage or mixed accounts.
                  </p>
                </div>
              </div>
            </div>

            {/* Tool Card 5: Custom Databases */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] overflow-hidden hover:border-white/20 transition-all flex flex-col">
              <div className="h-44 bg-gradient-to-br from-violet-900/30 to-violet-600/10 flex items-center justify-center p-6 border-b border-white/[0.06]">
                {/* Mini UI Preview */}
                <div className="w-56 rounded-xl bg-[#09090b] border border-white/10 p-3 shadow-xl transform -rotate-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">Custom Collections</span>
                    <Database className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-[9px] bg-white/[0.06] text-slate-300 px-1.5 py-0.5 rounded">Status</span>
                    <span className="text-[9px] bg-white/[0.06] text-slate-300 px-1.5 py-0.5 rounded">Currency</span>
                    <span className="text-[9px] bg-white/[0.06] text-slate-300 px-1.5 py-0.5 rounded">Date</span>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Modular Custom Databases</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Build dynamic databases for book tracking, custom CRM, asset inventories, or sprint backlogs.
                  </p>
                </div>
              </div>
            </div>

            {/* Tool Card 6: Push & PWA */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] overflow-hidden hover:border-white/20 transition-all flex flex-col">
              <div className="h-44 bg-gradient-to-br from-rose-900/30 to-rose-600/10 flex items-center justify-center p-6 border-b border-white/[0.06]">
                {/* Mini UI Preview */}
                <div className="w-56 rounded-xl bg-[#09090b] border border-white/10 p-3 shadow-xl transform rotate-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-semibold text-white">Reminder Alert</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Daily Standup begins in 10 mins</div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Real-Time Push & Offline PWA</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Stay notified with Firebase Cloud Messaging web push on mobile and desktop, even when closed.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          5. STEP-BY-STEP "HERE'S HOW IT WORKS" (Employo's 3-step section)
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#09090b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-16 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Here&apos;s how <span className="text-sky-400">it works.</span>
            </h2>
            <p className="text-base text-slate-400">
              You&apos;re busy, so we designed Manageo to be effortless from minute one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c101a] relative">
              <div className="text-4xl font-extrabold text-sky-400/20 mb-4 font-mono">01</div>
              <h3 className="text-xl font-bold text-white mb-2">Set up in 60 seconds</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Choose your modules, select your primary currency, and configure your daily routine blocks. No credit card, no complex migration.
              </p>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-300">
                ✓ Ready out-of-the-box
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c101a] relative">
              <div className="text-4xl font-extrabold text-indigo-400/20 mb-4 font-mono">02</div>
              <h3 className="text-xl font-bold text-white mb-2">Track habits, money & secrets</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Check off routines, record transactions, and securely store sensitive vault items with client-side AES-256-GCM encryption.
              </p>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-300">
                ✓ Encrypted at rest & in transit
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c101a] relative">
              <div className="text-4xl font-extrabold text-emerald-400/20 mb-4 font-mono">03</div>
              <h3 className="text-xl font-bold text-white mb-2">Spin up team workspaces</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Invite teammates to isolated workspaces. Collaborate on sprint tasks and documentation with zero cross-contamination.
              </p>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-300">
                ✓ Role-based tenant security
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FOUNDER'S NOTE (Employo's signature elevated card)
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#0c101a] relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          <div className="rounded-3xl border border-white/10 bg-[#09090b] p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-2xl">
            {/* Gradient Top Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-bold text-sky-400 uppercase tracking-wider mb-8">
              <span className="w-2 h-2 rounded-sm bg-sky-400" />
              Founder&apos;s Note
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-8">
              Why we <span className="text-sky-400">built this.</span>
            </h2>

            <p className="text-lg sm:text-xl text-slate-200 leading-relaxed font-normal mb-6">
              We were paying for multiple fragmented SaaS subscriptions—Notion for notes, Todoist for tasks, spreadsheets for personal money, and 1Password for credentials. Every tool lived in an isolated silo, and team tools constantly invaded our personal boundaries.
            </p>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
              So we built the operating system we actually wanted: <span className="text-white font-semibold">daily routines, sovereign financial ledger, military-grade encrypted vault, and clean team workspaces</span> in one place. We are independent builders with 0 outside investors. That is why personal use is free, and why we will never sell your data or bloat the experience.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-white/[0.08]">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 border-2 border-[#09090b] flex items-center justify-center text-xs font-bold text-white">AR</div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 border-2 border-[#09090b] flex items-center justify-center text-xs font-bold text-white">SK</div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 border-2 border-[#09090b] flex items-center justify-center text-xs font-bold text-white">MR</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">— The Manageo Team</div>
                  <div className="text-xs text-slate-400">Independent builders • 0 investors</div>
                </div>
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                <span>Read our full philosophy</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FAQ ACCORDION
          ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-white/[0.08] bg-[#09090b]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2 block">
              Clear Answers
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/[0.08] bg-[#0c101a] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold text-white pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-sky-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-white/[0.04] pt-4">
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
          8. HIGH-CONVERTING BOTTOM CTA (Employo-style closing section)
          ========================================================================= */}
      <section className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-[#09090b] to-[#04060a]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Take back control of your <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">life, money, and team.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto mb-10">
            Attendance, habits, private finances, and collaborative sprints in one place. Set up in 2 minutes, free forever for personal use.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 hover:bg-sky-300 px-8 py-4 text-base font-bold text-slate-950 transition-all duration-200 shadow-xl shadow-sky-400/25 group"
            >
              <span>Start Free Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span>✓ No credit card required</span>
            <span>•</span>
            <span>✓ Instant setup in 60s</span>
            <span>•</span>
            <span>✓ 100% private data sovereignty</span>
          </div>
        </div>
      </section>

    </div>
  );
}
