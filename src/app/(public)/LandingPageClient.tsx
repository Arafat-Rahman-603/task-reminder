"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  Zap, 
  Target, 
  FolderSync, 
  Layout, 
  Database, 
  Workflow, 
  Check, 
  Users, 
  User, 
  Lock, 
  Wallet, 
  Building2, 
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="w-full text-slate-100 selection:bg-stitch-primary/20 selection:text-stitch-primary">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-20 md:pb-24 border-b border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-stitch-primary/10 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Release Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stitch-surface-container border border-white/10 text-xs font-medium text-slate-300 mb-6 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-stitch-primary" />
            <span>Manageo 2.0 • Personal OS & Team Collaboration</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5 font-headline leading-tight"
          >
            One unified system for your <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-stitch-primary via-indigo-400 to-sky-300">
              personal life and team work.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-2xl text-base sm:text-lg text-slate-400 mb-8 leading-relaxed"
          >
            Manage daily routines, private finances, and encrypted vaults in your Personal OS—or switch to collaborative Team Workspaces with full tenant isolation.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto"
          >
            <Link 
              href="/register?type=individual" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-stitch-primary px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md hover:bg-stitch-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <User className="w-4 h-4" />
              <span>Start Personal OS (Free)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/register?type=team_owner" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>Create Team Workspace</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Dual Experience: Individual vs Team Section */}
      <section className="py-16 md:py-20 bg-stitch-surface/60 border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3 font-headline">
              Tailored for Individual Focus & Team Productivity
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Choose the exact experience you need. Keep private data separate from workspace collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Individual OS Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl bg-stitch-surface-container/60 border border-white/10 p-6 sm:p-7 relative overflow-hidden backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary mb-4">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Individual Personal OS</h3>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                A private operating system built for your personal habits, finances, tasks, and private records. No team distractions, no external visibility.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 mb-6">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-stitch-primary shrink-0" />
                  <span>Personal Tasks, daily routines & recurring habits</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-stitch-primary shrink-0" />
                  <span>Private Money module: accounts, cash flows & net worth</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-stitch-primary shrink-0" />
                  <span>Encrypted Vault for passwords, documents & credentials</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-stitch-primary shrink-0" />
                  <span>Custom sections with tailored databases and views</span>
                </li>
              </ul>
              <Link 
                href="/register?type=individual" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stitch-primary hover:text-stitch-primary/80 transition-colors"
              >
                Create Individual Account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* Team Workspace Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl bg-stitch-surface-container/60 border border-white/10 p-6 sm:p-7 relative overflow-hidden backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Team Workspaces & Collaboration</h3>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                Shared multi-tenant workspaces where team members collaborate on projects, sprints, and shared workflows with role-based access.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 mb-6">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Team Workspace switching with tenant isolation</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Roles & permissions: Owner, Admin, Member, Viewer</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Secure tokenized invitations with expiration and limits</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Workspace rename, archive, and safe deletion management</span>
                </li>
              </ul>
              <Link 
                href="/register?type=team_owner" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                Set Up Team Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Strict Privacy Guarantee Section */}
      <section className="py-14 sm:py-16 bg-slate-950/80 border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-stitch-primary/10 via-stitch-surface-container to-indigo-500/10 border border-stitch-primary/20 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-stitch-primary/20 border border-stitch-primary/30 flex items-center justify-center text-stitch-primary shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Strict Personal Privacy & Encryption
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                Your <strong>Money accounts, investments, transactions, and Vault items</strong> are strictly isolated to your user ID. Even when collaborating inside a Team Workspace, team owners and members cannot see, query, or manage your personal financial data or encrypted credentials.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-stitch-primary" /> AES-256-GCM Vault Encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-stitch-primary" /> Tenant Boundary Isolation
                </span>
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-stitch-primary" /> Zero Shared Financial Visibility
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 md:py-20 bg-stitch-surface/40 border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3 font-headline">
              Designed for Daily Execution
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Everything you need to plan your days, organize projects, and maintain control.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="rounded-xl bg-stitch-surface-container/50 border border-white/5 p-5 hover:border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-stitch-primary/10 flex items-center justify-center text-stitch-primary mb-3.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Tasks & Routines</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prioritized daily schedules, recurring morning/evening habits, and reminders that keep you focused.
              </p>
            </div>

            <div className="rounded-xl bg-stitch-surface-container/50 border border-white/5 p-5 hover:border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3.5">
                <Target className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Money & Wealth</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track personal accounts, cashflows, and investment growth with automated net worth calculation.
              </p>
            </div>

            <div className="rounded-xl bg-stitch-surface-container/50 border border-white/5 p-5 hover:border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3.5">
                <FolderSync className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Custom Databases</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Create custom sections with configurable columns, relational records, and personalized dashboard blocks.
              </p>
            </div>

            <div className="rounded-xl bg-stitch-surface-container/50 border border-white/5 p-5 hover:border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3.5">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Encrypted Vault</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Store sensitive documents, API keys, and passwords with master lock and individual item passwords.
              </p>
            </div>

            <div className="rounded-xl bg-stitch-surface-container/50 border border-white/5 p-5 hover:border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 mb-3.5">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Team Collaboration</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Invite colleagues with tokenized access, assign tasks, and maintain team audit trails seamlessly.
              </p>
            </div>

            <div className="rounded-xl bg-stitch-surface-container/50 border border-white/5 p-5 hover:border-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3.5">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">Authenticated Media</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Images and file attachments are stored with strict access controls and signed temporary URLs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-16 md:py-20 bg-stitch-background relative overflow-hidden border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3 font-headline">
              Simple, Predictable Plans
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Start completely free, then scale up as your custom databases and team expand.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {/* Free Starter */}
            <div className="rounded-2xl bg-stitch-surface-container/50 border border-white/10 p-6 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Individual & Small Team</span>
                <h3 className="text-lg font-bold text-white mt-1 mb-2">Starter</h3>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-4">$0 <span className="text-xs font-normal text-slate-400">/month</span></div>
                <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Full Personal OS (Money, Vault, Tasks)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Up to 2 Custom Sections
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Up to 5 Team Workspace Members
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Standard community support
                  </li>
                </ul>
              </div>
              <Link 
                href="/register?type=individual" 
                className="block w-full py-2 px-3 text-center rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="rounded-2xl bg-stitch-surface-container border border-stitch-primary/40 p-6 relative flex flex-col justify-between shadow-lg shadow-stitch-primary/5">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-stitch-primary text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                POPULAR
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-stitch-primary uppercase">Power Users & Growing Teams</span>
                <h3 className="text-lg font-bold text-white mt-1 mb-2">Pro</h3>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-4">$3.69 <span className="text-xs font-normal text-slate-400">/month</span></div>
                <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Full Personal OS with advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Up to 10 Custom Sections
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Up to 10 Team Workspace Members
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Priority email & upgrade support
                  </li>
                </ul>
              </div>
              <Link 
                href="/pricing" 
                className="block w-full py-2 px-3 text-center rounded-xl text-xs font-semibold bg-stitch-primary text-slate-950 hover:bg-stitch-primary/90 transition-colors font-medium"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-2xl bg-stitch-surface-container/50 border border-white/10 p-6 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Scale & Organizations</span>
                <h3 className="text-lg font-bold text-white mt-1 mb-2">Enterprise</h3>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-4">Custom <span className="text-xs font-normal text-slate-400">pricing</span></div>
                <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Up to 100 Custom Sections
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Unlimited Workspace Members
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Platform Admin console access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-stitch-primary" /> Dedicated assistance & SLAs
                  </li>
                </ul>
              </div>
              <Link 
                href="/contact" 
                className="block w-full py-2 px-3 text-center rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/pricing" className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors">
              Compare all features and limits on the Pricing Page <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-b from-transparent to-stitch-primary/5">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3 font-headline">
            Start organizing your productivity today.
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-lg mx-auto">
            Choose whether you are organizing your personal life or building a productive workspace for your team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              href="/register?type=individual" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-stitch-primary px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md hover:bg-stitch-primary/90 transition-all"
            >
              <User className="w-4 h-4" />
              <span>Get Started Free</span>
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-all"
            >
              <span>Log in to existing account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
