import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";
import Link from "next/link";
import { Cookie, CheckCircle2, XCircle } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/cookies",
    title: lang === "es" ? "Política de Cookies | Manageo" : "Cookie Policy | Manageo",
    description:
      lang === "es"
        ? "Política de Cookies de Manageo. Explicación transparente de nuestras cookies esenciales, ausencia total de rastreadores y almacenamiento seguro."
        : "Manageo Cookie Policy. Transparent explanation of our strictly essential authentication cookies, zero tracking scripts, and secure browser storage.",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();
  const isEs = lang === "es";

  const cookiesList = [
    {
      name: "next-auth.session-token / __Secure-next-auth.session-token",
      purpose: isEs
        ? "Mantiene tu sesión de usuario autenticada de forma segura mediante un token JWT cifrado."
        : "Maintains your authenticated user session securely using an encrypted JWT token.",
      type: isEs ? "Estrictamente Esencial" : "Strictly Essential",
      duration: isEs ? "30 días / Sesión" : "30 days / Session",
    },
    {
      name: "activeWorkspaceId",
      purpose: isEs
        ? "Recuerda el espacio de trabajo activo que estás visualizando (personal o equipo)."
        : "Remembers the active workspace context (personal vs. team tenant) you are viewing.",
      type: isEs ? "Funcional / Esencial" : "Functional / Essential",
      duration: isEs ? "30 días" : "30 days",
    },
    {
      name: "next-auth.csrf-token",
      purpose: isEs
        ? "Protege tu cuenta contra ataques de falsificación de peticiones en sitios cruzados (CSRF)."
        : "Protects your account against Cross-Site Request Forgery (CSRF) security attacks.",
      type: isEs ? "Seguridad Crítica" : "Critical Security",
      duration: isEs ? "Sesión" : "Session",
    },
    {
      name: "next-auth.callback-url",
      purpose: isEs
        ? "Almacena temporalmente la página a la que deseabas acceder antes de iniciar sesión."
        : "Temporarily stores the intended destination URL before redirecting to login.",
      type: isEs ? "Funcional" : "Functional",
      duration: isEs ? "Sesión" : "Session",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 w-full text-on-surface antialiased">
      {/* Header */}
      <div className="mb-12 border-b border-surface-variant/40 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stitch-primary/10 border border-stitch-primary/20 text-xs font-semibold text-stitch-primary mb-4">
          <Cookie className="w-3.5 h-3.5" />
          <span>{isEs ? "Transparencia Cero Rastreo" : "Zero-Tracking Transparency"}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-headline mb-4">
          {isEs ? "Política de Cookies" : "Cookie Policy"}
        </h1>
        <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
          {isEs
            ? "Última actualización: 20 de octubre de 2026. Manageo no utiliza cookies publicitarias ni de seguimiento de terceros. Solo utilizamos cookies estrictamente esenciales para el funcionamiento seguro de la plataforma."
            : "Last updated: October 20, 2026. Manageo does not use third-party marketing, analytics, or behavioral tracking cookies. We only store strictly essential cookies necessary for authentication and security."}
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <div className="p-5 rounded-2xl bg-surface border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEs ? "Lo que SÍ Utilizamos" : "What We DO Use"}</span>
          </div>
          <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-disc pl-5">
            <li>{isEs ? "Cookies esenciales de autenticación JWT (NextAuth)." : "Strictly essential JWT authentication cookies (NextAuth)."}</li>
            <li>{isEs ? "Cookies de prevención contra ataques CSRF." : "Anti-CSRF cryptographic security tokens."}</li>
            <li>{isEs ? "Cookie de selección del espacio de trabajo activo." : "Active workspace tenant switching context."}</li>
            <li>{isEs ? "Almacenamiento local para caché offline PWA." : "LocalStorage for PWA offline shell caching."}</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-rose-500/20 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <XCircle className="w-4 h-4" />
            <span>{isEs ? "Lo que NUNCA Utilizamos" : "What We NEVER Use"}</span>
          </div>
          <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-disc pl-5">
            <li>{isEs ? "Píxeles de Facebook / Meta o TikTok." : "Facebook / Meta or TikTok tracking pixels."}</li>
            <li>{isEs ? "Google Analytics invasivo o seguimiento de clics." : "Invasive Google Analytics or behavioral heatmaps."}</li>
            <li>{isEs ? "Cookies publicitarias o de retargeting de terceros." : "Third-party ad networks or retargeting cookies."}</li>
            <li>{isEs ? "Venta o cesión de identificadores de dispositivo." : "Monetization of device fingerprint identifiers."}</li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-10 text-on-surface-variant text-sm sm:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">01.</span>
            {isEs ? "¿Por qué no mostramos un molesto banner de cookies?" : "Why Manageo Has No Intrusive Cookie Banner"}
          </h2>
          <p>
            {isEs
              ? "Bajo el Reglamento General de Protección de Datos de la Unión Europea (GDPR), la Directiva ePrivacy y regulaciones similares, las cookies que son estrictamente necesarias para el servicio solicitado expresamente por el usuario están exentas del requisito de consentimiento previo. Dado que Manageo no instala rastreadores publicitarios ni cookies analíticas invasivas, no interrumpimos tu experiencia con banners innecesarios."
              : "Under the European Union General Data Protection Regulation (GDPR), the ePrivacy Directive, and global privacy standards, cookies strictly necessary to provide an explicitly requested digital service are legally exempt from prior opt-in consent requirements. Because Manageo uses zero advertising, tracking, or analytics cookies, we do not disrupt your workflow with intrusive consent banners."}
          </p>
        </section>

        {/* Section 2: Table */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">02.</span>
            {isEs ? "Inventario de Cookies Utilizadas" : "Complete Inventory of Cookies Used"}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-surface-variant/40">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-surface border-b border-surface-variant/40 text-white font-semibold">
                <tr>
                  <th className="p-3.5">{isEs ? "Nombre de la Cookie" : "Cookie Identifier"}</th>
                  <th className="p-3.5">{isEs ? "Propósito" : "Technical Purpose"}</th>
                  <th className="p-3.5">{isEs ? "Tipo" : "Classification"}</th>
                  <th className="p-3.5">{isEs ? "Duración" : "Lifespan"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/30 bg-surface/50">
                {cookiesList.map((c, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-mono text-xs text-stitch-primary">{c.name}</td>
                    <td className="p-3.5 text-slate-300">{c.purpose}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-surface-variant/40 text-[11px] font-medium text-white">
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-xs">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Browser Storage */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">03.</span>
            {isEs ? "Uso de Almacenamiento Local (LocalStorage e IndexedDB)" : "Client-Side Browser Storage (LocalStorage & PWA Cache)"}
          </h2>
          <p>
            {isEs
              ? "Además de cookies HTTP, Manageo aprovecha el almacenamiento local de tu navegador para ofrecer una experiencia PWA ultrarrápida y con soporte offline:"
              : "In addition to HTTP session cookies, Manageo utilizes modern browser storage to provide offline persistence and responsive progressive web app (PWA) interactions:"}
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
            <li>
              <strong className="text-white">PWA Service Worker Cache:</strong> {isEs ? "Almacena los archivos estáticos de la interfaz para que la app cargue de inmediato incluso con conexión inestable o sin internet." : "Caches core UI assets and shell layouts for instant startup and offline capability."}
            </li>
            <li>
              <strong className="text-white">Preferencias de Idioma (`manageo_language`):</strong> {isEs ? "Guarda tu preferencia de visualización entre español e inglés." : "Persists your preferred interface language across sessions."}
            </li>
            <li>
              <strong className="text-white">Banderas de Notificación:</strong> {isEs ? "Registra temporalmente cuando descartas avisos para no volver a mostrártelos repetidamente." : "Remembers dismissed notification alerts to avoid redundant dialogs."}
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">04.</span>
            {isEs ? "¿Cómo Administrar o Eliminar Cookies?" : "How to Manage or Delete Cookies"}
          </h2>
          <p>
            {isEs
              ? "Puedes configurar tu navegador web para rechazar o eliminar cookies en cualquier momento a través del menú de Configuración de Privacidad y Seguridad (Chrome, Firefox, Safari o Edge). Ten en cuenta que, dado que nuestras cookies son estrictamente necesarias para la autenticación, si bloqueas todas las cookies no podrás iniciar sesión en tu cuenta de Manageo."
              : "You can configure your browser to block or clear cookies at any time via your browser settings (Chrome, Safari, Firefox, Edge). Please note that because our cookies are strictly essential for cryptographic session authentication, disabling them will prevent you from logging into your Manageo account."}
          </p>
        </section>

      </div>

      {/* Footer Navigation */}
      <div className="mt-16 pt-8 border-t border-surface-variant/30 flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface-variant">
        <span>© {new Date().getFullYear()} Manageo. {isEs ? "Todos los derechos reservados." : "All rights reserved."}</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-white transition-colors">
            {isEs ? "Política de Privacidad" : "Privacy Policy"}
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            {isEs ? "Términos de Servicio" : "Terms of Service"}
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors">
            {isEs ? "Contacto" : "Contact"}
          </Link>
        </div>
      </div>
    </div>
  );
}
