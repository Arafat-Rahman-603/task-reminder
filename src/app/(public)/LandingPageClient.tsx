"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Zap, Target, FolderSync, Settings, Layout, Database, Workflow, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-on-surface mb-6 font-headline"
          >
            {t("hero_title_1")} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-stitch-primary to-tertiary">{t("hero_title_2")}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg text-on-surface-variant mb-10 leading-relaxed"
          >
            {t("hero_subtitle")}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105">
              {t("get_started")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container border border-surface-variant/50 px-8 py-3.5 text-sm font-semibold text-on-surface hover:bg-surface-variant transition-colors">
              {t("explore_product")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feature Value Section */}
      <section className="py-24 bg-stitch-surface/50 border-y border-surface-variant/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-4 font-headline">{t("hero_title_2")}</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">{t("hero_subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl bg-surface-container/40 border border-surface-variant/30 p-6 backdrop-blur-sm hover:bg-surface-container/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">{t("daily_planning")}</h3>
              <p className="text-sm text-on-surface-variant">{t("daily_desc")}</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl bg-surface-container/40 border border-surface-variant/30 p-6 backdrop-blur-sm hover:bg-surface-container/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">{t("money")}</h3>
              <p className="text-sm text-on-surface-variant">{t("money_desc")}</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-2xl bg-surface-container/40 border border-surface-variant/30 p-6 backdrop-blur-sm hover:bg-surface-container/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-stitch-secondary/10 flex items-center justify-center text-stitch-secondary mb-4">
                <FolderSync className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">{t("custom_sections")}</h3>
              <p className="text-sm text-on-surface-variant">{t("custom_desc")}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Your System, Your Way Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-6 font-headline">{t("system_way")}</h2>
              <p className="text-lg text-on-surface-variant mb-8">
                {t("system_desc")}
              </p>
              <ul className="space-y-4">
                {[t("point_1"), t("point_2"), t("point_3"), t("point_4")].map((item, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Zap className="w-3 h-3" />
                    </div>
                    <span className="text-on-surface">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-stitch-primary/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl border border-surface-variant/40 bg-surface-container-high/80 p-2 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-variant/30 bg-surface-container-low/50">
                   <Settings className="w-4 h-4 text-on-surface-variant" />
                   <span className="text-xs font-medium text-on-surface-variant">Custom Section Builder</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="h-8 w-3/4 bg-surface-variant/50 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-10 w-full bg-surface-container/50 rounded-xl" />
                    <div className="h-10 w-full bg-surface-container/50 rounded-xl" />
                    <div className="h-10 w-full bg-surface-container/50 rounded-xl" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-stitch-surface border-b border-surface-variant/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-4 font-headline">{t("how_it_works")}</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">{t("how_it_works_desc")}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 -z-10" />
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center text-center relative"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary/20 flex items-center justify-center text-primary text-xl font-bold shadow-lg mb-6 shadow-primary/10">
                1
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">{t("step_1")}</h3>
              <p className="text-on-surface-variant">{t("step_1_desc")}</p>
              <div className="mt-6 p-4 bg-surface-container/50 rounded-2xl border border-surface-variant/30 w-full backdrop-blur-sm">
                <Layout className="w-8 h-8 text-stitch-primary mx-auto opacity-70" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center text-center relative"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary/20 flex items-center justify-center text-primary text-xl font-bold shadow-lg mb-6 shadow-primary/10">
                2
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">{t("step_2")}</h3>
              <p className="text-on-surface-variant">{t("step_2_desc")}</p>
              <div className="mt-6 p-4 bg-surface-container/50 rounded-2xl border border-surface-variant/30 w-full backdrop-blur-sm">
                <Database className="w-8 h-8 text-tertiary mx-auto opacity-70" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col items-center text-center relative"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary/20 flex items-center justify-center text-primary text-xl font-bold shadow-lg mb-6 shadow-primary/10">
                3
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">{t("step_3")}</h3>
              <p className="text-on-surface-variant">{t("step_3_desc")}</p>
              <div className="mt-6 p-4 bg-surface-container/50 rounded-2xl border border-surface-variant/30 w-full backdrop-blur-sm">
                <Workflow className="w-8 h-8 text-stitch-secondary mx-auto opacity-70" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-24 bg-stitch-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-4 font-headline">{t("pricing_sneak")}</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto mb-8">{t("pricing_sneak_desc")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-surface-container-low border border-surface-variant/50 rounded-3xl p-8 hover:border-primary/30 transition-colors shadow-lg"
            >
              <h3 className="text-xl font-bold text-on-surface mb-2">{t("free_plan")}</h3>
              <div className="text-3xl font-bold text-on-surface mb-6">{t("free_price")}</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <Check className="w-5 h-5 text-primary" /> Core modules included
                </li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <Check className="w-5 h-5 text-primary" /> Basic daily planning
                </li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <Check className="w-5 h-5 text-primary" /> Up to 3 custom sections
                </li>
              </ul>
              <Link href="/register" className="block w-full py-3 px-4 bg-surface-container text-center rounded-xl font-semibold text-on-surface border border-surface-variant hover:bg-surface-variant transition-colors">
                {t("get_started")}
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-primary/10 border border-primary/30 rounded-3xl p-8 relative shadow-xl shadow-primary/5"
            >
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</div>
              <h3 className="text-xl font-bold text-primary mb-2">{t("pro_plan")}</h3>
              <div className="text-3xl font-bold text-on-surface mb-6">{t("pro_price")}</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <Check className="w-5 h-5 text-primary" /> Unlimited custom sections
                </li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <Check className="w-5 h-5 text-primary" /> Advanced money & investing
                </li>
                <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <Check className="w-5 h-5 text-primary" /> Priority email support
                </li>
              </ul>
              <Link href="/register" className="block w-full py-3 px-4 bg-primary text-primary-foreground text-center rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                {t("get_started")}
              </Link>
            </motion.div>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/pricing" className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors">
              {t("see_all_pricing")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5 border-t border-primary/10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl px-4 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-6 font-headline">{t("ready")}</h2>
          <p className="text-lg text-on-surface-variant mb-10">{t("ready_desc")}</p>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105">
            {t("create_account")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
