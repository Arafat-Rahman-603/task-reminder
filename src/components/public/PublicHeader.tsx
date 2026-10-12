"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

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
              <Link href="/features" className="text-xs font-normal text-slate-400 hover:text-white transition-colors">{t("features")}</Link>
              <Link href="/pricing" className="text-xs font-normal text-slate-400 hover:text-white transition-colors">{t("pricing")}</Link>
              <Link href="/security" className="text-xs font-normal text-slate-400 hover:text-white transition-colors">{t("security")}</Link>
              <Link href="/faq" className="text-xs font-normal text-slate-400 hover:text-white transition-colors">FAQ</Link>
              <Link href="/contact" className="text-xs font-normal text-slate-400 hover:text-white transition-colors">{t("contact")}</Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative group">
              <button 
                type="button"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02]"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{language}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-32 rounded-lg bg-[#0f1117] border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-1 z-50">
                <button onClick={() => setLanguage("en")} className={`px-2.5 py-1.5 text-xs text-left rounded-md transition-colors ${language === "en" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"}`}>English</button>
                <button onClick={() => setLanguage("es")} className={`px-2.5 py-1.5 text-xs text-left rounded-md transition-colors ${language === "es" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"}`}>Español</button>
                <button onClick={() => setLanguage("de")} className={`px-2.5 py-1.5 text-xs text-left rounded-md transition-colors ${language === "de" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"}`}>Deutsch</button>
                <button onClick={() => setLanguage("fr")} className={`px-2.5 py-1.5 text-xs text-left rounded-md transition-colors ${language === "fr" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"}`}>Français</button>
              </div>
            </div>

            <Link href="/login" className="text-xs font-normal text-slate-300 hover:text-white px-3 py-1.5 transition-colors">
              {t("login")}
            </Link>
            <Link 
              href="/register" 
              className="text-xs font-medium bg-sky-400 text-slate-950 px-3.5 py-1.5 rounded-lg hover:bg-sky-300 transition-colors"
            >
              {t("get_started")}
            </Link>
          </div>

          <div className="md:hidden flex items-center">
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
          <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">{t("features")}</Link>
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">{t("pricing")}</Link>
          <Link href="/security" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">{t("security")}</Link>
          <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">FAQ</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white py-1">{t("contact")}</Link>
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
            <div className="flex gap-1.5">
              <button onClick={() => { setLanguage("en"); setMobileMenuOpen(false); }} className={`px-2 py-1 rounded text-xs ${language === "en" ? "bg-white/10 text-white" : "text-slate-400"}`}>EN</button>
              <button onClick={() => { setLanguage("es"); setMobileMenuOpen(false); }} className={`px-2 py-1 rounded text-xs ${language === "es" ? "bg-white/10 text-white" : "text-slate-400"}`}>ES</button>
              <button onClick={() => { setLanguage("de"); setMobileMenuOpen(false); }} className={`px-2 py-1 rounded text-xs ${language === "de" ? "bg-white/10 text-white" : "text-slate-400"}`}>DE</button>
              <button onClick={() => { setLanguage("fr"); setMobileMenuOpen(false); }} className={`px-2 py-1 rounded text-xs ${language === "fr" ? "bg-white/10 text-white" : "text-slate-400"}`}>FR</button>
            </div>
            <div className="flex gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-xs text-slate-300 px-3 py-1.5">{t("login")}</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium bg-sky-400 text-slate-950 px-3 py-1.5 rounded-lg">{t("get_started")}</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
