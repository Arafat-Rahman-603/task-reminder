import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security | App",
  description: "How we protect your data in App.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">Security</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Authentication & Sessions</h2>
    <p>We use industry-standard authentication mechanisms to secure your account. Sessions are managed securely and passwords are heavily hashed.</p>
    
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Data Isolation</h2>
    <p>Your data belongs to you. Our server-side authorization architecture ensures that user data is isolated; you can only access records belonging to your authenticated session.</p>
    
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Continuous Review</h2>
    <p>Security practices are continuously reviewed to ensure the safety and privacy of your personal information.</p>
      </div>
    </div>
  );
}
