import Link from "next/link";
import { Logo } from "@/components/Logo";

const productLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/faq", label: "FAQ" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/pricing", label: "Plans" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/financial-disclaimer", label: "Financial Disclaimer" },
];

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs text-slate-400 hover:text-sky-300 transition-colors"
    >
      {children}
    </Link>
  );
}

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.08] bg-[#0a0e1a] text-slate-400 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Column - Logo only, no text */}
          <div className="md:col-span-4 flex flex-col justify-start items-start">
            <Logo variant="footer" href="/" linkClassName="mb-4" />
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-4">
              Unified Personal Operating System and Collaborative Team Workspaces. Engineered for focus, clarity, and strict privacy isolation.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-xs bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          <div className="hidden md:block md:col-span-1"></div>

          {/* Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Product
              </p>
              <ul className="flex flex-col gap-2.5">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Company
              </p>
              <ul className="flex flex-col gap-2.5">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Contact & Support
              </p>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <a href="mailto:support@axiomixs.com" className="text-xs text-slate-400 hover:text-white transition-colors break-words">
                    support@axiomixs.com
                  </a>
                </li>
                <li>
                  <a href="tel:+8801753070584" className="text-xs text-slate-400 hover:text-white transition-colors">
                    +880 1753-070584
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p suppressHydrationWarning>
            &copy; {currentYear} Manageo. All rights reserved.
          </p>
          
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-slate-500 hover:text-slate-300 transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
