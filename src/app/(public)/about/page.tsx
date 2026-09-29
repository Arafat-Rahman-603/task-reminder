import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/about",
    title: lang === "es" ? "Acerca de Manageo" : "About Manageo",
    description: lang === "es" ? "La filosofía detrás de Manageo." : "The philosophy behind Manageo.",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">
        {lang === "es" ? "Acerca de Manageo" : "About Manageo"}
      </h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <p className="text-lg leading-relaxed">
          {lang === "es" 
            ? "Manageo se construyó sobre una filosofía simple: tu vida no debería estar fragmentada en diez aplicaciones especializadas diferentes." 
            : "Manageo was built on a simple philosophy: your life shouldn't be fragmented across ten different specialized applications."}
        </p>
        <p className="leading-relaxed">
          {lang === "es" 
            ? "Construimos esta herramienta porque queríamos un espacio de trabajo flexible y unificado que trate la gestión de tareas, el seguimiento financiero y las ideas aleatorias como partes del mismo sistema integral." 
            : "We built this tool because we wanted a flexible, unified workspace that treats task management, financial tracking, and random ideas as parts of the same holistic system."}
        </p>
        <p className="leading-relaxed">
          {lang === "es" 
            ? "Nuestro objetivo es proporcionar un entorno tranquilo y altamente personalizable que se adapte a tu flujo de trabajo, en lugar de obligarte a adaptarte al nuestro." 
            : "Our goal is to provide a calm, highly customizable environment that adapts to your workflow, rather than forcing you to adapt to ours."}
        </p>
      </div>
    </div>
  );
}
