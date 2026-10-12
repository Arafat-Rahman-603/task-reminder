"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-variant/30 bg-stitch-surface/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="Manageo" 
                className="h-8 sm:h-9 w-auto object-contain" 
              />
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-5 lg:gap-7">
            <Link href="/features" className="text-sm font-medium text-on-surface-variant hover:text-stitch-primary transition-colors">{t("features")}</Link>
            <Link href="/pricing" className="text-sm font-medium text-on-surface-variant hover:text-stitch-primary transition-colors">{t("pricing")}</Link>
            <Link href="/security" className="text-sm font-medium text-on-surface-variant hover:text-stitch-primary transition-colors">{t("security")}</Link>
            <Link href="/faq" className="text-sm font-medium text-on-surface-variant hover:text-stitch-primary transition-colors">FAQ</Link>
            <Link href="/contact" className="text-sm font-medium text-on-surface-variant hover:text-stitch-primary transition-colors">{t("contact")}</Link>
          </nav>

          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <div className="relative group mr-1">
              <button 
                type="button"
                className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-stitch-primary transition-colors px-2.5 py-1.5 rounded-lg bg-surface-container/50 border border-surface-variant/50"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{language}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-surface-container border border-surface-variant/50 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-1 z-50">
                <button onClick={() => setLanguage("en")} className={`px-3 py-1.5 text-xs text-left rounded-lg transition-colors ${language === "en" ? "bg-primary/20 text-stitch-primary" : "text-on-surface hover:bg-surface-variant"}`}>English</button>
                <button onClick={() => setLanguage("es")} className={`px-3 py-1.5 text-xs text-left rounded-lg transition-colors ${language === "es" ? "bg-primary/20 text-stitch-primary" : "text-on-surface hover:bg-surface-variant"}`}>Español</button>
                <button onClick={() => setLanguage("de")} className={`px-3 py-1.5 text-xs text-left rounded-lg transition-colors ${language === "de" ? "bg-primary/20 text-stitch-primary" : "text-on-surface hover:bg-surface-variant"}`}>Deutsch</button>
                <button onClick={() => setLanguage("fr")} className={`px-3 py-1.5 text-xs text-left rounded-lg transition-colors ${language === "fr" ? "bg-primary/20 text-stitch-primary" : "text-on-surface hover:bg-surface-variant"}`}>Français</button>
              </div>
            </div>
            <Link href="/login" className="text-sm font-medium text-on-surface hover:text-stitch-primary px-3 py-2 transition-colors">{t("login")}</Link>
            <Link href="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">{t("get_started")}</Link>
          </div>

          <div className="md:hidden flex items-center">
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 text-on-surface rounded-lg hover:bg-surface-container/50"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-stitch-surface border-b border-surface-variant/30 px-4 py-4 space-y-3">
          <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface py-1">{t("features")}</Link>
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface py-1">{t("pricing")}</Link>
          <Link href="/security" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface py-1">{t("security")}</Link>
          <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface py-1">FAQ</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface py-1">{t("contact")}</Link>
          <hr className="border-surface-variant/30" />
          <div className="flex gap-2 justify-center py-2">
            <button onClick={() => { setLanguage("en"); setMobileMenuOpen(false); }} className={`px-3 py-1 rounded-lg text-xs ${language === "en" ? "bg-primary/20 text-stitch-primary" : "bg-surface-container"}`}>EN</button>
            <button onClick={() => { setLanguage("es"); setMobileMenuOpen(false); }} className={`px-3 py-1 rounded-lg text-xs ${language === "es" ? "bg-primary/20 text-stitch-primary" : "bg-surface-container"}`}>ES</button>
            <button onClick={() => { setLanguage("de"); setMobileMenuOpen(false); }} className={`px-3 py-1 rounded-lg text-xs ${language === "de" ? "bg-primary/20 text-stitch-primary" : "bg-surface-container"}`}>DE</button>
            <button onClick={() => { setLanguage("fr"); setMobileMenuOpen(false); }} className={`px-3 py-1 rounded-lg text-xs ${language === "fr" ? "bg-primary/20 text-stitch-primary" : "bg-surface-container"}`}>FR</button>
          </div>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-on-surface text-center py-2">{t("login")}</Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block text-center text-base font-medium bg-primary text-primary-foreground px-4 py-2.5 rounded-xl">{t("get_started")}</Link>
        </div>
      )}
    </header>
  );
}
