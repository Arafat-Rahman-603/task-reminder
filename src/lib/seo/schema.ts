export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Manageo",
    "url": "https://manageo.axiomixs.com",
    "logo": "https://manageo.axiomixs.com/logo.png"
  };
}

export function getWebSiteSchema(lang: "es" | "en") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Manageo",
    "url": lang === "en" ? "https://manageo.axiomixs.com/en/" : "https://manageo.axiomixs.com/",
    "inLanguage": lang,
  };
}

export function getWebApplicationSchema(lang: "es" | "en") {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Manageo",
    "url": lang === "en" ? "https://manageo.axiomixs.com/en/" : "https://manageo.axiomixs.com/",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "description": lang === "es"
      ? "Gestiona todo en un solo lugar. Un Sistema Operativo Personal flexible que se adapta a ti."
      : "Manage everything in one place. A flexible Personal Operating System that adapts to you.",
    "inLanguage": lang
  };
}
