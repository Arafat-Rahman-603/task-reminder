import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | App",
  description: "Cookie policy for App.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">Cookie Policy</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <p className="text-sm text-on-surface-variant/70 mb-8">Last updated: 9/29/2026</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Essential Cookies</h2>
    <p className="leading-relaxed">App only uses strictly necessary cookies required for the application to function. These include:</p>
    <ul className="list-disc pl-6 space-y-2 mt-4">
      <li><strong>Authentication cookies</strong> to keep you logged in securely (managed by NextAuth).</li>
      <li><strong>Session cookies</strong> to maintain your temporary state while using the application.</li>
    </ul>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">No Tracking</h2>
    <p className="leading-relaxed">We do not use third-party tracking, advertising, or marketing cookies. Because we only use essential cookies, no cookie consent banner is required.</p>
      </div>
    </div>
  );
}
