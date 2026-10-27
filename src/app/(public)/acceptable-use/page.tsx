import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";
import Link from "next/link";
import { ShieldAlert, Terminal, Server, FileX } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/acceptable-use",
    title: lang === "es" ? "Política de Uso Aceptable | Manageo" : "Acceptable Use Policy | Manageo",
    description:
      lang === "es"
        ? "Política de Uso Aceptable de Manageo. Reglas claras sobre seguridad del sistema, prohibición de abuso, conducta colaborativa y protección de infraestructura."
        : "Manageo Acceptable Use Policy. Clear rules regarding system security, prohibited abusive activities, team collaboration standards, and infrastructure protection.",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();
  const isEs = lang === "es";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 w-full text-on-surface antialiased">
      {/* Header */}
      <div className="mb-12 border-b border-surface-variant/40 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 mb-4">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{isEs ? "Integridad del Sistema y Conducta" : "Platform Integrity & Conduct Standard"}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-headline mb-4">
          {isEs ? "Política de Uso Aceptable" : "Acceptable Use Policy"}
        </h1>
        <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
          {isEs
            ? "Última actualización: 20 de octubre de 2026. Esta Política establece las normas y restricciones obligatorias para proteger la seguridad, estabilidad y confianza de todos los usuarios de Manageo."
            : "Last updated: October 20, 2026. This Acceptable Use Policy defines mandatory rules and restrictions engineered to safeguard system stability, security, and trust for all Manageo users."}
        </p>
      </div>

      {/* Grid of Prohibited Domains */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="p-4 rounded-2xl bg-surface border border-surface-variant/40">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-3">
            <Terminal className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isEs ? "Cero Vulneración de Seguridad" : "No Security Exploits"}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isEs
              ? "Prohibido escanear puertos, forzar tokens OTP o intentar vulnerar el aislamiento multi-inquilino."
              : "Strictly no unauthorized scanning, OTP brute-forcing, or cross-tenant boundary tampering."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-variant/40">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-3">
            <Server className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isEs ? "Cero Abuso de Infraestructura" : "No Resource Abuse"}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isEs
              ? "Prohibido usar Cloudinary como CDN público o saturar la plataforma con bots automatizados."
              : "No using Cloudinary storage as an open public CDN or launching automated scraper floods."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-variant/40">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-3">
            <FileX className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isEs ? "Cero Contenido Ilegal" : "No Illegal Content"}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isEs
              ? "Tolerancia cero con malware, phishing, suplantación de identidad o infracción de derechos."
              : "Zero tolerance for malware distribution, phishing, fraud, or copyright infringement."}
          </p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="space-y-10 text-on-surface-variant text-sm sm:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">01.</span>
            {isEs ? "Propósito y Ámbito de Aplicación" : "Purpose & Scope"}
          </h2>
          <p>
            {isEs
              ? "Manageo está diseñado para proporcionar un entorno seguro, privado y productivo a individuos y equipos de trabajo. Al utilizar el servicio, te comprometes formalmente a respetar las normas descritas en esta política. Estas reglas aplican a todas las funciones, APIs, cargas de archivos adjuntos y mecanismos de invitación colaborativa."
              : "Manageo is engineered to provide a high-performance, private, and dependable ecosystem for individual productivity and team collaboration. By accessing or using the platform, you agree not to misuse our systems or assist any third party in doing so. These conditions apply across all web routes, APIs, attachment storage, and collaborative workspace invitations."}
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">02.</span>
            {isEs ? "Conductas y Acciones Estrictamente Prohibidas" : "Strictly Prohibited Conduct & Activities"}
          </h2>
          <p>
            {isEs
              ? "Queda terminantemente prohibido utilizar Manageo para cualquiera de los siguientes fines:"
              : "You may not engage in any of the following activities on or through Manageo:"}
          </p>
          <div className="space-y-3 mt-2">
            <div className="p-3.5 rounded-xl bg-surface border border-rose-500/20">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                {isEs ? "A. Seguridad del Sistema e Intrusión" : "A. Security Probing & System Tampering"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {isEs
                  ? "Sondear, escanear o probar vulnerabilidades de nuestros servidores o bases de datos; intentar eludir los controles de acceso de espacios de trabajo (gatekeeper); forzar de forma masiva endpoints de autenticación o tokens OTP; o realizar ataques de denegación de servicio (DDoS)."
                  : "Scanning, probing, or testing system vulnerabilities without explicit written consent; attempting to bypass server-side workspace access gates; launching brute-force attacks against OTP or authentication endpoints; or executing denial-of-service (DoS/DDoS) floods."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-rose-500/20">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                {isEs ? "B. Carga de Software Malicioso y Amenazas" : "B. Malicious Payloads & Threat Distribution"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {isEs
                  ? "Subir o distribuir virus, troyanos, gusanos, ransomware, scripts maliciosos o archivos ejecutables camuflados a través de nuestro sistema unificado de adjuntos."
                  : "Uploading, hosting, or disseminating viruses, worms, trojans, ransomware, obfuscated scripts, or dangerous binary files through our attachment system."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-rose-500/20">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                {isEs ? "C. Fraude, Falsificación y Phishing" : "C. Fraud, Impersonation & Phishing"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {isEs
                  ? "Suplantar la identidad de cualquier persona o entidad, incluidos los administradores de Manageo o AXIOMIXS; emitir facturas con intenciones fraudulentas o de lavado de dinero; o engañar a otros usuarios mediante tácticas de ingeniería social."
                  : "Impersonating any individual, entity, or Manageo/AXIOMIXS administrator; issuing fraudulent invoices or utilizing counter sequences for deceptive financial transactions; or operating deceptive phishing campaigns."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-rose-500/20">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                {isEs ? "D. Abuso de Almacenamiento y Ancho de Banda" : "D. Storage & Bandwidth Exploitation"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {isEs
                  ? "Utilizar la plataforma como servicio de distribución pública masiva de archivos (CDN abierto), alojar material protegido por derechos de autor sin permiso o generar cargas abusivas que comprometan la disponibilidad para los demás clientes."
                  : "Using Manageo as an open public content delivery network (CDN); uploading pirated media; or generating automated programmatic traffic designed to degrade service performance for other users."}
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">03.</span>
            {isEs ? "Estándares para Espacios de Trabajo Colaborativos" : "Collaborative Workspace Ethics"}
          </h2>
          <p>
            {isEs
              ? "Al utilizar las funciones de colaboración en equipo y membresías compartidas, te comprometes a:"
              : "When utilizing team workspaces and invitation mechanisms, you agree to:"}
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
            <li>
              {isEs
                ? "Enviar invitaciones a espacios de trabajo únicamente a personas con las que mantengas una relación profesional legítima."
                : "Distribute cryptographic workspace invitation tokens exclusively to authorized team collaborators with whom you maintain an established professional relationship."}
            </li>
            <li>
              {isEs
                ? "No enviar spam, publicidad no solicitada ni enlaces maliciosos a través de las descripciones de tareas compartidas."
                : "Refrain from unsolicited bulk invitations (invite spamming) or embedding deceptive external URLs in shared task descriptions."}
            </li>
            <li>
              {isEs
                ? "Mantener un trato respetuoso y profesional en todos los espacios de trabajo colaborativos."
                : "Uphold professional and lawful conduct within shared comments, custom fields, and task assignments."}
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">04.</span>
            {isEs ? "Supervisión, Detección y Medidas de Cumplimiento" : "Enforcement & Account Sanctions"}
          </h2>
          <p>
            {isEs
              ? "Nos reservamos el derecho de investigar cualquier sospecha fundada de infracción de esta política. Ante la detección de actividades abusivas, Manageo podrá adoptar cualquiera de las siguientes medidas sin previo aviso:"
              : "Manageo reserves the right to investigate suspected violations of this policy. Upon identifying prohibited activities, we may take immediate corrective actions including:"}
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
            <li>{isEs ? "Eliminación inmediata de archivos o registros infractores." : "Immediate deletion of infringing attachments or abusive custom databases."}</li>
            <li>{isEs ? "Suspensión temporal del acceso a la cuenta o al espacio de trabajo afectado." : "Temporary suspension or quarantine of the offending user account or workspace."}</li>
            <li>{isEs ? "Cancelación permanente e irrevocable de la cuenta del usuario infractor." : "Permanent, non-refundable termination of user credentials and associated tenants."}</li>
            <li>{isEs ? "Notificación y cooperación con las autoridades policiales o judiciales competentes en casos de ciberdelincuencia." : "Referral of illegal conduct or security attacks to competent law enforcement agencies."}</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">05.</span>
            {isEs ? "Reporte de Incidentes y Contacto" : "Reporting Violations & Security Incidents"}
          </h2>
          <p>
            {isEs
              ? "Si descubres una vulnerabilidad de seguridad o detectas que algún usuario está violando esta Política de Uso Aceptable, te agradecemos que nos lo comuniques de inmediato:"
              : "If you detect security vulnerabilities, abusive behavior, or copyright violations within Manageo, please contact our security team immediately:"}
          </p>
          <div className="p-4 rounded-xl bg-surface border border-surface-variant/40 space-y-1 text-xs sm:text-sm">
            <p><strong className="text-white">Manageo Security & Abuse Response</strong></p>
            <p>Email: <a href="mailto:manageo@axiomixs.com" className="text-stitch-primary hover:underline">manageo@axiomixs.com</a> / <a href="mailto:info@axiomixs.com" className="text-stitch-primary hover:underline">info@axiomixs.com</a></p>
            <p>AXIOMIXS — Platform Security Office</p>
          </div>
        </section>

      </div>

      {/* Footer Navigation */}
      <div className="mt-16 pt-8 border-t border-surface-variant/30 flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface-variant">
        <span>© {new Date().getFullYear()} Manageo. {isEs ? "Todos los derechos reservados." : "All rights reserved."}</span>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-white transition-colors">
            {isEs ? "Términos de Servicio" : "Terms of Service"}
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            {isEs ? "Política de Privacidad" : "Privacy Policy"}
          </Link>
          <Link href="/security" className="hover:text-white transition-colors">
            {isEs ? "Seguridad" : "Security"}
          </Link>
        </div>
      </div>
    </div>
  );
}
