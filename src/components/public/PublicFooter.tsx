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
  { href: "/blog", label: "Blog" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/financial-disclaimer", label: "Disclaimer" },
];

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[14px] text-on-surface-variant hover:text-on-surface transition-colors duration-200"
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
              Ready to grow your business?
            </h3>
            <p className="text-on-surface-variant text-[15px] max-w-md">
              Join thousands of businesses managing their workflow with Axiomixs. Start your free trial today.
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link
              href="/register"
              className="group flex w-full md:w-auto items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/20"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="flex w-full md:w-auto items-center justify-center rounded-full bg-surface-container/50 border border-surface-variant/50 px-6 py-3 text-[14px] font-medium text-on-surface transition-all hover:bg-surface-variant/30 active:scale-95"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col justify-start items-start">
            <Link href="/" className="mb-4 inline-block -ml-2">
              <img
                src="/logo.png"
                alt="Axiomixs"
                className="w-48 sm:w-56 h-auto object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.1)]"
              />
            </Link>
            
            <p className="text-on-surface-variant text-[14px] leading-relaxed max-w-[280px]">
              Build, manage and grow your business with reliable digital solutions designed for modern teams.
            </p>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Links Columns */}
          <div className="md:col-span-7 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">
            <div>
              <h3 className="text-[13px] font-semibold text-on-surface mb-6 uppercase tracking-wider">
                Product
              </h3>
              <ul className="flex flex-col gap-3.5">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-on-surface mb-6 uppercase tracking-wider">
                Company
              </h3>
              <ul className="flex flex-col gap-3.5">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-[13px] font-semibold text-on-surface mb-6 uppercase tracking-wider">
                Contact
              </h3>
              <ul className="flex flex-col gap-3.5">
                <li>
                  <a href="mailto:info@axiomixs.com" className="text-[14px] text-on-surface-variant hover:text-on-surface transition-colors duration-200 break-words">
                    info@axiomixs.com
                  </a>
                </li>
                <li>
                  <a href="tel:+8801753070584" className="text-[14px] text-on-surface-variant hover:text-on-surface transition-colors duration-200">
                    +880 1753-070584
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-20 pt-8 border-t border-surface-variant/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[13px] text-on-surface-variant/70">
            &copy; {currentYear} Axiomixs. All rights reserved.
          </p>
          
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[13px] text-on-surface-variant/70 hover:text-on-surface transition-colors duration-200">
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
