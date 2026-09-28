import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | App",
  description: "Common questions about App.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">Frequently Asked Questions</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-on-surface">What is App?</h3>
        <p className="mt-2">It's a unified workspace to manage tasks, finances, ideas, and custom databases in one place.</p>
      </div>
      <div>
        <h3 className="text-lg font-bold text-on-surface">Can I customize my workspace?</h3>
        <p className="mt-2">Yes. You can enable or disable modules, create completely custom sections with your own fields, and reorganize your navigation.</p>
      </div>
      <div>
        <h3 className="text-lg font-bold text-on-surface">Does it work on mobile?</h3>
        <p className="mt-2">Yes. App is fully responsive and supports Progressive Web App (PWA) installation for a native-like experience on your phone.</p>
      </div>
    </div>
      </div>
    </div>
  );
}
