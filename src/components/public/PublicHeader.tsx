"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#DFE4DC] bg-[#F7F8F4]/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="Manageo" 
                className="h-7 sm:h-8 w-auto object-contain" 
              />
              <span className="font-semibold text-lg tracking-tight text-[#18211B]">
                Manageo
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-7">
              <Link href="/features" className="text-sm font-medium text-[#687169] hover:text-[#18211B] transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-[#687169] hover:text-[#18211B] transition-colors">
                How it works
              </Link>
              <Link href="/security" className="text-sm font-medium text-[#687169] hover:text-[#18211B] transition-colors">
                Security
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-[#687169] hover:text-[#18211B] transition-colors">
                Pricing
              </Link>
              <Link href="/faq" className="text-sm font-medium text-[#687169] hover:text-[#18211B] transition-colors">
                FAQ
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Custom Conflict-Free Language Switcher */}
            <LanguageSwitcher />

            <Link 
              href="/login" 
              className="text-sm font-medium text-[#18211B] hover:text-[#245A43] px-3.5 py-2 transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/register" 
              className="text-sm font-medium bg-[#245A43] hover:bg-[#17392D] text-white px-4 py-2 rounded-lg transition-colors shadow-xs"
            >
              Get started
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 text-[#18211B] rounded-lg hover:bg-[#EEF1EA] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F7F8F4] border-b border-[#DFE4DC] px-5 py-4 space-y-3">
          <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[#18211B] hover:text-[#245A43] py-1.5">
            Features
          </Link>
          <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[#18211B] hover:text-[#245A43] py-1.5">
            How it works
          </Link>
          <Link href="/security" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[#18211B] hover:text-[#245A43] py-1.5">
            Security
          </Link>
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[#18211B] hover:text-[#245A43] py-1.5">
            Pricing
          </Link>
          <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[#18211B] hover:text-[#245A43] py-1.5">
            FAQ
          </Link>
          <div className="pt-3 border-t border-[#DFE4DC] flex items-center justify-between">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#18211B] py-1.5">
              Log in
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium bg-[#245A43] text-white px-4 py-2 rounded-lg">
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
