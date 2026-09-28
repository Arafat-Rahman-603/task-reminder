import Link from "next/link";
import { ArrowRight, CheckCircle2, Layout, TrendingUp, Lock } from "lucide-react";

export default function SaaSLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
            <Layout className="h-5 w-5 text-white dark:text-zinc-900" />
          </div>
          <span className="text-xl font-bold tracking-tight">Personal OS</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <Link href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Features</Link>
          <Link href="#customization" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Customization</Link>
          <Link href="#security" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Security</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-zinc-600 dark:hover:text-zinc-300">Sign in</Link>
          <Link href="/register" className="text-sm font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-24 md:py-32 max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            One place for your work, money, and everyday life.
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Stop switching between ten different apps. Manage your tasks, goals, ideas, finances, and investments in a single, perfectly tailored operating system.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register" className="flex items-center gap-2 text-base font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-8 py-4 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors w-full sm:w-auto justify-center">
              Start Building Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="#features" className="flex items-center gap-2 text-base font-medium border border-zinc-200 dark:border-zinc-800 px-8 py-4 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-full sm:w-auto justify-center">
              Explore the Product
            </Link>
          </div>
          
          {/* Dashboard Preview */}
          <div className="pt-16">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden p-2">
              <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 aspect-[16/9] flex items-center justify-center text-zinc-400 font-medium">
                [Dashboard Application Preview]
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="px-6 py-24 bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">Everything you need. Nothing you don&apos;t.</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-4">Powerful primitives designed to work together seamlessly.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-zinc-900 dark:text-white" />
                </div>
                <h3 className="text-xl font-semibold">Daily Planning & Tasks</h3>
                <p className="text-zinc-500 dark:text-zinc-400">Plan your day, track routines, and manage projects. Quick capture means nothing slips through the cracks.</p>
              </div>
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-zinc-900 dark:text-white" />
                </div>
                <h3 className="text-xl font-semibold">Financial Command Center</h3>
                <p className="text-zinc-500 dark:text-zinc-400">Track spending, monitor budgets, log investments, and watch your net worth grow with precise calculations.</p>
              </div>
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <Layout className="h-6 w-6 text-zinc-900 dark:text-white" />
                </div>
                <h3 className="text-xl font-semibold">The Ideas System</h3>
                <p className="text-zinc-500 dark:text-zinc-400">A dedicated space for your thoughts, business ideas, and content plans. Convert ideas directly into actionable goals.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Customization Section */}
        <section id="customization" className="px-6 py-24 max-w-7xl mx-auto">
           <div className="grid md:grid-cols-2 gap-16 items-center">
             <div className="space-y-6">
               <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Build Personal Sections Your Way.</h2>
               <p className="text-lg text-zinc-500 dark:text-zinc-400">
                 Need a CRM for your freelance business? A reading tracker? A recipe database? 
                 Don&apos;t wait for us to build it. Create custom databases tailored exactly to your life.
               </p>
               <ul className="space-y-4">
                 <li className="flex items-center gap-3 font-medium">
                   <div className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-white" /> 15+ Custom Field Types
                 </li>
                 <li className="flex items-center gap-3 font-medium">
                   <div className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-white" /> Table, Kanban, and Gallery Views
                 </li>
                 <li className="flex items-center gap-3 font-medium">
                   <div className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-white" /> Pin straight to your sidebar
                 </li>
               </ul>
             </div>
             <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-xl">
               <div className="space-y-4">
                 <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                 <div className="h-64 w-full bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-100 dark:border-zinc-800 flex flex-col pt-4 px-4 gap-2">
                    <div className="h-8 w-full bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
                    <div className="h-8 w-full bg-zinc-100 dark:bg-zinc-900 rounded-sm" />
                    <div className="h-8 w-full bg-zinc-100 dark:bg-zinc-900 rounded-sm" />
                 </div>
               </div>
             </div>
           </div>
        </section>

        {/* Security Section */}
        <section id="security" className="px-6 py-24 bg-zinc-900 text-white dark:bg-zinc-950 border-t border-zinc-800">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Lock className="h-12 w-12 mx-auto text-zinc-400" />
            <h2 className="text-3xl font-bold tracking-tight">Your life is private. Keep it that way.</h2>
            <p className="text-zinc-400 text-lg">
              We take security seriously because this is your personal operating system. 
              Enjoy strict data isolation, encrypted sessions, and server-side authorization. We never sell your data.
            </p>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 text-sm flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full">
        <p>© {new Date().getFullYear()} Personal OS. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
