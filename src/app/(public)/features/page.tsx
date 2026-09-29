import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/features",
    title: lang === "es" ? "Funciones" : "Features",
    description: lang === "es" ? "Explora las funciones de Manageo." : "Explore the features of Manageo.",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">
        {lang === "es" ? "Funciones" : "Features"}
      </h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">
          {lang === "es" ? "Productividad y Tareas" : "Productivity & Tasks"}
        </h2>
        <p>
          {lang === "es" 
            ? "Organiza tu día con un potente sistema de gestión de tareas que admite prioridad, fechas de vencimiento y categorización. Nunca dejes que un elemento de acción importante se te escape." 
            : "Organize your day with a powerful task management system that supports priority, due dates, and categorization. Never let an important action item slip through the cracks."}
        </p>
        
        <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">
          {lang === "es" ? "Dinero e Inversiones" : "Money & Investments"}
        </h2>
        <p>
          {lang === "es" 
            ? "Haz un seguimiento de tus cuentas, presupuestos e inversiones. Una vista completa de tus activos líquidos y salud financiera en un panel unificado." 
            : "Track your accounts, monitor budgets, and log transactions. A complete view of your liquid assets and financial health in one unified dashboard."}
        </p>
        
        <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">
          {lang === "es" ? "Secciones Personalizadas" : "Custom Sections"}
        </h2>
        <p>
          {lang === "es" 
            ? "El verdadero poder de Manageo radica en las secciones personalizadas. Construye tus propias bases de datos para cualquier cosa que necesites." 
            : "The true power of Manageo lies in custom sections. Build your own databases with custom fields to track books, CRM contacts, hardware inventory, or anything else you need."}
        </p>
      </div>
    </div>
  );
}
