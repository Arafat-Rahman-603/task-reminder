import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/pricing",
    title: lang === "es" ? "Precios" : "Pricing",
    description: lang === "es" ? "Precios simples y transparentes de Manageo." : "Simple, transparent pricing for Manageo.",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">
        {lang === "es" ? "Precios" : "Pricing"}
      </h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low/50 p-8 text-center max-w-md mx-auto mt-12">
          <h3 className="text-xl font-bold text-on-surface mb-2">
            {lang === "es" ? "Acceso Anticipado" : "Early Access"}
          </h3>
          <p className="text-4xl font-bold text-primary mb-6">
            {lang === "es" ? "Gratis" : "Free"}
          </p>
          <p className="mb-8">
            {lang === "es" 
              ? "Durante nuestro período de acceso anticipado, todas las funciones están disponibles de forma gratuita." 
              : "During our early access period, all features are available for free."}
          </p>
          <Link href="/register" className="inline-block w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            {lang === "es" ? "Empezar Ahora" : "Get Started Now"}
          </Link>
        </div>
        <p className="text-sm text-center mt-8">
          {lang === "es" 
            ? "Los niveles premium se introducirán en el futuro. Los usuarios de acceso anticipado existentes serán notificados con mucha anticipación." 
            : "Premium tiers will be introduced in the future. Existing early-access users will be notified well in advance."}
        </p>
      </div>
    </div>
  );
}
