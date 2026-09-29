import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/security",
    title: lang === "es" ? "Seguridad" : "Security",
    description: lang === "es" ? "Cómo protegemos tus datos en Manageo." : "How we protect your data in Manageo.",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">
        {lang === "es" ? "Seguridad" : "Security"}
      </h1>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">
          {lang === "es" ? "Autenticación y Sesiones" : "Authentication & Sessions"}
        </h2>
        <p>
          {lang === "es" 
            ? "Utilizamos mecanismos de autenticación estándar de la industria para asegurar tu cuenta. Las sesiones se gestionan de forma segura y las contraseñas se cifran fuertemente." 
            : "We use industry-standard authentication mechanisms to secure your account. Sessions are managed securely and passwords are heavily hashed."}
        </p>
        
        <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">
          {lang === "es" ? "Aislamiento de Datos" : "Data Isolation"}
        </h2>
        <p>
          {lang === "es" 
            ? "Tus datos te pertenecen. Nuestra arquitectura de autorización del lado del servidor asegura que los datos del usuario estén aislados; solo puedes acceder a los registros que pertenecen a tu sesión autenticada." 
            : "Your data belongs to you. Our server-side authorization architecture ensures that user data is isolated; you can only access records belonging to your authenticated session."}
        </p>
        
        <h2 className="text-xl font-bold text-on-surface mt-10 mb-4">
          {lang === "es" ? "Revisión Continua" : "Continuous Review"}
        </h2>
        <p>
          {lang === "es" 
            ? "Las prácticas de seguridad se revisan continuamente para garantizar la seguridad y privacidad de tu información personal." 
            : "Security practices are continuously reviewed to ensure the safety and privacy of your personal information."}
        </p>
      </div>
    </div>
  );
}
