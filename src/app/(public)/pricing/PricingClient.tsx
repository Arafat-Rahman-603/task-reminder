"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Check, CheckCircle2, ArrowRight, Loader2, Sparkles, Building2, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PLAN_LIMITS, PlanType } from "@/config/plans";

export default function PricingClient() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("Professional");
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAlreadyRequested(localStorage.getItem("upgrade_request_sent") === "true");
    }
  }, []);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const handleUpgradeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/upgrade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, plan: selectedPlan })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send request");
      }
      
      setSuccess(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("upgrade_request_sent", "true");
        setAlreadyRequested(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const planKeys: PlanType[] = ['free', 'pro', 'enterprise'];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stitch-primary/10 border border-stitch-primary/20 text-stitch-primary text-xs font-semibold mb-3 uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Plans</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3 font-headline"
        >
          {t("pricing_sneak", "Simple, Predictable Pricing")}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto"
        >
          {t("pricing_sneak_desc", "Choose between our individual Personal OS or scalable Team Workspaces.")}
        </motion.p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {planKeys.map((key, idx) => {
          const plan = PLAN_LIMITS[key];
          const isPro = key === 'pro';
          const isEnterprise = key === 'enterprise';

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
              className={`rounded-2xl p-6 sm:p-7 flex flex-col relative transition-all duration-300 ${
                isPro 
                  ? "bg-[#0f172a]/90 border-2 border-stitch-primary/50 shadow-xl shadow-stitch-primary/10 hover:border-stitch-primary" 
                  : "bg-white/[0.02] border border-white/10 hover:border-white/20"
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 inset-x-0 flex justify-center">
                  <span className="bg-stitch-primary text-black text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stitch-primary">
                  {plan.target === 'individual' ? 'Personal' : plan.target === 'team' ? 'Team Workspace' : 'Organization'}
                </span>
                {plan.target === 'individual' ? (
                  <User className="w-4 h-4 text-slate-400" />
                ) : (
                  <Building2 className="w-4 h-4 text-slate-400" />
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-1.5">{plan.name}</h3>
              <p className="text-xs text-slate-400 mb-5 min-h-[36px] leading-relaxed">
                {plan.description}
              </p>

              <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-white/10">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{plan.price}</span>
                {plan.period && (
                  <span className="text-xs text-slate-400 font-medium">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1 text-xs">
                {plan.featureLabels.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5 text-slate-300 leading-normal">
                    {isPro ? (
                      <CheckCircle2 className="w-4 h-4 text-stitch-primary shrink-0 mt-0.5" />
                    ) : (
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-2">
                {key === 'free' ? (
                  <Link
                    href="/register?accountType=individual"
                    className="block w-full py-2.5 px-4 text-center rounded-xl font-semibold text-xs text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all hover:scale-[1.01]"
                  >
                    Start Free
                  </Link>
                ) : isPro ? (
                  <button
                    onClick={() => {
                      setSelectedPlan(plan.name);
                      setShowModal(true);
                    }}
                    disabled={alreadyRequested}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-stitch-primary hover:bg-stitch-primary/90 text-black shadow-lg shadow-stitch-primary/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <span>{alreadyRequested ? "Upgrade Pending" : "Upgrade to Pro"}</span>
                    {!alreadyRequested && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <Link
                    href="/contact"
                    className="block w-full py-2.5 px-4 text-center rounded-xl font-semibold text-xs text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.01]"
                  >
                    Contact Enterprise
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Security & Data Isolation Note */}
      <div className="mt-12 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Strict user data isolation: Personal Money & Vault records remain 100% private to your account.</span>
        </div>
        <Link href="/security" className="text-xs text-stitch-primary hover:underline shrink-0">
          Learn about security &rarr;
        </Link>
      </div>

      {/* Upgrade Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
          >
            {success ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Request Submitted</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Your request for the {selectedPlan} tier has been received. Our team will review and provision your workspace shortly.
                </p>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 bg-white/10 rounded-xl font-medium text-xs text-white hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpgradeRequest} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-lg font-bold text-white">Upgrade to {selectedPlan}</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    &times;
                  </button>
                </div>
                
                <p className="text-xs text-slate-400">
                  Submit your details below to activate {selectedPlan} for your workspace.
                </p>
                
                {error && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Workspace / Team Name</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Team"
                    className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="h-9 px-4 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-9 px-5 rounded-xl bg-stitch-primary text-black font-semibold text-xs hover:bg-stitch-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit Upgrade Request"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
