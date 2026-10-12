import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
      className="text-sm text-on-surface-variant hover:text-stitch-primary transition-colors duration-200"
    >
      {children}
    </Link>
  );
}

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stitch-background text-on-surface border-t border-surface-variant/30 font-sans selection:bg-primary/30 selection:text-on-surface">
      {/* Top CTA Banner */}
      <div className="border-b border-surface-variant/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-on-surface mb-3">
              Ready to streamline your personal systems and team workflow?
            </h3>
            <p className="text-on-surface-variant text-[15px] max-w-xl">
              Experience the dual power of a zero-knowledge personal operating system and a secure team collaboration workspace.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/register?type=individual"
              className="group flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 shadow-md"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="flex w-full md:w-auto items-center justify-center rounded-xl bg-surface-container/60 border border-surface-variant/50 px-6 py-3 text-sm font-semibold text-on-surface transition-all hover:bg-surface-variant/40 active:scale-95"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col justify-start items-start">
            <Link href="/" className="mb-4 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Manageo"
                className="h-9 w-auto object-contain"
              />
            </Link>
            
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-[300px]">
              A unified Personal Operating System and Secure Team Collaboration SaaS built for high-performance execution with strict cryptographic privacy.
            </p>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Links Columns */}
          <div className="md:col-span-7 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">
            <div>
              <h3 className="text-xs font-semibold text-on-surface mb-5 uppercase tracking-wider">
                Product
              </h3>
              <ul className="flex flex-col gap-3">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-on-surface mb-5 uppercase tracking-wider">
                Company
              </h3>
              <ul className="flex flex-col gap-3">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.label + link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-xs font-semibold text-on-surface mb-5 uppercase tracking-wider">
                Contact & Support
              </h3>
              <ul className="flex flex-col gap-3">
                <li>
                  <a href="mailto:info@axiomixs.com" className="text-sm text-on-surface-variant hover:text-stitch-primary transition-colors duration-200 break-words">
                    info@axiomixs.com
                  </a>
                </li>
                <li>
                  <a href="tel:+8801753070584" className="text-sm text-on-surface-variant hover:text-stitch-primary transition-colors duration-200">
                    +880 1753-070584
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-16 pt-8 border-t border-surface-variant/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-on-surface-variant/80">
            &copy; {currentYear} Manageo. All rights reserved.
          </p>
          
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-xs text-on-surface-variant/80 hover:text-stitch-primary transition-colors duration-200">
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
