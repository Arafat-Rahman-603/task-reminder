import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";
import Link from "next/link";
import { ShieldCheck, FileText, Lock, Users, Wallet, AlertCircle, ArrowRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/terms",
    title: lang === "es" ? "Términos de Servicio | Manageo" : "Terms of Service | Manageo",
    description:
      lang === "es"
        ? "Consulta los Términos de Servicio oficiales de Manageo. Conoce tus derechos, propiedad de datos, aislamiento de espacios de trabajo y condiciones de uso."
        : "Read the official Manageo Terms of Service. Understand your rights, 100% data ownership, workspace isolation guarantee, and service conditions.",
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
          <FileText className="w-3.5 h-3.5" />
          <span>{isEs ? "Acuerdo Legal Vinculante" : "Binding Legal Agreement"}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-headline mb-4">
          {isEs ? "Términos de Servicio" : "Terms of Service"}
        </h1>
        <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
          {isEs
            ? "Última actualización: 20 de octubre de 2026. Al registrarte o utilizar Manageo, aceptas los términos y condiciones aquí descritos."
            : "Last updated: October 20, 2026. By registering for or using Manageo, you agree to comply with and be legally bound by these Terms of Service."}
        </p>
      </div>

      {/* Quick Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="p-4 rounded-2xl bg-surface border border-surface-variant/40">
          <div className="w-8 h-8 rounded-xl bg-stitch-primary/10 flex items-center justify-center text-stitch-primary mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isEs ? "Propiedad Total de Datos" : "100% Data Ownership"}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isEs
              ? "Tú eres el dueño absoluto de tus tareas, notas, finanzas y registros. Nunca vendemos tu información."
              : "You retain full ownership of your tasks, notes, ledgers, and vault items. We never sell your data."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-variant/40">
          <div className="w-8 h-8 rounded-xl bg-stitch-primary/10 flex items-center justify-center text-stitch-primary mb-3">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isEs ? "Cifrado Militar AES-256" : "AES-256 Encrypted Vault"}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isEs
              ? "Tus contraseñas y claves privadas están cifradas. Ni nuestro equipo puede leer tus datos en texto plano."
              : "Your sensitive passwords and credentials are cryptographically secured with AES-256-GCM."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-variant/40">
          <div className="w-8 h-8 rounded-xl bg-stitch-primary/10 flex items-center justify-center text-stitch-primary mb-3">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isEs ? "Cero Contaminación de Datos" : "Zero Data Contamination"}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isEs
              ? "Tus finanzas y bóveda personal jamás se comparten con tus equipos ni espacios de trabajo colaborativos."
              : "Personal finances and vault secrets are strictly isolated from collaborative workspace members."}
          </p>
        </div>
      </div>

      {/* Main Legal Content */}
      <div className="space-y-10 text-on-surface-variant text-sm sm:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">01.</span>
            {isEs ? "Aceptación de los Términos y Visión General" : "Acceptance of Terms & Service Overview"}
          </h2>
          <p>
            {isEs
              ? "Manageo («la Aplicación», «nosotros», «nuestro» o «el Servicio»), desarrollado por AXIOMIXS, es un Sistema Operativo Personal modular y plataforma de colaboración para equipos. Al acceder, registrarte o utilizar cualquier funcionalidad de Manageo (en la web, PWA o dispositivos móviles), celebras un contrato vinculante sujeto a estos Términos de Servicio y a nuestra Política de Privacidad."
              : "Manageo (\"the Service\", \"we\", \"us\", or \"our\"), operated by AXIOMIXS, is a modular Personal Operating System and team collaboration platform. By creating an account, accessing, or using any feature of Manageo (via web browser, Progressive Web Application (PWA), or mobile interface), you enter into a binding contract governed by these Terms of Service and our incorporated Privacy Policy."}
          </p>
          <p>
            {isEs
              ? "Si no aceptas todos los términos y condiciones aquí estipulados, debes suspender inmediatamente el uso de la plataforma."
              : "If you do not agree to all terms and conditions set forth herein, you must immediately discontinue use of the platform and delete your account."}
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">02.</span>
            {isEs ? "Cuentas de Usuario y Seguridad de Credenciales" : "User Accounts, Identity & Security"}
          </h2>
          <p>
            {isEs
              ? "Para utilizar las capacidades completas de Manageo, debes registrar una cuenta proporcionando una dirección de correo electrónico válida y una contraseña segura. Eres el único responsable de:"
              : "To access the functional modules of Manageo, you must register an account with a verified email address and secure password credentials. You are solely responsible for:"}
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
            <li>
              {isEs
                ? "Mantener la confidencialidad de tu contraseña y credenciales de autenticación."
                : "Maintaining the absolute confidentiality of your login credentials and authentication sessions."}
            </li>
            <li>
              {isEs
                ? "Todas las actividades, mutaciones y transacciones que ocurran bajo tu cuenta."
                : "All actions, modifications, data entries, and financial records processed under your authenticated account."}
            </li>
            <li>
              {isEs
                ? "Notificar inmediatamente a nuestro equipo de soporte si detectas cualquier acceso no autorizado."
                : "Immediately reporting any unauthorized account access, credential compromise, or security incident to our security team."}
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">03.</span>
            {isEs ? "Garantía de Cero Contaminación y Espacios de Trabajo" : "Zero Data Contamination & Workspace Governance"}
          </h2>
          <p>
            {isEs
              ? "Manageo implementa un modelo de seguridad por diseño denominado Garantía de Cero Contaminación de Datos (Zero Data Contamination):"
              : "Manageo implements an architectural security invariant known as the Zero Data Contamination Guarantee:"}
          </p>
          <div className="p-4 rounded-xl bg-stitch-surface/60 border border-stitch-primary/20 space-y-2">
            <p className="text-xs sm:text-sm text-slate-200 font-medium">
              {isEs
                ? "• Aislamiento Absoluto de Datos Personales: Tus cuentas bancarias, transacciones financieras, saldos, recordatorios de inversión y elementos de la Bóveda Cifrada están permanentemente vinculados a tu ID de usuario personal y NUNCA se indexan, comparten ni exponen a los miembros de ningún espacio de trabajo colaborativo."
                : "• Absolute Personal Isolation: Bank accounts, financial transactions, balances, investment reminders, and encrypted Vault items are permanently bound to your personal User ID and are NEVER indexed, shared, or accessible to members of any collaborative workspace."}
            </p>
            <p className="text-xs sm:text-sm text-slate-200 font-medium">
              {isEs
                ? "• Espacios Colaborativos (Workspaces): Tareas, rutinas, notas y secciones compartidas se gestionan bajo roles (Propietario, Administrador, Miembro, Espectador). Los administradores tienen potestad sobre la asignación de tareas en ese espacio, pero cero visibilidad sobre tu vida privada."
                : "• Collaborative Workspaces: Shared tasks, team routines, notes, and custom sections are governed by granular Role-Based Access Control (Owner, Admin, Member, Viewer). Team administrators hold authority over shared workspace entities, but retain zero visibility into your private modules."}
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">04.</span>
            {isEs ? "Bóveda Cifrada de Extremo a Extremo (AES-256-GCM)" : "Cryptographic Vault Terms (AES-256-GCM)"}
          </h2>
          <p>
            {isEs
              ? "El módulo de Bóveda (Vault) utiliza cifrado AES-256-GCM para proteger credenciales, contraseñas y notas secretas. Respecto a este módulo, reconoces y aceptas que:"
              : "The Vault module provides zero-knowledge-oriented cryptographic protection using AES-256-GCM for passwords, keys, and private items. Regarding the Vault, you acknowledge and agree that:"}
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
            <li>
              {isEs
                ? "La seguridad de tu bóveda depende de tu contraseña maestra y contraseñas personalizadas."
                : "Vault security relies strictly on the strength of your master passphrase and individual custom passwords."}
            </li>
            <li>
              {isEs
                ? "Manageo almacena datos cifrados con vectores de inicialización (IV) y etiquetas de autenticación. Si olvidas tu contraseña y no tienes configurado el correo para recuperación OTP, los datos no podrán ser recuperados ni por nuestro personal técnico."
                : "Manageo stores encrypted payloads with random IVs and authentication tags. If you lose your passphrase and cannot verify identity via email OTP, encrypted contents cannot be decrypted by any Manageo technician."}
            </li>
            <li>
              {isEs
                ? "Manageo no se hace responsable por la pérdida de claves de acceso o contraseñas no respaldadas por el usuario."
                : "Manageo disclaims liability for data inaccessibility resulting from user loss of master passphrases."}
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">05.</span>
            {isEs ? "Módulo Financiero, Registro de Cuentas y Facturación" : "Financial Ledgers, Invoices & Balances"}
          </h2>
          <p>
            {isEs
              ? "Manageo incluye herramientas de cálculo de balances, registro de transacciones, recordatorios de vencimiento de facturas y emisión de facturas en PDF numeradas mediante contadores inmutables. Declaras conocer y aceptar que:"
              : "Manageo includes tools for transaction tracking, balance calculations, recurring bill alerts, and immutable counter-generated PDF invoice production. You understand and agree that:"}
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
            <li>
              {isEs
                ? "Manageo NO es una entidad bancaria, institución financiera ni proveedor de asesoramiento tributario o contable."
                : "Manageo is NOT a licensed banking institution, payment processor, broker-dealer, or accounting firm."}
            </li>
            <li>
              {isEs
                ? "Las funciones de cálculo de saldo constituyen una utilidad matemática de apoyo organizativo; debes conciliar siempre con tus extractos bancarios oficiales."
                : "Balance calculations serve as organizational mathematical aids; you remain responsible for official bank reconciliation."}
            </li>
            <li>
              {isEs
                ? "Las facturas emitidas son documentos administrativos generados por el usuario. Eres el único responsable del cumplimiento de las normativas fiscales y tributarias aplicables en tu jurisdicción."
                : "Invoices generated through Manageo are administrative records produced at your direction. You are solely responsible for local tax and regulatory compliance."}
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">06.</span>
            {isEs ? "Propiedad Intelectual y Propiedad de tus Datos" : "Intellectual Property & Data Ownership"}
          </h2>
          <p>
            {isEs
              ? "Tus datos te pertenecen al 100%. Manageo y AXIOMIXS no reclaman ningún derecho de propiedad intelectual sobre el contenido, archivos adjuntos, tareas, notas o registros que crees o almacenes en la plataforma."
              : "Your data belongs 100% to you. Manageo and AXIOMIXS claim zero proprietary ownership over the content, tasks, routines, attachments, notes, or databases you store in the platform."}
          </p>
          <p>
            {isEs
              ? "Nos otorgas únicamente una licencia limitada y revocable para alojar, procesar y transmitir tus datos en nuestros servidores con el único fin de prestarte el Servicio contratado."
              : "You grant us only a limited, revocable, non-exclusive license to host, process, cache, and transmit your data solely as necessary to operate and deliver the Service to you."}
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">07.</span>
            {isEs ? "Almacenamiento de Archivos y Adjuntos (Cloudinary)" : "Attachments & Cloud Storage Infrastructure"}
          </h2>
          <p>
            {isEs
              ? "Los documentos y fotografías adjuntos a tareas, notas, transacciones y secciones personalizadas se procesan y almacenan en Cloudinary bajo autenticación privada. La entrega de archivos se realiza exclusivamente a través de URLs firmadas de corta duración generadas por nuestro servidor. No debes subir contenido ilegal, malicioso o protegido por derechos de autor sin autorización."
              : "Uploaded documents and attachments linked to tasks, notes, or transactions are secured via authenticated cloud storage (Cloudinary) and delivered through short-lived signed URLs generated by our server proxy. You agree not to upload malicious, infringing, or unlawful content."}
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">08.</span>
            {isEs ? "Cancelación, Exportación y Eliminación de Cuentas" : "Account Termination, Data Export & Deletion"}
          </h2>
          <p>
            {isEs
              ? "Tienes derecho a cancelar tu cuenta en cualquier momento desde la configuración de perfil. Al solicitar la eliminación de tu cuenta, todos tus datos personales, registros financieros, elementos de bóveda y archivos adjuntos asociados serán eliminados de nuestras bases de datos de forma permanente e irrecuperable."
              : "You may terminate your account at any time via Settings. Upon receiving a verified account deletion request, all personal records, financial ledgers, vault secrets, and associated cloud assets are permanently and irreversibly purged from our active databases in accordance with our Privacy Policy."}
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">09.</span>
            {isEs ? "Limitación de Responsabilidad" : "Limitation of Liability"}
          </h2>
          <p>
            {isEs
              ? "En la máxima medida permitida por la ley aplicable, Manageo y AXIOMIXS no serán responsables por daños indirectos, incidentales, punitivos o consecuentes, incluyendo pérdida de datos, interrupción de negocios o pérdidas financieras derivadas del uso o imposibilidad de uso del Servicio."
              : "To the maximum extent permitted by applicable law, Manageo and AXIOMIXS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data corruption, business interruption, or financial discrepancies resulting from your use of or inability to access the platform."}
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">10.</span>
            {isEs ? "Contacto y Resolucion de Dudas" : "Governing Contact Information"}
          </h2>
          <p>
            {isEs
              ? "Para consultas legales, aclaraciones sobre estos términos o asistencia técnica, puedes contactar a nuestro equipo oficial:"
              : "For legal inquiries, terms interpretation, or administrative requests, please contact our legal and support team:"}
          </p>
          <div className="p-4 rounded-xl bg-surface border border-surface-variant/40 space-y-1 text-xs sm:text-sm">
            <p><strong className="text-white">Manageo / AXIOMIXS</strong></p>
            <p>Email: <a href="mailto:support@manageo.axiomixs.com" className="text-stitch-primary hover:underline">support@manageo.axiomixs.com</a> / <a href="mailto:info@axiomixs.com" className="text-stitch-primary hover:underline">info@axiomixs.com</a></p>
            <p>Phone: +880 1753-070584</p>
          </div>
        </section>

      </div>

      {/* Footer Navigation */}
      <div className="mt-16 pt-8 border-t border-surface-variant/30 flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface-variant">
        <span>© {new Date().getFullYear()} Manageo. {isEs ? "Todos los derechos reservados." : "All rights reserved."}</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-white transition-colors">
            {isEs ? "Política de Privacidad" : "Privacy Policy"}
          </Link>
          <Link href="/security" className="hover:text-white transition-colors">
            {isEs ? "Seguridad" : "Security Overview"}
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors">
            {isEs ? "Contacto" : "Contact"}
          </Link>
        </div>
      </div>
    </div>
  );
}
