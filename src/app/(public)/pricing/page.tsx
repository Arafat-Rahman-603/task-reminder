import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | App",
  description: "Simple, transparent pricing for App.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">Pricing</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low/50 p-8 text-center max-w-md mx-auto mt-12">
      <h3 className="text-xl font-bold text-on-surface mb-2">Early Access</h3>
      <p className="text-4xl font-bold text-primary mb-6">Free</p>
      <p className="mb-8">During our early access period, all features are available for free.</p>
      <a href="/register" className="inline-block w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Get Started Now</a>
    </div>
    <p className="text-sm text-center mt-8">Premium tiers will be introduced in the future. Existing early-access users will be notified well in advance.</p>
      </div>
    </div>
  );
}
