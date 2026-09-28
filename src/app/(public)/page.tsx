import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Zap, Target, FolderSync, Settings } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "App - Organize Your Life, Work & Money",
  description: "A flexible Personal Operating System that helps people organize their life, work, ideas, money, and personal systems in one place.",
};

export default function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center rounded-full border border-surface-variant/50 bg-surface-container/50 px-3 py-1 text-sm font-medium text-stitch-primary mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-stitch-primary mr-2 animate-pulse"></span>
            Your complete personal operating system
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-on-surface mb-6 font-headline">
            Organize everything. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-stitch-primary to-tertiary">In one place.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-on-surface-variant mb-10 leading-relaxed">
            A flexible Personal Operating System that adapts to you. Manage your daily life, track your money, focus on your goals, and capture ideas—all in a beautifully unified workspace.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container border border-surface-variant/50 px-8 py-3.5 text-sm font-semibold text-on-surface hover:bg-surface-variant transition-colors">
              Explore the Product
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Value Section */}
      <section className="py-24 bg-stitch-surface/50 border-y border-surface-variant/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-4 font-headline">One place for everything</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Stop jumping between five different apps to manage your day. App brings your critical systems together.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl bg-surface-container/40 border border-surface-variant/30 p-6 backdrop-blur-sm hover:bg-surface-container/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Daily Planning</h3>
              <p className="text-sm text-on-surface-variant">Stay on top of your tasks and projects with powerful prioritization and reminders.</p>
            </div>
            <div className="rounded-2xl bg-surface-container/40 border border-surface-variant/30 p-6 backdrop-blur-sm hover:bg-surface-container/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Money & Investments</h3>
              <p className="text-sm text-on-surface-variant">Track accounts, budgets, and investments. Understand your net worth at a glance.</p>
            </div>
            <div className="rounded-2xl bg-surface-container/40 border border-surface-variant/30 p-6 backdrop-blur-sm hover:bg-surface-container/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-stitch-secondary/10 flex items-center justify-center text-stitch-secondary mb-4">
                <FolderSync className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Custom Sections</h3>
              <p className="text-sm text-on-surface-variant">Build custom databases for anything—from reading lists to CRM. It's your system.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Your System, Your Way Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-6 font-headline">Your System, Your Way</h2>
              <p className="text-lg text-on-surface-variant mb-8">
                App isn't a rigid structure you have to squeeze your life into. It's a modular toolkit that adapts to how you naturally work.
              </p>
              <ul className="space-y-4">
                {['Enable or disable core modules anytime', 'Create custom sections with custom fields', 'Design your own dashboard layout', 'Organize navigation to fit your workflow'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Zap className="w-3 h-3" />
                    </div>
                    <span className="text-on-surface">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-stitch-primary/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl border border-surface-variant/40 bg-surface-container-high/80 p-2 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-variant/30 bg-surface-container-low/50">
                   <Settings className="w-4 h-4 text-on-surface-variant" />
                   <span className="text-xs font-medium text-on-surface-variant">Custom Section Builder</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="h-8 w-3/4 bg-surface-variant/50 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-10 w-full bg-surface-container/50 rounded-xl" />
                    <div className="h-10 w-full bg-surface-container/50 rounded-xl" />
                    <div className="h-10 w-full bg-surface-container/50 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5 border-t border-primary/10">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-6 font-headline">Ready to get organized?</h2>
          <p className="text-lg text-on-surface-variant mb-10">Join professionals, students, and creators who are already managing their life in one unified workspace.</p>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105">
            Create Your Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
