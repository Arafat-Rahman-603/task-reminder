import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About App | App",
  description: "The philosophy behind App.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">About App</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <p className="text-lg leading-relaxed">App was built on a simple philosophy: your life shouldn't be fragmented across ten different specialized applications.</p>
    <p className="leading-relaxed">We built this tool because we wanted a flexible, unified workspace that treats task management, financial tracking, and random ideas as parts of the same holistic system.</p>
    <p className="leading-relaxed">Our goal is to provide a calm, highly customizable environment that adapts to your workflow, rather than forcing you to adapt to ours.</p>
      </div>
    </div>
  );
}
