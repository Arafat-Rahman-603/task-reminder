import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";
import { getFaqSchema, serializeJsonLd } from "@/lib/seo/schema";

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

  const faqs = [
    {
      question: lang === "es" ? "¿Qué es Manageo y para qué sirve?" : "What is Manageo and what is it used for?",
      answer:
        lang === "es"
          ? "Manageo es un Sistema Operativo Personal todo en uno diseñado para unificar la gestión de tareas, notas rápidas, ideas, recordatorios recurrentes, una bóveda cifrada de contraseñas, seguimiento financiero de cuentas e ingresos/gastos, y bases de datos personalizadas en una sola plataforma fluida y sin distracciones."
          : "Manageo is an all-in-one Personal Operating System designed to unify task management, quick notes, ideas, recurring reminders, an encrypted password vault, financial tracking of accounts and cash flow, and custom databases in one seamless, distraction-free platform.",
    },
    {
      question: lang === "es" ? "¿Puedo personalizar los módulos y secciones a mi medida?" : "Can I customize modules and sections to fit my workflow?",
      answer:
        lang === "es"
          ? "Sí, totalmente. Puedes activar o desactivar módulos según lo que utilices, reordenar la barra de navegación lateral y crear Secciones Personalizadas con campos propios (texto, números, fechas, etiquetas, selección múltiple y enlaces) para adaptarlo a cualquier sistema personal o empresarial."
          : "Yes, completely. You can enable or disable individual modules, reorder the sidebar navigation, and build Custom Sections with your own field types (text, numbers, dates, tags, multi-select, and links) to fit any personal or business workflow.",
    },
    {
      question: lang === "es" ? "¿Cómo protege la Bóveda mis contraseñas y datos sensibles?" : "How does the Vault protect my passwords and sensitive data?",
      answer:
        lang === "es"
          ? "La Bóveda de Manageo utiliza cifrado militar AES-256-GCM. Admite tanto una contraseña maestra de bóveda como contraseñas independientes por cada elemento confidencial. Además, cuentas con recuperación segura por OTP al correo electrónico en caso de olvido."
          : "Manageo's Vault utilizes military-grade AES-256-GCM encryption. It supports both a global master vault password and isolated custom passwords per sensitive item, backed by secure email OTP password recovery.",
    },
    {
      question: lang === "es" ? "¿Cómo funciona el seguimiento de dinero, finanzas y presupuestos?" : "How does the money, finance and budget tracking work?",
      answer:
        lang === "es"
          ? "Manageo te permite registrar cuentas bancarias, billeteras digitales y tarjetas de crédito con balance automático. Puedes registrar ingresos, gastos, transferencias entre cuentas y generar facturas en PDF con numeración secuencial inmutable."
          : "Manageo enables you to manage bank accounts, digital wallets, and credit cards with automatic balance calculations. You can track income, expenses, account transfers, and generate professional PDF invoices with immutable sequence numbering.",
    },
    {
      question: lang === "es" ? "¿Puedo colaborar con mi equipo en Espacios de Trabajo compartidos?" : "Can I collaborate with my team in shared Workspaces?",
      answer:
        lang === "es"
          ? "Sí. Manageo cuenta con soporte multitenant para Espacios de Trabajo en equipo. Puedes invitar a colaboradores por correo con enlaces tokenizados seguros y asignar roles de administrador o miembro para colaborar en proyectos y tareas compartidas, manteniendo siempre aislados tus datos financieros personales."
          : "Yes. Manageo features multi-tenant team Workspaces. You can invite collaborators via secure tokenized links and assign admin or member roles to work on shared projects and tasks, while your personal financial data remains strictly isolated and private.",
    },
    {
      question: lang === "es" ? "¿Cómo funcionan los recordatorios y las notificaciones?" : "How do reminders and notifications work?",
      answer:
        lang === "es"
          ? "Puedes configurar recordatorios inteligentes con fecha y hora exacta para tareas y rutinas diarias. Manageo envía notificaciones push directas a tu navegador y dispositivo móvil mediante Service Worker y notificaciones push web."
          : "You can schedule smart reminders with exact dates and times for tasks and daily habits. Manageo delivers push notifications directly to your browser and mobile device via Service Workers and web push notifications.",
    },
    {
      question: lang === "es" ? "¿Funciona en teléfonos móviles y sin conexión a internet (PWA)?" : "Does Manageo work on mobile and offline (PWA)?",
      answer:
        lang === "es"
          ? "Sí. Manageo está construido como una Aplicación Web Progresiva (PWA) de alto rendimiento. Puedes instalarla directamente en la pantalla de inicio de tu iPhone, iPad, Android, Windows o Mac. Cuenta con caché de servicio y diseño adaptable a la muesca o barra de estado de cualquier pantalla."
          : "Yes. Manageo is engineered as a high-performance Progressive Web App (PWA). You can install it directly to the home screen of your iPhone, iPad, Android, Windows, or Mac. It includes service worker caching and notch-aware safe-area layout support.",
    },
    {
      question: lang === "es" ? "¿Tiene costo o existe un plan gratuito de Manageo?" : "Is there a free plan or early access option?",
      answer:
        lang === "es"
          ? "Manageo ofrece acceso temprano gratuito con funcionalidades completas para organizarte personalmente. A medida que tu equipo crece o requieres capacidades ampliadas de almacenamiento, dispones de planes premium flexibles."
          : "Manageo offers full-featured free early access for personal organization. As your team expands or you need higher storage limits, flexible premium plans are available.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(getFaqSchema(faqs)) }}
      />
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-8 font-headline">
        {lang === "es" ? "Preguntas Frecuentes (FAQ)" : "Frequently Asked Questions (FAQ)"}
      </h1>
      <p className="text-on-surface-variant mb-12 text-base leading-relaxed">
        {lang === "es"
          ? "Encuentra respuestas rápidas sobre cómo organizar tus tareas, proteger tus contraseñas, registrar tus finanzas y colaborar en Manageo."
          : "Find quick answers about organizing your tasks, securing passwords, tracking your finances, and collaborating inside Manageo."}
      </p>
      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6">
        <div className="space-y-8">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-6 transition-colors hover:border-outline-variant/60"
            >
              <h2 className="text-lg font-bold text-on-surface mb-3">{faq.question}</h2>
              <p className="leading-relaxed text-on-surface-variant">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
