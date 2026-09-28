import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features | App",
  description: "Explore the features of App.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">Features</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Productivity & Tasks</h2>
    <p>Organize your day with a powerful task management system that supports priority, due dates, and categorization. Never let an important action item slip through the cracks.</p>
    
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Money & Investments</h2>
    <p>Track your accounts, monitor budgets, and log transactions. A complete view of your liquid assets and financial health in one unified dashboard.</p>
    
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Custom Sections</h2>
    <p>The true power of App lies in custom sections. Build your own databases with custom fields to track books, CRM contacts, hardware inventory, or anything else you need.</p>
      </div>
    </div>
  );
}
