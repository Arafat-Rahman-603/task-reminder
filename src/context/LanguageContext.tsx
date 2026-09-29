"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateUserLanguage } from "@/actions/language.actions";
import { useSession } from "next-auth/react";

type Language = "en" | "es" | "de" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    hero_title_1: "Organize everything.",
    hero_title_2: "In one place.",
    hero_subtitle: "A flexible Personal Operating System that adapts to you. Manage your daily life, track your money, focus on your goals, and capture ideas—all in a beautifully unified workspace.",
    get_started: "Get Started",
    explore_product: "Explore the Product",
    features: "Features",
    pricing: "Pricing",
    security: "Security",
    contact: "Contact",
    login: "Log in",
    settings: "Settings",
    language: "Language",
    my_sections: "My Sections",
    daily_planning: "Daily Planning",
    daily_desc: "Stay on top of your tasks and projects with powerful prioritization and reminders.",
    money: "Money & Investments",
    money_desc: "Track accounts, budgets, and investments. Understand your net worth at a glance.",
    custom_sections: "Custom Sections",
    custom_desc: "Build custom databases for anything—from reading lists to CRM. It's your system.",
    system_way: "Your System, Your Way",
    system_desc: "App isn't a rigid structure you have to squeeze your life into. It's a modular toolkit that adapts to how you naturally work.",
    point_1: "Enable or disable core modules anytime",
    point_2: "Create custom sections with custom fields",
    point_3: "Design your own dashboard layout",
    point_4: "Organize navigation to fit your workflow",
    ready: "Ready to get organized?",
    ready_desc: "Join professionals, students, and creators who are already managing their life in one unified workspace.",
    create_account: "Create Your Account",
    system: "System",
    dashboard: "Dashboard",
    today: "Today",
    productivity: "Productivity",
    tasks: "Tasks",
    ideas: "Ideas",
    profile: "Profile",
    control_center: "Control Center",
    personalization: "Personalization",
    modules: "Modules",
    navigation: "Navigation",
    account: "Account",
    profile_security: "Profile & Security",
    app_preferences: "App Preferences",
    language_preferences: "Language Preferences",
    language_desc: "Select your preferred language for the application interface.",
    language_note: "Note: Language changes are applied immediately to supported components such as the public landing page, authentication flows, and main navigation elements.",
    how_it_works: "How it works",
    how_it_works_desc: "See how Manageo adapts to your needs and streamlines your workflow effortlessly.",
    step_1: "Setup your workspace",
    step_1_desc: "Configure your dashboard with the widgets and modules you need.",
    step_2: "Connect your data",
    step_2_desc: "Bring in your tasks, sprints, and financial accounts into one view.",
    step_3: "Automate routines",
    step_3_desc: "Set up team routines and recurring tasks to run on autopilot.",
    pricing_sneak: "Simple, Transparent Pricing",
    pricing_sneak_desc: "Choose the plan that perfectly fits your personal or team needs. No hidden fees.",
    free_plan: "Starter",
    pro_plan: "Professional",
    free_price: "$0/mo",
    pro_price: "$3.69/mo",
    see_all_pricing: "View full pricing details"
  },
  es: {
    hero_title_1: "Organiza todo.",
    hero_title_2: "En un solo lugar.",
    hero_subtitle: "Un Sistema Operativo Personal flexible que se adapta a ti. Gestiona tu vida diaria, haz un seguimiento de tu dinero, concéntrate en tus objetivos y captura ideas—todo en un espacio de trabajo bellamente unificado.",
    get_started: "Empezar",
    explore_product: "Explorar el Producto",
    features: "Características",
    pricing: "Precios",
    security: "Seguridad",
    contact: "Contacto",
    login: "Iniciar sesión",
    settings: "Ajustes",
    language: "Idioma",
    my_sections: "Mis Secciones",
    daily_planning: "Planificación Diaria",
    daily_desc: "Mantente al tanto de tus tareas y proyectos con priorización y recordatorios.",
    money: "Dinero e Inversiones",
    money_desc: "Rastrea cuentas, presupuestos e inversiones. Entiende tu patrimonio de un vistazo.",
    custom_sections: "Secciones Personalizadas",
    custom_desc: "Construye bases de datos personalizadas para cualquier cosa. Es tu sistema.",
    system_way: "Tu Sistema, A Tu Manera",
    system_desc: "No es una estructura rígida en la que tengas que encajar tu vida. Es un kit adaptable a cómo trabajas naturalmente.",
    point_1: "Activa o desactiva módulos principales",
    point_2: "Crea secciones personalizadas con campos",
    point_3: "Diseña el diseño de tu panel de control",
    point_4: "Organiza la navegación para tu flujo de trabajo",
    ready: "¿Listo para organizarte?",
    ready_desc: "Únete a profesionales, estudiantes y creadores que ya gestionan su vida en un espacio unificado.",
    create_account: "Crea tu Cuenta",
    system: "Sistema",
    dashboard: "Panel de control",
    today: "Hoy",
    productivity: "Productividad",
    tasks: "Tareas",
    ideas: "Ideas",
    profile: "Perfil",
    control_center: "Centro de control",
    personalization: "Personalización",
    modules: "Módulos",
    navigation: "Navegación",
    account: "Cuenta",
    profile_security: "Perfil y Seguridad",
    app_preferences: "Preferencias de la aplicación",
    language_preferences: "Preferencias de idioma",
    language_desc: "Selecciona tu idioma preferido para la interfaz de la aplicación.",
    language_note: "Nota: Los cambios de idioma se aplican inmediatamente a componentes compatibles como la página de inicio pública, la autenticación y la navegación principal.",
    how_it_works: "Cómo funciona",
    how_it_works_desc: "Descubre cómo Manageo se adapta a tus necesidades y optimiza tu flujo de trabajo sin esfuerzo.",
    step_1: "Configura tu espacio",
    step_1_desc: "Configura tu panel con los widgets y módulos que necesitas.",
    step_2: "Conecta tus datos",
    step_2_desc: "Incorpora tus tareas, sprints y cuentas financieras en una sola vista.",
    step_3: "Automatiza rutinas",
    step_3_desc: "Configura rutinas de equipo y tareas recurrentes en piloto automático.",
    pricing_sneak: "Precios simples y transparentes",
    pricing_sneak_desc: "Elige el plan que se adapte perfectamente a tus necesidades personales o de equipo. Sin comisiones ocultas.",
    free_plan: "Principiante",
    pro_plan: "Profesional",
    free_price: "$0/mes",
    pro_price: "$3.69/mes",
    see_all_pricing: "Ver todos los detalles de precios"
  },
  de: {
    hero_title_1: "Organisiere alles.",
    hero_title_2: "An einem Ort.",
    hero_subtitle: "Ein flexibles Personal Operating System, das sich an dich anpasst. Verwalte dein tägliches Leben, verfolge dein Geld, fokussiere dich auf deine Ziele und erfasse Ideen – alles in einem Arbeitsbereich.",
    get_started: "Loslegen",
    explore_product: "Produkt erkunden",
    features: "Eigenschaften",
    pricing: "Preise",
    security: "Sicherheit",
    contact: "Kontakt",
    login: "Anmelden",
    settings: "Einstellungen",
    language: "Sprache",
    my_sections: "Meine Bereiche",
    daily_planning: "Tagesplanung",
    daily_desc: "Behalten Sie den Überblick über Ihre Aufgaben und Projekte.",
    money: "Geld & Investitionen",
    money_desc: "Verfolgen Sie Konten, Budgets und Investitionen.",
    custom_sections: "Benutzerdefinierte Bereiche",
    custom_desc: "Erstellen Sie benutzerdefinierte Datenbanken für alles.",
    system_way: "Ihr System, Ihr Weg",
    system_desc: "Eine modulare Toolbox, die sich an Ihre natürliche Arbeitsweise anpasst.",
    point_1: "Kernmodule jederzeit aktivieren/deaktivieren",
    point_2: "Benutzerdefinierte Bereiche mit eigenen Feldern",
    point_3: "Gestalten Sie Ihr eigenes Dashboard-Layout",
    point_4: "Navigation an Ihren Workflow anpassen",
    ready: "Bereit, sich zu organisieren?",
    ready_desc: "Schließen Sie sich Profis und Kreativen an, die ihr Leben bereits vereint verwalten.",
    create_account: "Konto erstellen",
    system: "System",
    dashboard: "Dashboard",
    today: "Heute",
    productivity: "Produktivität",
    tasks: "Aufgaben",
    ideas: "Ideen",
    profile: "Profil",
    control_center: "Kontrollzentrum",
    personalization: "Personalisierung",
    modules: "Module",
    navigation: "Navigation",
    account: "Konto",
    profile_security: "Profil & Sicherheit",
    app_preferences: "App-Einstellungen",
    language_preferences: "Spracheinstellungen",
    language_desc: "Wählen Sie Ihre bevorzugte Sprache für die Anwendungsoberfläche.",
    language_note: "Hinweis: Sprachänderungen werden sofort auf unterstützte Komponenten wie die Startseite und die Hauptnavigation angewendet.",
    how_it_works: "Wie es funktioniert",
    how_it_works_desc: "Sehen Sie, wie sich Manageo an Ihre Bedürfnisse anpasst und Ihren Workflow mühelos optimiert.",
    step_1: "Richten Sie Ihren Arbeitsbereich ein",
    step_1_desc: "Konfigurieren Sie Ihr Dashboard mit den benötigten Widgets und Modulen.",
    step_2: "Verbinden Sie Ihre Daten",
    step_2_desc: "Bringen Sie Ihre Aufgaben, Sprints und Finanzkonten in eine Ansicht.",
    step_3: "Routinen automatisieren",
    step_3_desc: "Richten Sie Teamroutinen und wiederkehrende Aufgaben für den Autopiloten ein.",
    pricing_sneak: "Einfache, transparente Preise",
    pricing_sneak_desc: "Wählen Sie den Plan, der perfekt zu Ihren persönlichen oder Team-Bedürfnissen passt.",
    free_plan: "Anfänger",
    pro_plan: "Fachmann",
    free_price: "$0/mo",
    pro_price: "$3.69/mo",
    see_all_pricing: "Alle Preisdetails anzeigen"
  },
  fr: {
    hero_title_1: "Tout organiser.",
    hero_title_2: "En un seul endroit.",
    hero_subtitle: "Un système d'exploitation personnel flexible qui s'adapte à vous. Gérez votre vie quotidienne, suivez votre argent, concentrez-vous sur vos objectifs et capturez des idées — tout cela dans un espace unifié.",
    get_started: "Commencer",
    explore_product: "Explorer le Produit",
    features: "Caractéristiques",
    pricing: "Tarification",
    security: "Sécurité",
    contact: "Contact",
    login: "Connexion",
    settings: "Paramètres",
    language: "Langue",
    my_sections: "Mes Sections",
    daily_planning: "Planification Quotidienne",
    daily_desc: "Restez au top de vos tâches et projets avec priorisation.",
    money: "Argent & Investissements",
    money_desc: "Suivez vos comptes, budgets et investissements.",
    custom_sections: "Sections Personnalisées",
    custom_desc: "Créez des bases de données personnalisées pour tout.",
    system_way: "Votre Système, Votre Façon",
    system_desc: "C'est une boîte à outils modulaire qui s'adapte à votre façon de travailler.",
    point_1: "Activer ou désactiver les modules de base",
    point_2: "Créer des sections personnalisées",
    point_3: "Concevoir la mise en page de votre tableau de bord",
    point_4: "Organiser la navigation pour votre flux de travail",
    ready: "Prêt à vous organiser ?",
    ready_desc: "Rejoignez des professionnels qui gèrent déjà leur vie dans un espace unifié.",
    create_account: "Créer Votre Compte",
    system: "Système",
    dashboard: "Tableau de bord",
    today: "Aujourd'hui",
    productivity: "Productivité",
    tasks: "Tâches",
    ideas: "Idées",
    profile: "Profil",
    control_center: "Centre de contrôle",
    personalization: "Personnalisation",
    modules: "Modules",
    navigation: "Navigation",
    account: "Compte",
    profile_security: "Profil et sécurité",
    app_preferences: "Préférences de l'application",
    language_preferences: "Préférences de langue",
    language_desc: "Sélectionnez votre langue préférée pour l'interface de l'application.",
    language_note: "Remarque : Les changements de langue sont appliqués immédiatement aux composants pris en charge.",
    how_it_works: "Comment ça marche",
    how_it_works_desc: "Découvrez comment Manageo s'adapte à vos besoins et rationalise votre flux de travail.",
    step_1: "Configurez votre espace de travail",
    step_1_desc: "Configurez votre tableau de bord avec les widgets et modules dont vous avez besoin.",
    step_2: "Connectez vos données",
    step_2_desc: "Rassemblez vos tâches, sprints et comptes financiers dans une seule vue.",
    step_3: "Automatiser les routines",
    step_3_desc: "Configurez des routines d'équipe et des tâches récurrentes en pilote automatique.",
    pricing_sneak: "Tarification simple et transparente",
    pricing_sneak_desc: "Choisissez le plan qui correspond parfaitement à vos besoins personnels ou d'équipe.",
    free_plan: "Débutant",
    pro_plan: "Professionnel",
    free_price: "$0/mois",
    pro_price: "$3.69/mois",
    see_all_pricing: "Voir tous les détails des prix"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, defaultLanguage = "es" }: { children: React.ReactNode, defaultLanguage?: "es" | "en" | "de" | "fr" | string }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage as Language);
  const [mounted, setMounted] = useState(false);
  const { update } = useSession();

  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("app_language") as Language;
    if (saved && ["en", "es", "de", "fr"].includes(saved)) {
      setLanguageState(saved);
      document.cookie = `NEXT_LOCALE=${saved}; path=/; max-age=31536000`;
    }
    setMounted(true);
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;
    
    // Sync with backend (non-blocking)
    updateUserLanguage(lang).catch(console.error);
    
    // Update next-auth session JWT so middleware sees the new language immediately
    if (update) {
      await update({ language: lang });
    }
    
    router.refresh();
  };

  const t = (key: string, fallback?: string) => {
    const langObj = translations[language] || translations["en"];
    return langObj[key] || translations["en"][key] || fallback || key;
  };

  // Prevent hydration mismatch by optionally suppressing it, 
  // but we MUST provide the context to children.
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
