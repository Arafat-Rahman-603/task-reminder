import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Disclaimer | App",
  description: "Important information regarding financial features.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">Financial Disclaimer</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <p><strong>App is a tracking and organization tool, not a financial advisor.</strong></p>
    <p>The information and tools provided within the money and investment modules of this application are for informational and organizational purposes only. They do not constitute financial, investment, tax, legal, or accounting advice.</p>
    <p>We do not guarantee the accuracy of financial calculations or market data. Always consult with a qualified professional before making any financial decisions.</p>
      </div>
    </div>
  );
}
