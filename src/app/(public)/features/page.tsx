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

  const features = [
    {
      title: lang === "es" ? "Gestión de Tareas y Prioridades" : "Task Management & Priorities",
      description:
        lang === "es"
          ? "Organiza tu flujo de trabajo diario con un potente sistema de tareas. Asigna prioridades (Baja, Media, Alta, Urgente), fechas de vencimiento, etiquetas y estados visuales para que nada importante se te escape."
          : "Organize your daily workflow with an intuitive task system. Assign priorities (Low, Medium, High, Urgent), due dates, tags, and visual status states so important items never slip through the cracks.",
    },
    {
      title: lang === "es" ? "Hábitos y Rutinas Recurrentes" : "Habits & Recurring Routines",
      description:
        lang === "es"
          ? "Construye hábitos sostenibles con rutinas diarias, semanales o mensuales. Registra rachas continuas y recibe notificaciones programadas para mantener tu consistencia personal."
          : "Build sustainable habits with daily, weekly, or monthly routines. Track streaks and get scheduled reminders to maintain personal consistency day after day.",
    },
    {
      title: lang === "es" ? "Captura Rápida de Notas e Ideas" : "Fast Notes & Idea Capture",
      description:
        lang === "es"
          ? "Un bloc de notas fluido con formato enriquecido para volcar pensamientos, borradores y actas de reuniones al instante. Todo indexado y accesible en milisegundos."
          : "A lightning-fast note-taking and idea capture system. Jot down thoughts, drafts, and meeting minutes with rich formatting, instantly searchable and organized.",
    },
    {
      title: lang === "es" ? "Bóveda Cifrada de Contraseñas (AES-256-GCM)" : "Encrypted Vault (AES-256-GCM)",
      description:
        lang === "es"
          ? "Protege tus credenciales, claves API y secretos con cifrado militar del lado del servidor. Soporta contraseñas personalizadas por elemento y recuperación por OTP vía email."
          : "Secure your credentials, API keys, and sensitive documents with military-grade server-side encryption. Supports isolated item passwords and email OTP verification.",
    },
    {
      title: lang === "es" ? "Control de Cuentas, Dinero y Facturación" : "Money, Accounts & Invoicing",
      description:
        lang === "es"
          ? "Monitorea cuentas bancarias, tarjetas y efectivo en una sola vista. Registra transacciones con cálculo automático de saldos y emite facturas en PDF con numeración protegida."
          : "Monitor bank accounts, credit cards, and cash in one unified dashboard. Log transactions with automated balance adjustments and generate immutable PDF invoices.",
    },
    {
      title: lang === "es" ? "Bases de Datos y Secciones Personalizadas" : "Custom Sections & Dynamic Databases",
      description:
        lang === "es"
          ? "El poder de construir tus propias bases de datos. Diseña campos a medida (texto, números, fechas, tags, selección múltiple y enlaces) para libros, inventarios o CRM personal."
          : "The power to build your own databases without code. Create custom fields (text, numbers, dates, tags, multi-select, and links) for reading lists, inventories, or client CRMs.",
    },
    {
      title: lang === "es" ? "Espacios de Trabajo y Colaboración en Equipo" : "Team Workspaces & Collaboration",
      description:
        lang === "es"
          ? "Invita a tu equipo con enlaces seguros tokenizados. Asigna roles de administrador o miembro para colaborar en proyectos compartidos sin mezclar tus finanzas privadas."
          : "Invite team members via tokenized secure links. Grant admin or member roles to collaborate on shared projects while keeping your personal financial data private.",
    },
    {
      title: lang === "es" ? "PWA Instalable y Modo Offline" : "Installable PWA & Offline Support",
      description:
        lang === "es"
          ? "Instala Manageo en iOS, Android, Windows y macOS como una app nativa. Disfruta de rendimiento ultrarrápido, caché de Service Worker y diseño adaptado a cualquier pantalla."
          : "Install Manageo on iOS, Android, Windows, and macOS as a native-grade app. Enjoy instant load speeds, service worker caching, and notch-aware responsive layouts.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-6 font-headline">
        {lang === "es" ? "Funcionalidades de Manageo" : "Manageo Core Features"}
      </h1>
      <p className="text-on-surface-variant text-lg leading-relaxed mb-12 max-w-2xl">
        {lang === "es"
          ? "Descubre cada módulo diseñado para transformar tu productividad, simplificar tus sistemas y darte control total sobre tu vida diaria."
          : "Explore every module engineered to transform your productivity, streamline your systems, and give you complete control over your daily workflow."}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feat) => (
          <div
            key={feat.title}
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 transition-all hover:border-outline-variant/60"
          >
            <h2 className="text-xl font-bold text-on-surface mb-3">{feat.title}</h2>
            <p className="text-on-surface-variant leading-relaxed text-sm sm:text-base">
              {feat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
