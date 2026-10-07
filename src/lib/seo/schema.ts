export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Manageo",
    "url": "http://localhost:3000",
    "logo": "http://localhost:3000/logo.png"
  };
}

export function getWebSiteSchema(lang: "es" | "en") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Manageo",
    "url": lang === "en" ? "http://localhost:3000/en/" : "http://localhost:3000/",
    "inLanguage": lang,
  };
}

export function getWebApplicationSchema(lang: "es" | "en") {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Manageo",
    "url": lang === "en" ? "http://localhost:3000/en/" : "http://localhost:3000/",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "description": lang === "es"
      ? "Gestiona todo en un solo lugar. Un Sistema Operativo Personal flexible que se adapta a ti."
      : "Manage everything in one place. A flexible Personal Operating System that adapts to you.",
    "inLanguage": lang
  };
}
