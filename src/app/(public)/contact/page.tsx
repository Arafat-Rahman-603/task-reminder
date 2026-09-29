import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";
import ContactPageClient from "./ContactPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/contact",
    title: lang === "es" ? "Contacto" : "Contact",
    description: lang === "es" ? "Ponte en contacto con el equipo de Manageo." : "Get in touch with the Manageo team.",
  });
}

export default function Page() {
  return <ContactPageClient />;
}
