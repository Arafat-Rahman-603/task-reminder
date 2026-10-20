import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";
import Link from "next/link";
import { Shield, EyeOff, Lock, Database, Trash2, CheckCircle2 } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/privacy",
    title: lang === "es" ? "Política de Privacidad | Manageo" : "Privacy Policy | Manageo",
    description:
      lang === "es"
        ? "Política de Privacidad de Manageo. Conoce cómo protegemos tus datos, el cifrado AES-256-GCM de la bóveda, el principio de cero venta de datos y tus derechos de privacidad."
        : "Manageo Privacy Policy. Learn how we safeguard your personal data, our AES-256-GCM encrypted vault, zero data selling policy, and GDPR/CCPA compliance.",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();
  const isEs = lang === "es";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 w-full text-on-surface antialiased">
      {/* Header */}
      <div className="mb-12 border-b border-surface-variant/40 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stitch-primary/10 border border-stitch-primary/20 text-xs font-semibold text-stitch-primary mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>{isEs ? "Compromiso de Privacidad y Soberanía" : "Privacy & Data Sovereignty"}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-headline mb-4">
          {isEs ? "Política de Privacidad" : "Privacy Policy"}
        </h1>
        <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
          {isEs
            ? "Última actualización: 20 de octubre de 2026. Tu privacidad no es una opción; es la base arquitectónica sobre la cual fue construido Manageo."
            : "Last updated: October 20, 2026. Your privacy is not an afterthought; it is the core architectural principle upon which Manageo is built."}
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="p-4 rounded-2xl bg-surface border border-surface-variant/40">
          <div className="w-8 h-8 rounded-xl bg-stitch-primary/10 flex items-center justify-center text-stitch-primary mb-3">
            <EyeOff className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isEs ? "Cero Venta de Datos" : "We Never Sell Data"}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isEs
              ? "Nunca vendemos, alquilamos ni comercializamos tu información personal ni tus hábitos con anunciantes."
              : "We never monetize, sell, or rent your personal records, routines, or finances to data brokers."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-variant/40">
          <div className="w-8 h-8 rounded-xl bg-stitch-primary/10 flex items-center justify-center text-stitch-primary mb-3">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isEs ? "Bóveda Cero-Conocimiento" : "Encrypted Vault Secrets"}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isEs
              ? "Tus secretos y contraseñas usan AES-256-GCM. Nuestro personal técnico no puede leerlos."
              : "Passwords and credentials in your Vault are secured with AES-256-GCM. We cannot view your secrets."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-variant/40">
          <div className="w-8 h-8 rounded-xl bg-stitch-primary/10 flex items-center justify-center text-stitch-primary mb-3">
            <Trash2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isEs ? "Eliminación Total y Permanente" : "True Account Deletion"}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isEs
              ? "Si decides eliminar tu cuenta, todos tus registros y archivos en la nube se eliminan permanentemente."
              : "When you delete your account, your data and cloud attachments are purged permanently."}
          </p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="space-y-10 text-on-surface-variant text-sm sm:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">01.</span>
            {isEs ? "Compromiso Fundamental de Privacidad" : "Our Fundamental Privacy Commitment"}
          </h2>
          <p>
            {isEs
              ? "Manageo, desarrollado por AXIOMIXS, fue creado bajo la convicción de que las herramientas de productividad personal deben respetar la intimidad de los usuarios. No rastreamos tus movimientos a través de la web, no perfilamos tu comportamiento para mostrarte anuncios y no compartimos tus datos financieros con agencias de crédito ni corredores de datos."
              : "Manageo, operated by AXIOMIXS, was built on the core conviction that productivity tools should enhance focus without compromising personal privacy. We do not track you across external websites, we do not build psychological behavioral profiles for advertising, and we never share your financial records with credit bureaus or commercial third parties."}
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">02.</span>
            {isEs ? "Información que Recopilamos" : "Categories of Data We Collect"}
          </h2>
          <p>
            {isEs
              ? "Para garantizar el funcionamiento fluido de tus módulos y la sincronización entre dispositivos, recopilamos las siguientes categorías de información:"
              : "To operate the platform and maintain cross-device synchronization, we collect only the data necessary to provide our services:"}
          </p>
          <div className="space-y-3 mt-2">
            <div className="p-3.5 rounded-xl bg-surface border border-surface-variant/30">
              <h4 className="text-xs font-bold text-stitch-primary uppercase tracking-wider mb-1">
                {isEs ? "A. Información de Cuenta e Identidad" : "A. Identity & Account Credentials"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {isEs
                  ? "Nombre, dirección de correo electrónico, hash criptográfico de contraseña (bcrypt), preferencias de moneda e idioma, y membresías de espacios de trabajo."
                  : "Name, email address, salted password hash (bcrypt), currency preferences, language settings, and workspace memberships."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-surface-variant/30">
              <h4 className="text-xs font-bold text-stitch-primary uppercase tracking-wider mb-1">
                {isEs ? "B. Datos de Productividad y Secciones" : "B. Personal Productivity Records"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {isEs
                  ? "Tareas, sub-tareas, prioridades, rutinas de hábitos, notas personales, ideas y esquemas de bases de datos personalizadas creados por el usuario."
                  : "Tasks, subtasks, priority tags, habit routine streaks, personal notes, brainstorming entries, and custom section schema definitions created by you."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-surface-variant/30">
              <h4 className="text-xs font-bold text-stitch-primary uppercase tracking-wider mb-1">
                {isEs ? "C. Datos Financieros y Registros de Facturación" : "C. Financial Ledgers & Invoice Data"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {isEs
                  ? "Nombres de cuentas bancarias (sin números completos de tarjeta), registros de ingresos/gastos, recordatorios de vencimiento de facturas y registros de facturas generadas."
                  : "Account names and balances (never raw credit card numbers or banking passwords), transaction ledgers, recurring bill dates, and counter-generated invoice documents."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-surface-variant/30">
              <h4 className="text-xs font-bold text-stitch-primary uppercase tracking-wider mb-1">
                {isEs ? "D. Cargas Cifradas de la Bóveda (Vault)" : "D. Encrypted Vault Payloads"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {isEs
                  ? "Las contraseñas y secretos confidenciales se almacenan exclusivamente como texto cifrado mediante AES-256-GCM. Solo tú posees la clave para descifrarlos."
                  : "Confidential credentials, recovery seeds, and contracts stored in the Vault are persisted exclusively as AES-256-GCM ciphertext with initialization vectors (IV). Plaintext is never accessible to Manageo staff."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-surface-variant/30">
              <h4 className="text-xs font-bold text-stitch-primary uppercase tracking-wider mb-1">
                {isEs ? "E. Archivos y Adjuntos (Cloudinary)" : "E. Uploaded Documents & Media"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {isEs
                  ? "Archivos adjuntos subidos a tareas o transacciones, guardados en almacenamiento privado y accesibles solo mediante URLs firmadas con caducidad de 1 hora."
                  : "Attachments uploaded to tasks or notes, stored in authenticated private cloud storage and delivered strictly through short-lived (1-hour) signed URLs."}
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">03.</span>
            {isEs ? "Garantía de Aislamiento: Cero Contaminación de Datos" : "Tenant Isolation: Zero Data Contamination Standard"}
          </h2>
          <p>
            {isEs
              ? "En Manageo, la colaboración en equipo nunca expone tu vida privada. Los módulos personales (Finanzas, Bóveda, Cuentas y Recordatorios Financieros) están estrictamente limitados a tu ID de usuario personal y tienen prohibida su inclusión en el alcance de los espacios de trabajo colaborativos."
              : "In Manageo, team collaboration never compromises personal privacy. Personal modules (Finance, Vault, Bank Accounts, and Investment Reminders) are rigidly bound to your unique User ID and are architecturally excluded from workspace scoping. Even team workspace owners have zero visibility into your private financial ledgers or encrypted secrets."}
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">04.</span>
            {isEs ? "Subprocesadores de Confianza e Infraestructura" : "Trusted Infrastructure & Subprocessors"}
          </h2>
          <p>
            {isEs
              ? "Para prestar un servicio de alta fiabilidad, nos asociamos con proveedores de infraestructura tecnológica de clase mundial que cumplen con rigurosos estándares de seguridad:"
              : "To ensure enterprise-grade availability and security, we partner with specialized cloud infrastructure providers:"}
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>
              <strong className="text-white">MongoDB Atlas:</strong> {isEs ? "Base de datos en la nube con cifrado en reposo y en tránsito para almacenar tus registros." : "Cloud database cluster with encryption at rest and in transit for application data storage."}
            </li>
            <li>
              <strong className="text-white">Cloudinary:</strong> {isEs ? "Almacenamiento privado de imágenes y documentos bajo autenticación estricta." : "Authenticated cloud media storage with signed token verification and secure access controls."}
            </li>
            <li>
              <strong className="text-white">Firebase Cloud Messaging (Google):</strong> {isEs ? "Entrega de notificaciones push en tiempo real para recordatorios en navegadores y móviles." : "Real-time web push notification delivery for task and routine reminders."}
            </li>
            <li>
              <strong className="text-white">Brevo / Resend:</strong> {isEs ? "Envío de correos transaccionales (códigos OTP de verificación, invitaciones a espacios de trabajo y alertas de seguridad)." : "Transactional email delivery for OTP verification codes, workspace invites, and security alerts."}
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">05.</span>
            {isEs ? "Tus Derechos de Privacidad (GDPR, CCPA y Globales)" : "Your Global Privacy Rights (GDPR & CCPA)"}
          </h2>
          <p>
            {isEs
              ? "Independientemente de tu país de residencia, garantizamos los siguientes derechos fundamentales sobre tus datos:"
              : "Regardless of your geographic location, Manageo guarantees the following fundamental privacy rights:"}
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
            <li><strong className="text-white">{isEs ? "Derecho de Acceso:" : "Right to Access:"}</strong> {isEs ? "Puedes ver todos tus datos ingresados en la plataforma en cualquier momento." : "Inspect all data associated with your profile at any time."}</li>
            <li><strong className="text-white">{isEs ? "Derecho de Rectificación:" : "Right to Rectification:"}</strong> {isEs ? "Modificar o corregir cualquier registro incorrecto directamente desde tu panel." : "Update or correct inaccuracies in your personal records via your dashboard."}</li>
            <li><strong className="text-white">{isEs ? "Derecho de Eliminación (Derecho al Olvido):" : "Right to Erasure (Right to Be Forgotten):"}</strong> {isEs ? "Eliminar tu cuenta borra de manera inmediata e irreversible todos tus datos de nuestros servidores y archivos de Cloudinary." : "Requesting account deletion permanently wipes all database documents and associated cloud assets."}</li>
            <li><strong className="text-white">{isEs ? "Derecho a la Portabilidad:" : "Right to Portability:"}</strong> {isEs ? "Exportar tus datos para transferirlos a otros sistemas." : "Export your structured data for use in other personal management systems."}</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">06.</span>
            {isEs ? "Contacto del Oficial de Protección de Datos" : "Data Protection Contact"}
          </h2>
          <p>
            {isEs
              ? "Si tienes preguntas sobre esta Política de Privacidad, el manejo de tus datos o deseas ejercer tus derechos legales, comunícate con nosotros:"
              : "If you have questions regarding this Privacy Policy, your rights, or wish to exercise data erasure, please contact our team directly:"}
          </p>
          <div className="p-4 rounded-xl bg-surface border border-surface-variant/40 space-y-1 text-xs sm:text-sm">
            <p><strong className="text-white">Manageo Privacy & Security Team</strong></p>
            <p>Email: <a href="mailto:manageo@axiomixs.com" className="text-stitch-primary hover:underline">manageo@axiomixs.com</a> / <a href="mailto:info@axiomixs.com" className="text-stitch-primary hover:underline">info@axiomixs.com</a></p>
            <p>AXIOMIXS — Software Architecture & Security</p>
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
          <Link href="/cookies" className="hover:text-white transition-colors">
            {isEs ? "Política de Cookies" : "Cookie Policy"}
          </Link>
          <Link href="/security" className="hover:text-white transition-colors">
            {isEs ? "Seguridad" : "Security"}
          </Link>
        </div>
      </div>
    </div>
  );
}
