"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { Logo } from "@/components/Logo";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0a0e1a]/90 backdrop-blur-md"
      style={{ paddingTop: "var(--safe-area-top, env(safe-area-inset-top, 0px))" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 sm:h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo variant="header" href="/" priority />

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/features" className="text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-colors">
                How it works
              </Link>
              <Link href="/security" className="text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-colors">
                Security
              </Link>
              <Link href="/pricing" className="text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-colors">
                Pricing
              </Link>
              <Link href="/faq" className="text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-colors">
                FAQ
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-2.5">
            {/* Custom Conflict-Free Language Switcher */}
            <LanguageSwitcher />

            <Link 
              href="/login" 
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/register" 
              className="text-xs font-semibold bg-gradient-to-r from-sky-400 to-sky-300 hover:from-sky-300 hover:to-sky-200 text-slate-950 px-3.5 py-1.5 rounded-lg transition-all shadow-sm shadow-sky-500/15"
            >
              Get started
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 text-slate-300 rounded-lg hover:bg-white/[0.06] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0f1524] border-b border-white/[0.08] px-5 py-4 space-y-3">
          <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-300 hover:text-white py-1.5">
            Features
          </Link>
          <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-300 hover:text-white py-1.5">
            How it works
          </Link>
          <Link href="/security" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-300 hover:text-white py-1.5">
            Security
          </Link>
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-300 hover:text-white py-1.5">
            Pricing
          </Link>
          <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-300 hover:text-white py-1.5">
            FAQ
          </Link>
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-300 py-1.5">
              Log in
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium bg-sky-400 text-slate-950 px-4 py-2 rounded-lg">
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
