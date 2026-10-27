import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";
import Link from "next/link";
import { AlertTriangle, Scale } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/financial-disclaimer",
    title: lang === "es" ? "Aviso Legal Financiero | Manageo" : "Financial Disclaimer | Manageo",
    description:
      lang === "es"
        ? "Aviso Legal y Descargo Financiero de Manageo. Clarificación sobre herramientas de registro financiero, cálculos contables y ausencia de asesoramiento regulado."
        : "Manageo Financial Disclaimer. Clarification on personal ledger tools, mathematical balance calculations, and non-advisory regulatory status.",
  });
}

export default async function Page() {
  const lang = await getServerLanguage();
  const isEs = lang === "es";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 w-full text-on-surface antialiased">
      {/* Header */}
      <div className="mb-12 border-b border-surface-variant/40 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 mb-4">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{isEs ? "Aviso Regulatorio y Descargo de Responsabilidad" : "Regulatory Notice & Statutory Disclaimer"}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-headline mb-4">
          {isEs ? "Aviso Legal Financiero" : "Financial Disclaimer"}
        </h1>
        <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
          {isEs
            ? "Última actualización: 20 de octubre de 2026. Manageo es una herramienta de software para la organización personal y no presta servicios de asesoramiento financiero, contable o fiscal regulado."
            : "Last updated: October 20, 2026. Manageo is an organizational productivity software application and does not provide licensed financial, tax, legal, or investment advisory services."}
        </p>
      </div>

      {/* Critical Callout */}
      <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/30 mb-12 space-y-3">
        <div className="flex items-center gap-3 text-amber-400 font-bold text-base">
          <Scale className="w-5 h-5 shrink-0" />
          <span>
            {isEs
              ? "Herramienta de Seguimiento Personal, No un Asesor Financiero"
              : "Organizational Tracking Software, Not a Financial Advisor"}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {isEs
            ? "Toda la información, funciones de balance, simuladores de dividendos, calendarios de facturas y registros de transacciones disponibles en Manageo son exclusivamente para fines organizativos, informativos y de productividad personal. Ninguna función o dato constituye una recomendación de inversión, oferta de valores o asesoría legal o contable."
            : "All information, balance calculation modules, dividend calendars, bill reminder mechanisms, and ledger tools provided within Manageo are strictly for personal productivity and organizational purposes. Nothing contained in the application constitutes financial, investment, accounting, tax, or legal advice, nor a solicitation or recommendation to buy or sell securities or financial instruments."}
        </p>
      </div>

      {/* Main Sections */}
      <div className="space-y-10 text-on-surface-variant text-sm sm:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">01.</span>
            {isEs ? "Ausencia de Servicios Bancarios o Custodia de Fondos" : "No Banking Services or Custody of Funds"}
          </h2>
          <p>
            {isEs
              ? "Manageo NO es un banco, una cooperativa de crédito, un transmisor de dinero ni una pasarela de pago. No custodiamos depósitos en efectivo, no ejecutamos transferencias bancarias ni interactuamos directamente con fondos monetarios reales. Los saldos y transacciones que registras son entradas manuales o estructuradas para tu propio control personal."
              : "Manageo is NOT a bank, credit union, depository institution, money services business, or payment processor. We do not hold cash deposits, execute wire transfers, process fiat currency payments, or hold custody of any client funds. Ledgers and balances maintained in the application are user-managed records intended solely for your personal tracking."}
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">02.</span>
            {isEs ? "Precisión de Cálculos y Diligencia del Usuario" : "Mathematical Calculations & User Responsibility"}
          </h2>
          <p>
            {isEs
              ? "Las funciones de cálculo de saldo (como nuestro motor de balance automático de ingresos y gastos) son utilidades algorítmicas de apoyo. Aunque nos esforzamos por garantizar la máxima precisión matemática, reconoces y aceptas que:"
              : "Balance adjustment functions and recurring ledger updates are programmatic mathematical utilities. While engineered for precision, you acknowledge and agree that:"}
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
            <li>
              {isEs
                ? "Eres responsable de conciliar periódicamente tus datos con los extractos oficiales de tus entidades bancarias."
                : "You remain solely responsible for verifying and reconciling application entries against official statements issued by your licensed financial institutions."}
            </li>
            <li>
              {isEs
                ? "Manageo no se hace responsable por errores de entrada manual de datos, discrepancias de tipo de cambio o redondeo."
                : "Manageo disclaims liability for data entry discrepancies, currency exchange rate fluctuations, or mathematical rounding differences."}
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">03.</span>
            {isEs ? "Facturación, Invoices y Cumplimiento Tributario" : "Invoice Generation & Statutory Tax Compliance"}
          </h2>
          <p>
            {isEs
              ? "Manageo permite generar facturas en PDF con numeración correlativa mediante contadores inmutables y URLs públicas de verificación. Al respecto:"
              : "Manageo allows users to generate downloadable PDF invoices featuring sequential numbering sequences and public cryptographic verification URLs. Regarding invoices:"}
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
            <li>
              {isEs
                ? "Las facturas son documentos confeccionados a criterio y responsabilidad exclusiva del usuario emisor."
                : "Invoices are created entirely at the direction, specification, and legal responsibility of the issuing user."}
            </li>
            <li>
              {isEs
                ? "Manageo no audita, valida ni reporta transacciones ante ninguna autoridad tributaria (como el IRS, la AEAT, el SAT o equivalentes)."
                : "Manageo does not audit, validate, certify, or report transactions to any fiscal, tax, or governmental authority."}
            </li>
            <li>
              {isEs
                ? "Debes verificar que el formato, desglose de impuestos (IVA, GST, Sales Tax) y datos de facturación cumplan con las leyes vigentes de tu jurisdicción."
                : "You must ensure that your invoice structure, tax calculations (VAT, GST, Sales Tax), and business entity representations comply with your local tax statutory requirements."}
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">04.</span>
            {isEs ? "Consulta Obligatoria a Profesionales Certificados" : "Consultation with Licensed Professionals"}
          </h2>
          <p>
            {isEs
              ? "Antes de tomar decisiones de inversión, adquirir productos financieros, contraer préstamos o presentar declaraciones de impuestos, debes consultar a un asesor financiero certificado, contador público autorizado o abogado debidamente acreditado en tu país o región."
              : "Before making major investment decisions, entering into debt commitments, trading securities, or submitting official tax filings, you should always consult with a certified financial planner (CFP), licensed public accountant (CPA), or qualified legal advisor authorized in your jurisdiction."}
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-stitch-primary font-mono text-sm">05.</span>
            {isEs ? "Limitación Total de Responsabilidad Financiera" : "Limitation of Financial Liability"}
          </h2>
          <p>
            {isEs
              ? "Manageo y AXIOMIXS quedan totalmente eximidos de cualquier responsabilidad por pérdidas de capital, deudas, penalizaciones fiscales o daños económicos que pudieran derivarse directa o indirectamente del uso de la plataforma o de la confianza depositada en sus cálculos o recordatorios."
              : "Manageo, AXIOMIXS, and its directors, engineers, and affiliates shall have zero liability for any trading losses, missed bill penalties, capital depreciation, tax assessments, or economic damages arising directly or indirectly from your reliance on the tools, notifications, or calculations provided within the platform."}
          </p>
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
          <Link href="/contact" className="hover:text-white transition-colors">
            {isEs ? "Contacto" : "Contact"}
          </Link>
        </div>
      </div>
    </div>
  );
}
