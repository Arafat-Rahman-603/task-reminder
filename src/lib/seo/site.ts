import type { MetadataRoute } from "next";

type Language = "es" | "en";

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface RouteSeoCopy {
  title: string;
  description: string;
  keywords: string[];
  category: string;
}

interface RouteSeoConfig {
  changeFrequency: ChangeFrequency;
  priority: number;
  localized: Record<Language, RouteSeoCopy>;
}

const FALLBACK_SITE_URL = "https://manageo.axiomixs.com";

function normalizeSiteUrl(raw?: string) {
  if (!raw) return FALLBACK_SITE_URL;

  const value = raw.trim();
  if (!value) return FALLBACK_SITE_URL;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return FALLBACK_SITE_URL;
    }
    return parsed.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_NAME = "Manageo";
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL);
export const SITE_TAGLINE =
  "All-in-one task manager, notes, vault, reminders and money workspace.";
export const SITE_HOST = new URL(SITE_URL).host;
export const DEFAULT_LANGUAGE: Language = "es";
export const SUPPORTED_METADATA_LANGUAGES: Language[] = ["es", "en"];
export const SOCIAL_OG_IMAGE_PATH = "/opengraph-image";
export const SOCIAL_TWITTER_IMAGE_PATH = SOCIAL_OG_IMAGE_PATH;
export const SOCIAL_IMAGE_ALT = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const OG_LOCALES: Record<Language, string> = { es: "es_ES", en: "en_US" };

/**
 * Brand + category keyword cluster. Keep the brand term first so branded queries
 * stay covered, then broad category intent, then high-intent long-tail terms.
 */
export const BASE_KEYWORDS: Record<Language, string[]> = {
  es: [
    "Manageo",
    "software de productividad",
    "app de productividad todo en uno",
    "gestor de tareas",
    "mejor gestor de tareas",
    "app de listas de tareas",
    "app para tomar notas",
    "app de recordatorios",
    "recordatorios inteligentes",
    "gestor de contrasenas",
    "boveda segura de contrasenas",
    "boveda cifrada personal",
    "app para controlar gastos",
    "seguimiento de dinero personal",
    "control de ingresos y gastos",
    "rastreador de habitos",
    "seguimiento de rutinas diarias",
    "software de organizacion personal",
    "alternativa a notion",
    "alternativa a todoist",
    "sistema operativo personal",
    "software de colaboracion para equipos",
    "espacio de trabajo colaborativo",
    "app pwa de productividad",
    "gestor de proyectos personal",
    "base de datos personalizada sin codigo",
    "organizador de vida personal",
  ],
  en: [
    "Manageo",
    "productivity software",
    "all in one productivity app",
    "task manager",
    "best task manager app",
    "to do list app",
    "note taking app",
    "reminder app",
    "smart task reminders",
    "password manager",
    "secure vault app",
    "encrypted personal vault",
    "money tracker app",
    "expense tracker",
    "personal budget and cash flow",
    "habit tracker",
    "daily routine planner",
    "personal organization software",
    "notion alternative",
    "todoist alternative",
    "personal operating system",
    "team workspace software",
    "collaborative workspace",
    "pwa productivity app",
    "personal project manager",
    "no code custom database",
    "life organizer software",
  ],
};

export const PUBLIC_ROUTE_SEO: Record<string, RouteSeoConfig> = {
  "/": {
    changeFrequency: "weekly",
    priority: 1,
    localized: {
      es: {
        title: "Manageo | Gestor de tareas, notas, boveda y dinero en una app",
        description:
          "Manageo combina gestor de tareas, recordatorios, notas, boveda de contrasenas, control de gastos y secciones personalizadas en un solo software de productividad personal.",
        keywords: [
          "app de productividad personal",
          "gestor de tareas y notas",
          "organizador personal todo en uno",
          "app de boveda y contrasenas",
          "control de gastos personal",
          "base de datos personal",
          "app todo en uno gratis",
          "planificador diario inteligente",
          "bloc de notas seguro",
          "espacio de trabajo personal y de equipo",
          "mejor app organizadora personal",
        ],
        category: "software de productividad",
      },
      en: {
        title: "Manageo | Task Manager, Notes, Vault and Money Tracker in One App",
        description:
          "Manageo combines a task manager, reminders, notes, a secure password vault, expense tracking and custom sections in one personal productivity app for web and mobile.",
        keywords: [
          "personal productivity app",
          "task manager and notes app",
          "all in one organizer app",
          "password vault app",
          "personal expense tracker",
          "custom database app",
          "free all in one workspace",
          "smart daily planner app",
          "secure note taking system",
          "personal and team workspace",
          "best personal organizer app",
        ],
        category: "productivity software",
      },
    },
  },
  "/features": {
    changeFrequency: "weekly",
    priority: 0.9,
    localized: {
      es: {
        title: "Funciones de Manageo | Tareas, notas, boveda, dinero y secciones",
        description:
          "Descubre las funciones de Manageo: gestion de tareas con prioridades, notas, ideas, boveda cifrada, seguimiento de dinero y bases de datos personalizadas con campos propios.",
        keywords: [
          "funciones gestor de tareas",
          "app de notas y tareas",
          "boveda cifrada aes 256",
          "base de datos personalizada",
          "seguimiento financiero personal",
          "secciones personalizadas app",
          "tags y prioridades tareas",
          "tablero kanban de tareas",
          "recordatorios de rutinas recurrentes",
          "almacenamiento cifrado de documentos",
          "espacios de trabajo con roles",
        ],
        category: "funciones de software",
      },
      en: {
        title: "Manageo Features | Tasks, Notes, Vault, Money and Custom Sections",
        description:
          "Explore Manageo features: task management with priorities and tags, notes, ideas, an encrypted vault, money tracking and custom database sections with your own fields.",
        keywords: [
          "task management software features",
          "notes and reminders app",
          "encrypted vault workspace",
          "custom database software",
          "personal finance tracking app",
          "kanban board app",
          "custom fields app",
          "recurring routine reminders",
          "aes 256 document encryption",
          "role based team workspace",
          "offline pwa capabilities",
        ],
        category: "software features",
      },
    },
  },
  "/pricing": {
    changeFrequency: "weekly",
    priority: 0.85,
    localized: {
      es: {
        title: "Precios de Manageo | Acceso temprano gratis y planes claros",
        description:
          "Consulta los precios de Manageo para organizacion personal y espacios de trabajo en equipo, con acceso temprano gratuito y planes que crecen contigo.",
        keywords: [
          "precio software de productividad",
          "gestor de tareas gratis",
          "app de productividad gratis",
          "planes para equipos",
          "alternativa gratis a notion",
          "coste app organizacion personal",
          "precios transparentes saas",
          "acceso temprano gratuito workspace",
        ],
        category: "precios de software",
      },
      en: {
        title: "Manageo Pricing | Free Early Access and Simple Workspace Plans",
        description:
          "See Manageo pricing for personal productivity and team workspaces, including free early access and upgrade paths as your team grows.",
        keywords: [
          "productivity software pricing",
          "free task manager app",
          "free productivity app",
          "team workspace pricing",
          "free notion alternative",
          "cheap organizer app",
          "transparent saas pricing",
          "free early access workspace",
        ],
        category: "software pricing",
      },
    },
  },
  "/security": {
    changeFrequency: "monthly",
    priority: 0.82,
    localized: {
      es: {
        title: "Seguridad de Manageo | Cuentas, boveda cifrada y datos aislados",
        description:
          "Conoce como Manageo protege tu cuenta, aisla los datos de cada usuario y espacio de trabajo, y mantiene la informacion sensible cifrada con controles del lado del servidor.",
        keywords: [
          "seguridad gestor de tareas",
          "boveda de contrasenas segura",
          "privacidad de datos saas",
          "cifrado aes 256 gcm",
          "aislamiento de datos por usuario",
          "proteccion de cuenta",
          "arquitectura zero knowledge",
          "almacenamiento seguro en la nube",
          "autenticacion otp y sesiones seguras",
        ],
        category: "seguridad de software",
      },
      en: {
        title: "Manageo Security | Secure Accounts, Encrypted Vault, Isolated Data",
        description:
          "Learn how Manageo protects your account, isolates data per user and workspace, and keeps sensitive information encrypted with server-side access controls.",
        keywords: [
          "secure task manager app",
          "secure password vault app",
          "data privacy software",
          "aes 256 encryption app",
          "per user data isolation",
          "account security saas",
          "zero knowledge security",
          "private cloud storage",
          "otp authentication and secure sessions",
        ],
        category: "software security",
      },
    },
  },
  "/about": {
    changeFrequency: "monthly",
    priority: 0.7,
    localized: {
      es: {
        title: "Acerca de Manageo | Un sistema operativo personal flexible",
        description:
          "Descubre la filosofia de Manageo y por que construimos un espacio de trabajo unico para tus tareas, tu dinero, tus ideas y tus propios sistemas personales.",
        keywords: [
          "acerca de manageo",
          "sistema operativo personal",
          "filosofia de productividad",
          "workspace flexible",
          "app modular personalizable",
          "minimalismo digital",
          "diseno de software centrado en privacidad",
        ],
        category: "marca de software",
      },
      en: {
        title: "About Manageo | A Flexible Personal Operating System",
        description:
          "Learn the philosophy behind Manageo and why it was built as one flexible workspace for your tasks, money, ideas and personal systems.",
        keywords: [
          "about manageo",
          "personal operating system",
          "productivity philosophy",
          "flexible workspace software",
          "modular productivity app",
          "digital minimalism",
          "privacy first software design",
        ],
        category: "software brand",
      },
    },
  },
  "/faq": {
    changeFrequency: "monthly",
    priority: 0.72,
    localized: {
      es: {
        title: "FAQ de Manageo | Preguntas sobre tareas, notas, PWA y equipos",
        description:
          "Respuestas sobre tareas, notas, espacios de trabajo en equipo, instalacion como app movil (PWA), personalizacion y seguridad dentro de Manageo.",
        keywords: [
          "faq manageo",
          "preguntas gestor de tareas",
          "workspace de productividad",
          "instalar app como pwa",
          "app movil de productividad",
          "dudas software de organizacion",
          "como usar manageo",
          "preguntas frecuentes boveda segura",
          "preguntas frecuentes finanzas personales",
        ],
        category: "ayuda de software",
      },
      en: {
        title: "Manageo FAQ | Tasks, Notes, PWA, Workspaces and Security Answers",
        description:
          "Answers about tasks, notes, team workspaces, mobile and PWA installation, customization and security inside Manageo.",
        keywords: [
          "manageo faq",
          "task manager questions",
          "productivity workspace help",
          "install app as pwa",
          "mobile productivity app",
          "organizer app answers",
          "how to use manageo",
          "secure vault faq",
          "personal finance tracking answers",
        ],
        category: "software help",
      },
    },
  },
  "/contact": {
    changeFrequency: "monthly",
    priority: 0.65,
    localized: {
      es: {
        title: "Contacto de Manageo | Habla con el equipo",
        description:
          "Contacta con el equipo de Manageo para ventas, soporte tecnico, consultas de seguridad o dudas sobre espacios de trabajo y acceso temprano.",
        keywords: [
          "contacto manageo",
          "soporte de software",
          "contacto saas",
          "soporte tecnico app productividad",
          "contactar con manageo",
          "atencion al cliente manageo",
        ],
        category: "contacto",
      },
      en: {
        title: "Contact Manageo | Talk to the Team",
        description:
          "Contact the Manageo team for sales, technical support, security questions or help with workspaces and early access.",
        keywords: [
          "contact manageo",
          "software support",
          "saas contact page",
          "productivity app support",
          "manageo help",
          "customer service manageo",
        ],
        category: "contact",
      },
    },
  },
  "/terms": {
    changeFrequency: "yearly",
    priority: 0.3,
    localized: {
      es: {
        title: "Terminos de servicio de Manageo",
        description:
          "Lee los terminos de servicio de Manageo, incluyendo cuentas, uso aceptable y responsabilidades relacionadas con la plataforma.",
        keywords: [
          "terminos de servicio manageo",
          "terminos saas",
          "condiciones de uso",
          "acuerdo de usuario manageo",
          "terminos de servicio software",
        ],
        category: "legal",
      },
      en: {
        title: "Manageo Terms of Service",
        description:
          "Read the Manageo terms of service covering accounts, acceptable use, and platform responsibilities.",
        keywords: [
          "manageo terms of service",
          "saas terms",
          "software terms of use",
          "manageo user agreement",
          "productivity software terms",
        ],
        category: "legal",
      },
    },
  },
  "/privacy": {
    changeFrequency: "yearly",
    priority: 0.3,
    localized: {
      es: {
        title: "Politica de privacidad de Manageo",
        description:
          "Consulta como Manageo recopila, usa y protege la informacion personal y los datos almacenados dentro del producto.",
        keywords: [
          "privacidad manageo",
          "politica de privacidad saas",
          "proteccion de datos",
          "privacidad de datos de usuario",
          "seguridad y privacidad manageo",
        ],
        category: "legal",
      },
      en: {
        title: "Manageo Privacy Policy",
        description:
          "Review how Manageo collects, uses, and protects personal information and data stored inside the product.",
        keywords: [
          "manageo privacy policy",
          "saas privacy policy",
          "data protection policy",
          "user data privacy",
          "manageo data security and privacy",
        ],
        category: "legal",
      },
    },
  },
  "/cookies": {
    changeFrequency: "yearly",
    priority: 0.25,
    localized: {
      es: {
        title: "Politica de cookies de Manageo",
        description:
          "Descubre como Manageo usa solo cookies esenciales para autenticacion, sesiones y funcionamiento basico de la aplicacion.",
        keywords: [
          "cookies manageo",
          "cookies esenciales",
          "politica de cookies saas",
          "uso de cookies aplicacion web",
          "privacidad de cookies manageo",
        ],
        category: "legal",
      },
      en: {
        title: "Manageo Cookie Policy",
        description:
          "Understand how Manageo uses essential cookies for authentication, session state, and basic application functionality.",
        keywords: [
          "manageo cookies",
          "essential cookies",
          "saas cookie policy",
          "web app cookie usage",
          "manageo privacy cookies",
        ],
        category: "legal",
      },
    },
  },
  "/acceptable-use": {
    changeFrequency: "yearly",
    priority: 0.2,
    localized: {
      es: {
        title: "Politica de uso aceptable de Manageo",
        description:
          "Revisa las acciones prohibidas y las reglas de uso aceptable para mantener segura la plataforma Manageo.",
        keywords: [
          "uso aceptable manageo",
          "politica de uso",
          "reglas de plataforma",
          "normas comunitarias saas",
          "seguridad de plataforma manageo",
        ],
        category: "legal",
      },
      en: {
        title: "Manageo Acceptable Use Policy",
        description:
          "Review prohibited actions and acceptable-use rules that help keep the Manageo platform secure.",
        keywords: [
          "manageo acceptable use",
          "platform rules",
          "acceptable use policy",
          "saas code of conduct",
          "manageo platform security guidelines",
        ],
        category: "legal",
      },
    },
  },
  "/financial-disclaimer": {
    changeFrequency: "yearly",
    priority: 0.2,
    localized: {
      es: {
        title: "Aviso financiero de Manageo",
        description:
          "Lee el aviso financiero de Manageo y entiende que las funciones de dinero e inversiones son solo para organizacion e informacion.",
        keywords: [
          "aviso financiero manageo",
          "descargo financiero",
          "seguimiento de dinero",
          "responsabilidad financiera app",
          "terminos de modulos financieros",
        ],
        category: "legal",
      },
      en: {
        title: "Manageo Financial Disclaimer",
        description:
          "Read the Manageo financial disclaimer and understand that money and investment features are for organization and information only.",
        keywords: [
          "manageo financial disclaimer",
          "money tracking disclaimer",
          "investment feature disclaimer",
          "financial tracking liability",
          "personal finance terms",
        ],
        category: "legal",
      },
    },
  },
};

export const PUBLIC_ROUTES = Object.keys(PUBLIC_ROUTE_SEO);

export const HOME_PATH = "/";

/** Short human labels used for breadcrumb structured data and internal linking. */
export const ROUTE_LABELS: Record<string, Record<Language, string>> = {
  "/": { es: "Inicio", en: "Home" },
  "/features": { es: "Funciones", en: "Features" },
  "/pricing": { es: "Precios", en: "Pricing" },
  "/security": { es: "Seguridad", en: "Security" },
  "/about": { es: "Acerca de", en: "About" },
  "/faq": { es: "Preguntas frecuentes", en: "FAQ" },
  "/contact": { es: "Contacto", en: "Contact" },
  "/terms": { es: "Terminos de servicio", en: "Terms of Service" },
  "/privacy": { es: "Privacidad", en: "Privacy Policy" },
  "/cookies": { es: "Cookies", en: "Cookie Policy" },
  "/acceptable-use": { es: "Uso aceptable", en: "Acceptable Use" },
  "/financial-disclaimer": { es: "Aviso financiero", en: "Financial Disclaimer" },
};

export function getRouteLabel(path: string, lang: Language) {
  const normalizedPath = normalizePath(path);
  const label = ROUTE_LABELS[normalizedPath]?.[lang];
  if (label) return label;

  const slug = normalizedPath.split("/").filter(Boolean).pop() || "home";
  return slug.replace(/-/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

export function normalizePath(path: string) {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Absolute URL for a route in a given language.
 * Spanish (default) has no prefix, English lives under `/en` (rewritten by the proxy).
 * No trailing slashes: `trailingSlash` is disabled, so `/en/` would 308-redirect to `/en`.
 */
export function getAlternateUrl(lang: Language, path: string) {
  const normalizedPath = normalizePath(path);
  const isHome = normalizedPath === HOME_PATH;

  if (lang === "en") {
    return isHome ? `${SITE_URL}/en` : `${SITE_URL}/en${normalizedPath}`;
  }

  return isHome ? `${SITE_URL}/` : `${SITE_URL}${normalizedPath}`;
}

export function getAbsoluteUrl(path: string) {
  return getAlternateUrl(DEFAULT_LANGUAGE, path);
}

export function isEnglishPath(path: string) {
  return path === "/en" || path.startsWith("/en/");
}

export function getRouteSeo(path: string, lang: Language) {
  const config = PUBLIC_ROUTE_SEO[normalizePath(path)];
  return config?.localized[lang];
}

export function getRouteSitemapConfig(path: string) {
  return PUBLIC_ROUTE_SEO[normalizePath(path)];
}

/**
 * Single source of truth for `sitemap.xml`: priorities, change frequencies and
 * hreflang alternates are derived from PUBLIC_ROUTE_SEO so the sitemap can never
 * drift from the metadata emitted by each page.
 */
export function getSitemapEntries(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.flatMap((path) => {
    const config = PUBLIC_ROUTE_SEO[path];
    if (!config) return [];

    const esUrl = getAlternateUrl("es", path);
    const enUrl = getAlternateUrl("en", path);
    const languages = { es: esUrl, en: enUrl, "x-default": esUrl };

    return SUPPORTED_METADATA_LANGUAGES.map((lang) => ({
      url: lang === "en" ? enUrl : esUrl,
      lastModified,
      changeFrequency: config.changeFrequency,
      priority: lang === "en" ? Math.max(config.priority - 0.05, 0.1) : config.priority,
      alternates: { languages },
    }));
  });
}
