import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/privacy",
    title: lang === "es" ? "Política de Privacidad" : "Privacy Policy",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <p className="text-sm text-on-surface-variant/70 mb-8">Last updated: 9/29/2026</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Information We Collect</h2>
    <p className="leading-relaxed">We collect information you provide directly, such as when you create an account, enter tasks, track finances, or contact us. This includes your email, name, and the structured data you store.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">How We Use Information</h2>
    <p className="leading-relaxed">We use your information solely to provide, maintain, and improve the service. We do not sell your personal data to third parties.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">Data Security</h2>
    <p className="leading-relaxed">We implement appropriate technical measures to protect your data against unauthorized access or alteration.</p>
      </div>
    </div>
  );
}
