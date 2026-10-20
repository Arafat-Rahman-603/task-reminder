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

  const securityPillars = [
    {
      title: lang === "es" ? "Cifrado Militar AES-256-GCM" : "AES-256-GCM Military-Grade Encryption",
      description:
        lang === "es"
          ? "Los elementos de tu Bóveda personal están protegidos con cifrado autenticado AES-256-GCM. Admite tanto contraseña global como contraseñas independientes por cada registro confidencial, blindando tus datos contra accesos no autorizados."
          : "Personal Vault records are secured using authenticated AES-256-GCM encryption. The system supports both a global master password and isolated per-item custom passwords to shield your confidential data from unauthorized access.",
    },
    {
      title: lang === "es" ? "Aislamiento de Datos por Inquilino y Sesión" : "Multi-Tenant & User Session Data Isolation",
      description:
        lang === "es"
          ? "Todas las consultas a la base de datos se validan rigurosamente en el servidor. Tus datos financieros y de bóveda permanecen estrictamente atados a tu identidad de usuario personal, sin mezclarse jamás con espacios de trabajo compartidos."
          : "Every database query is strictly gatekept server-side. Your financial transactions, accounts, and vault items remain permanently bound to your personal user identity, never leaked to shared workspaces.",
    },
    {
      title: lang === "es" ? "Entrega Privada de Archivos con URLs Firmadas" : "Authenticated Asset Delivery with Signed URLs",
      description:
        lang === "es"
          ? "Los archivos adjuntos, documentos e imágenes se almacenan como activos autenticados privados. No se exponen URLs públicas; en su lugar, se generan URLs firmadas de corta duración (1 hora) accesibles solo tras validar tu sesión."
          : "Uploaded attachments, documents, and images are stored as private authenticated assets. Raw public URLs are never exposed; instead, short-lived (1-hour) signed URLs are generated only after active session verification.",
    },
    {
      title: lang === "es" ? "Autenticación Robusta y Recuperación OTP" : "Robust Authentication & Email OTP Recovery",
      description:
        lang === "es"
          ? "Las contraseñas de cuentas se procesan con algoritmos de hash seguros de alto costo computacional (bcrypt). Si olvidas una contraseña personalizada de bóveda, cuentas con verificación de código único OTP por correo electrónico."
          : "Account passwords are protected with high-work-factor cryptographic hashing (bcrypt). If a custom vault password is forgotten, secure email-based one-time-password (OTP) verification enables authenticated recovery.",
    },
    {
      title: lang === "es" ? "Privacidad Total: Sin Cookies de Rastreo" : "Zero Tracking Cookies & Data Sovereignty",
      description:
        lang === "es"
          ? "No vendemos datos ni utilizamos cookies publicitarias o de seguimiento invasivo de terceros. Solo empleamos cookies esenciales de sesión y autenticación para el funcionamiento seguro de tu sistema."
          : "We do not sell user data and use zero third-party advertising or surveillance cookies. Only essential, encrypted session cookies are utilized to power your secure personal workspace.",
    },
    {
      title: lang === "es" ? "Auditoría Continua y Pruebas Automatizadas" : "Continuous Verification & Automated Testing",
      description:
        lang === "es"
          ? "El código de Manageo se valida continuamente mediante suites exhaustivas de pruebas de seguridad, permisos y control de acceso multitenant antes de cada despliegue a producción."
          : "Manageo's codebase is validated against exhaustive automated security, permission boundary, and multi-tenant access-control test suites prior to every production release.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-6 font-headline">
        {lang === "es" ? "Seguridad y Privacidad en Manageo" : "Security & Privacy at Manageo"}
      </h1>
      <p className="text-on-surface-variant text-lg leading-relaxed mb-12 max-w-2xl">
        {lang === "es"
          ? "Tus datos te pertenecen. Conoce los principios criptográficos y la arquitectura de aislamiento con la que protegemos tu información más valiosa."
          : "Your data belongs to you. Discover the cryptographic principles and isolation architecture we use to safeguard your most sensitive information."}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {securityPillars.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 transition-all hover:border-outline-variant/60"
          >
            <h2 className="text-xl font-bold text-on-surface mb-3">{pillar.title}</h2>
            <p className="text-on-surface-variant leading-relaxed text-sm sm:text-base">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
