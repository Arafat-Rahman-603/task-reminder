import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | App",
  description: "Rules for using App.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">Acceptable Use Policy</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <p>By using App, you agree not to misuse the service or help anyone else do so.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Prohibited Actions</h2>
    <ul className="list-disc pl-6 space-y-2">
      <li>Using the service for any unlawful purpose.</li>
      <li>Attempting to probe, scan, or test the vulnerability of the system.</li>
      <li>Interfering with or disrupting the access of any user, host, or network.</li>
      <li>Uploading malicious software or engaging in malicious activities.</li>
    </ul>
    <p className="mt-6">Violation of these terms may result in immediate account suspension or termination.</p>
      </div>
    </div>
  );
}
