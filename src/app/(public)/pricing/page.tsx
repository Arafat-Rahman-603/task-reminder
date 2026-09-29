import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";
import Link from "next/link";

import PricingClient from "./PricingClient";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/pricing",
    title: lang === "es" ? "Precios" : "Pricing",
    description: lang === "es" ? "Precios simples y transparentes de Manageo." : "Simple, transparent pricing for Manageo.",
  });
}

export default function Page() {
  return <PricingClient />;
}
