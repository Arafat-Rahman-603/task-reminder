import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/faq",
    title: lang === "es" ? "Preguntas Frecuentes" : "FAQ",
    description: lang === "es" ? "Preguntas frecuentes sobre Manageo." : "Frequently asked questions about Manageo.",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">
        {lang === "es" ? "Preguntas Frecuentes" : "FAQ"}
      </h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold text-on-surface">
              {lang === "es" ? "¿Qué es Manageo?" : "What is Manageo?"}
            </h3>
            <p className="mt-2">
              {lang === "es" 
                ? "Es un espacio de trabajo unificado para gestionar tareas, finanzas, ideas y bases de datos personalizadas en un solo lugar." 
                : "It's a unified workspace to manage tasks, finances, ideas, and custom databases in one place."}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface">
              {lang === "es" ? "¿Puedo personalizar mi espacio de trabajo?" : "Can I customize my workspace?"}
            </h3>
            <p className="mt-2">
              {lang === "es" 
                ? "Sí. Puedes habilitar o deshabilitar módulos, crear secciones completamente personalizadas con tus propios campos y reorganizar tu navegación." 
                : "Yes. You can enable or disable modules, create completely custom sections with your own fields, and reorganize your navigation."}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface">
              {lang === "es" ? "¿Funciona en móvil?" : "Does it work on mobile?"}
            </h3>
            <p className="mt-2">
              {lang === "es" 
                ? "Sí. Manageo es totalmente receptivo y admite la instalación como aplicación web progresiva (PWA) para una experiencia similar a una aplicación nativa en tu teléfono." 
                : "Yes. Manageo is fully responsive and supports Progressive Web App (PWA) installation for a native-like experience on your phone."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
