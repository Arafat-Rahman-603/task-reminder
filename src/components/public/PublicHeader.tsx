"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-variant/30 bg-stitch-surface/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Pricing</Link>
            <Link href="/security" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Security</Link>
            <Link href="/contact" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Contact</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-on-surface hover:text-primary transition-colors">Log in</Link>
            <Link href="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">Get Started</Link>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-on-surface">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-stitch-surface border-b border-surface-variant/30 px-4 py-4 space-y-4">
          <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface">Features</Link>
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface">Pricing</Link>
          <Link href="/security" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface">Security</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface">Contact</Link>
          <hr className="border-surface-variant/30" />
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface">Log in</Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block text-center text-base font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl">Get Started</Link>
        </div>
      )}
    </header>
  );
}
