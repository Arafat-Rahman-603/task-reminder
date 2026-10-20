import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/about",
    title: lang === "es" ? "Acerca de Manageo" : "About Manageo",
    description: lang === "es" ? "La filosofía detrás de Manageo." : "The philosophy behind Manageo.",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();

  const values = [
    {
      title: lang === "es" ? "Unificación sin Caos" : "Unification Without Clutter",
      description:
        lang === "es"
          ? "Tu vida y tus proyectos no deberían estar divididos entre diez aplicaciones diferentes. Manageo reúne tareas, dinero, notas e ideas en una sola experiencia coherente y fluida."
          : "Your life and projects shouldn't be fragmented across ten disparate tools. Manageo brings tasks, money, notes, and ideas together into one coherent, fluid experience.",
    },
    {
      title: lang === "es" ? "Modularidad a tu Medida" : "Modularity that Adapts to You",
      description:
        lang === "es"
          ? "No te imponemos un método rígido. Activa solo los módulos que necesitas y crea bases de datos personalizadas para tus colecciones, finanzas o proyectos."
          : "We never force a rigid methodology. Turn on only the modules you use and build custom databases tailored to your collections, finances, or projects.",
    },
    {
      title: lang === "es" ? "Privacidad y Soberanía de Datos" : "Strict Privacy & Data Sovereignty",
      description:
        lang === "es"
          ? "Creemos en el software ético: sin venta de datos, sin cookies invasivas y con cifrado AES-256 para tus credenciales más confidenciales."
          : "We believe in ethical software: zero data selling, no tracking cookies, and military-grade AES-256 encryption for your most confidential credentials.",
    },
    {
      title: lang === "es" ? "Velocidad y Calma Visual" : "Speed & Calm Aesthetics",
      description:
        lang === "es"
          ? "Diseñado en modo oscuro forzado con tokens visuales Stitch, tipografía cuidada y tiempos de carga instantáneos para que puedas concentrarte en lo que realmente importa."
          : "Crafted in an intentional dark aesthetic with Stitch design tokens, refined typography, and instant load speeds so you can focus on what truly matters.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-6 font-headline">
        {lang === "es" ? "Acerca de Manageo" : "About Manageo"}
      </h1>
      <p className="text-on-surface-variant text-lg sm:text-xl leading-relaxed mb-12 max-w-3xl">
        {lang === "es"
          ? "Manageo nace como un Sistema Operativo Personal (Personal Operating System) diseñado para personas y equipos que buscan claridad mental, orden absoluto y soberanía sobre sus datos."
          : "Manageo was conceived as a Personal Operating System built for individuals and teams seeking mental clarity, absolute order, and true sovereignty over their data."}
      </p>

      <div className="prose prose-invert max-w-none text-on-surface-variant space-y-6 mb-16 text-base leading-relaxed">
        <p>
          {lang === "es"
            ? "Vivimos rodeados de notificaciones dispersas, hojas de cálculo desactualizadas y aplicaciones aisladas que aumentan la fatiga cognitiva. Manageo cambia este paradigma: convierte tu flujo diario de trabajo en un sistema integral donde cada tarea, cada idea y cada registro financiero se complementan de manera natural."
            : "We live surrounded by scattered notifications, outdated spreadsheets, and siloed apps that increase cognitive fatigue. Manageo changes this paradigm: it turns your daily workflow into a unified system where every task, every idea, and every financial entry naturally connect."}
        </p>
      </div>

      <h2 className="text-2xl font-bold text-on-surface mb-8 font-headline">
        {lang === "es" ? "Nuestros Principios de Diseño" : "Our Core Principles"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {values.map((v) => (
          <div
            key={v.title}
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 transition-all hover:border-outline-variant/60"
          >
            <h3 className="text-lg font-bold text-on-surface mb-3">{v.title}</h3>
            <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
              {v.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
