import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/terms",
    title: lang === "es" ? "Términos de Servicio" : "Terms of Service",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">Terms of Service</h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <p className="text-sm text-on-surface-variant/70 mb-8">Last updated: 9/29/2026</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">1. Introduction</h2>
    <p className="leading-relaxed">Welcome to App. By accessing or using our platform, you agree to be bound by these Terms of Service.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">2. Your Account</h2>
    <p className="leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">3. Acceptable Use</h2>
    <p className="leading-relaxed">You agree not to use App to violate any laws, infringe on rights, or distribute malicious code.</p>
    <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">4. Data Privacy</h2>
    <p className="leading-relaxed">Your data is yours. We claim no ownership over the data you input. Use of data is governed by our Privacy Policy.</p>
      </div>
    </div>
  );
}
