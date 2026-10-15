"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="Manageo" 
                className="h-7 sm:h-8 w-auto object-contain" 
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-xs font-normal text-slate-400 hover:text-white transition-colors">Features</Link>
              <Link href="/pricing" className="text-xs font-normal text-slate-400 hover:text-white transition-colors">Pricing</Link>
              <Link href="/security" className="text-xs font-normal text-slate-400 hover:text-white transition-colors">Security</Link>
              <Link href="/faq" className="text-xs font-normal text-slate-400 hover:text-white transition-colors">FAQ</Link>
              <Link href="/contact" className="text-xs font-normal text-slate-400 hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Custom Language Switcher directly beside Log In */}
            <LanguageSwitcher />

            <Link href="/login" className="text-xs font-normal text-slate-300 hover:text-white px-3 py-1.5 transition-colors">
              Log In
            </Link>
            <Link 
              href="/register" 
              className="text-xs font-medium bg-sky-400 text-slate-950 px-3.5 py-1.5 rounded-lg hover:bg-sky-300 transition-colors shadow-sm"
            >
              Start Free
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-1.5 text-slate-300 rounded-lg hover:bg-white/[0.04]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c0f17] border-b border-white/[0.08] px-4 py-4 space-y-3">
          <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">Features</Link>
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">Pricing</Link>
          <Link href="/security" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">Security</Link>
          <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">FAQ</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">Contact</Link>
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
            <LanguageSwitcher />
            <div className="flex items-center gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-xs text-slate-300 px-3 py-1.5 hover:text-white">Log In</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium bg-sky-400 text-slate-950 px-3 py-1.5 rounded-lg">Start Free</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
