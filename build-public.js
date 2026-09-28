const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app');
const publicDir = path.join(baseDir, '(public)');
const componentsDir = path.join(__dirname, 'src', 'components', 'public');

// 1. Create directories
const dirsToCreate = [
  publicDir,
  componentsDir,
  path.join(publicDir, 'features'),
  path.join(publicDir, 'pricing'),
  path.join(publicDir, 'security'),
  path.join(publicDir, 'about'),
  path.join(publicDir, 'faq'),
  path.join(publicDir, 'financial-disclaimer'),
  path.join(publicDir, 'acceptable-use'),
  path.join(publicDir, 'terms'),
  path.join(publicDir, 'privacy'),
  path.join(publicDir, 'cookies'),
];

dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Move contact (which is complex) and rename page.tsx
const routesToMove = ['contact'];
routesToMove.forEach(route => {
  const src = path.join(baseDir, route);
  const dest = path.join(publicDir, route);
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.renameSync(src, dest);
  }
});

if (fs.existsSync(path.join(baseDir, 'page.tsx'))) {
  fs.renameSync(path.join(baseDir, 'page.tsx'), path.join(publicDir, 'page.tsx'));
}

// Remove old terms, privacy, cookies dirs from baseDir as we will rewrite them
['terms', 'privacy', 'cookies'].forEach(route => {
  const src = path.join(baseDir, route);
  if (fs.existsSync(src)) {
    fs.rmSync(src, { recursive: true, force: true });
  }
});

// 3. Components
const headerContent = `"use client";
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-high p-1 shadow-sm">
                <img src="/fav.png" alt="Logo" className="w-full h-full object-contain rounded" />
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">Personal OS</span>
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
`;
fs.writeFileSync(path.join(componentsDir, 'PublicHeader.tsx'), headerContent);

const footerContent = `import Link from "next/link";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-stitch-background border-t border-surface-variant/30 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/features" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/security" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Security</Link></li>
              <li><Link href="/faq" className="text-sm text-on-surface-variant hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-on-surface-variant hover:text-primary transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Cookie Policy</Link></li>
              <li><Link href="/financial-disclaimer" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Financial Disclaimer</Link></li>
              <li><Link href="/acceptable-use" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Acceptable Use</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-4">Account</h3>
            <ul className="space-y-3">
              <li><Link href="/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Log in</Link></li>
              <li><Link href="/register" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Register</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-surface-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/fav.png" alt="Logo" className="w-6 h-6 object-contain rounded" />
            <span className="text-sm font-bold text-on-surface">Personal OS</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            &copy; {currentYear} Personal OS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
`;
fs.writeFileSync(path.join(componentsDir, 'PublicFooter.tsx'), footerContent);

const layoutContent = `import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-stitch-background text-on-surface selection:bg-stitch-primary/20 selection:text-stitch-primary">
      <PublicHeader />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
`;
fs.writeFileSync(path.join(publicDir, 'layout.tsx'), layoutContent);

const landingPageContent = `import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Zap, Target, FolderSync, Settings } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal OS - Organize Your Life, Work & Money",
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
            <p className="text-on-surface-variant max-w-2xl mx-auto">Stop jumping between five different apps to manage your day. Personal OS brings your critical systems together.</p>
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
                Personal OS isn't a rigid structure you have to squeeze your life into. It's a modular toolkit that adapts to how you naturally work.
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
`;
fs.writeFileSync(path.join(publicDir, 'page.tsx'), landingPageContent);

const createSimplePage = (title, description, content) => {
  return `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${title} | Personal OS",
  description: "${description}",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">${title}</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        ${content}
      </div>
    </div>
  );
}
`;
}

const pages = {
  'features/page.tsx': createSimplePage(
    'Features', 
    'Explore the features of Personal OS.',
    `<h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Productivity & Tasks</h2>
    <p>Organize your day with a powerful task management system that supports priority, due dates, and categorization. Never let an important action item slip through the cracks.</p>
    
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Money & Investments</h2>
    <p>Track your accounts, monitor budgets, and log transactions. A complete view of your liquid assets and financial health in one unified dashboard.</p>
    
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Custom Sections</h2>
    <p>The true power of Personal OS lies in custom sections. Build your own databases with custom fields to track books, CRM contacts, hardware inventory, or anything else you need.</p>`
  ),
  'pricing/page.tsx': createSimplePage(
    'Pricing',
    'Simple, transparent pricing for Personal OS.',
    `<div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low/50 p-8 text-center max-w-md mx-auto mt-12">
      <h3 className="text-xl font-bold text-on-surface mb-2">Early Access</h3>
      <p className="text-4xl font-bold text-primary mb-6">Free</p>
      <p className="mb-8">During our early access period, all features are available for free.</p>
      <a href="/register" className="inline-block w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Get Started Now</a>
    </div>
    <p className="text-sm text-center mt-8">Premium tiers will be introduced in the future. Existing early-access users will be notified well in advance.</p>`
  ),
  'security/page.tsx': createSimplePage(
    'Security',
    'How we protect your data in Personal OS.',
    `<h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Authentication & Sessions</h2>
    <p>We use industry-standard authentication mechanisms to secure your account. Sessions are managed securely and passwords are heavily hashed.</p>
    
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Data Isolation</h2>
    <p>Your data belongs to you. Our server-side authorization architecture ensures that user data is isolated; you can only access records belonging to your authenticated session.</p>
    
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Continuous Review</h2>
    <p>Security practices are continuously reviewed to ensure the safety and privacy of your personal information.</p>`
  ),
  'about/page.tsx': createSimplePage(
    'About Personal OS',
    'The philosophy behind Personal OS.',
    `<p className="text-lg leading-relaxed">Personal OS was built on a simple philosophy: your life shouldn't be fragmented across ten different specialized applications.</p>
    <p className="leading-relaxed">We built this tool because we wanted a flexible, unified workspace that treats task management, financial tracking, and random ideas as parts of the same holistic system.</p>
    <p className="leading-relaxed">Our goal is to provide a calm, highly customizable environment that adapts to your workflow, rather than forcing you to adapt to ours.</p>`
  ),
  'faq/page.tsx': createSimplePage(
    'Frequently Asked Questions',
    'Common questions about Personal OS.',
    `<div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-on-surface">What is Personal OS?</h3>
        <p className="mt-2">It's a unified workspace to manage tasks, finances, ideas, and custom databases in one place.</p>
      </div>
      <div>
        <h3 className="text-lg font-bold text-on-surface">Can I customize my workspace?</h3>
        <p className="mt-2">Yes. You can enable or disable modules, create completely custom sections with your own fields, and reorganize your navigation.</p>
      </div>
      <div>
        <h3 className="text-lg font-bold text-on-surface">Does it work on mobile?</h3>
        <p className="mt-2">Yes. Personal OS is fully responsive and supports Progressive Web App (PWA) installation for a native-like experience on your phone.</p>
      </div>
    </div>`
  ),
  'financial-disclaimer/page.tsx': createSimplePage(
    'Financial Disclaimer',
    'Important information regarding financial features.',
    `<p><strong>Personal OS is a tracking and organization tool, not a financial advisor.</strong></p>
    <p>The information and tools provided within the money and investment modules of this application are for informational and organizational purposes only. They do not constitute financial, investment, tax, legal, or accounting advice.</p>
    <p>We do not guarantee the accuracy of financial calculations or market data. Always consult with a qualified professional before making any financial decisions.</p>`
  ),
  'acceptable-use/page.tsx': createSimplePage(
    'Acceptable Use Policy',
    'Rules for using Personal OS.',
    `<p>By using Personal OS, you agree not to misuse the service or help anyone else do so.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Prohibited Actions</h2>
    <ul className="list-disc pl-6 space-y-2">
      <li>Using the service for any unlawful purpose.</li>
      <li>Attempting to probe, scan, or test the vulnerability of the system.</li>
      <li>Interfering with or disrupting the access of any user, host, or network.</li>
      <li>Uploading malicious software or engaging in malicious activities.</li>
    </ul>
    <p className="mt-6">Violation of these terms may result in immediate account suspension or termination.</p>`
  ),
  'terms/page.tsx': createSimplePage(
    'Terms of Service',
    'Terms of service for Personal OS.',
    `<p className="text-sm text-on-surface-variant/70 mb-8">Last updated: ${new Date().toLocaleDateString()}</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">1. Introduction</h2>
    <p className="leading-relaxed">Welcome to Personal OS. By accessing or using our platform, you agree to be bound by these Terms of Service.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">2. Your Account</h2>
    <p className="leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">3. Acceptable Use</h2>
    <p className="leading-relaxed">You agree not to use Personal OS to violate any laws, infringe on rights, or distribute malicious code.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">4. Data Privacy</h2>
    <p className="leading-relaxed">Your data is yours. We claim no ownership over the data you input. Use of data is governed by our Privacy Policy.</p>`
  ),
  'privacy/page.tsx': createSimplePage(
    'Privacy Policy',
    'Privacy policy for Personal OS.',
    `<p className="text-sm text-on-surface-variant/70 mb-8">Last updated: ${new Date().toLocaleDateString()}</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Information We Collect</h2>
    <p className="leading-relaxed">We collect information you provide directly, such as when you create an account, enter tasks, track finances, or contact us. This includes your email, name, and the structured data you store.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">How We Use Information</h2>
    <p className="leading-relaxed">We use your information solely to provide, maintain, and improve the service. We do not sell your personal data to third parties.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Data Security</h2>
    <p className="leading-relaxed">We implement appropriate technical measures to protect your data against unauthorized access or alteration.</p>`
  ),
  'cookies/page.tsx': createSimplePage(
    'Cookie Policy',
    'Cookie policy for Personal OS.',
    `<p className="text-sm text-on-surface-variant/70 mb-8">Last updated: ${new Date().toLocaleDateString()}</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Essential Cookies</h2>
    <p className="leading-relaxed">Personal OS only uses strictly necessary cookies required for the application to function. These include:</p>
    <ul className="list-disc pl-6 space-y-2 mt-4">
      <li><strong>Authentication cookies</strong> to keep you logged in securely (managed by NextAuth).</li>
      <li><strong>Session cookies</strong> to maintain your temporary state while using the application.</li>
    </ul>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">No Tracking</h2>
    <p className="leading-relaxed">We do not use third-party tracking, advertising, or marketing cookies. Because we only use essential cookies, no cookie consent banner is required.</p>`
  )
};

Object.entries(pages).forEach(([relPath, content]) => {
  fs.writeFileSync(path.join(publicDir, relPath), content);
});

console.log('Public pages created successfully.');
