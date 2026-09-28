import Link from "next/link";

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
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
          <p className="text-xs text-on-surface-variant">
            &copy; {currentYear}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
