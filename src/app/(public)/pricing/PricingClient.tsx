"use client";

import { useState , useEffect} from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Check, CheckCircle2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PLAN_LIMITS } from "@/config/plans";

export default function PricingClient() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
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
        body: JSON.stringify({ name, email, company, plan: "Professional" })
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 w-full">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-6 font-headline"
        >
          {t("pricing_sneak", "Simple, Transparent Pricing")}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-on-surface-variant max-w-2xl mx-auto"
        >
          {t("pricing_sneak_desc", "Choose the plan that perfectly fits your personal or team needs. No hidden fees.")}
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-container-low border border-surface-variant/50 rounded-3xl p-8 hover:border-primary/30 transition-colors shadow-lg flex flex-col"
        >
          <h3 className="text-2xl font-bold text-on-surface mb-2">{t("free_plan", "Starter")}</h3>
          <p className="text-on-surface-variant mb-6 text-sm">Perfect for individuals getting started</p>
          <div className="text-4xl font-bold text-on-surface mb-8">
            {t("free_price", "$0/mo")}
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm text-on-surface-variant">
              <Check className="w-5 h-5 text-primary shrink-0" /> 
              <span>Access to core modules (Tasks, Ideas, Today)</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant">
              <Check className="w-5 h-5 text-primary shrink-0" /> 
              <span>Basic daily planning and reminders</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant">
              <Check className="w-5 h-5 text-primary shrink-0" /> 
              <span>Up to {PLAN_LIMITS.free.maxCustomSections} Custom Sections</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant opacity-50">
              <Check className="w-5 h-5 shrink-0" /> 
              <span>{PLAN_LIMITS.free.features.map(f => f.replace('_', ' ')).join(', ')}</span>
            </li>
          </ul>
          
          <Link href="/register" className="block w-full py-3 px-4 bg-surface-container text-center rounded-xl font-semibold text-on-surface border border-surface-variant hover:bg-surface-variant transition-colors mt-auto">
            {t("get_started", "Get Started")}
          </Link>
        </motion.div>

        {/* Pro Plan */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary/10 border border-primary/40 rounded-3xl p-8 relative shadow-xl shadow-primary/10 flex flex-col"
        >
          <div className="absolute -top-4 inset-x-0 flex justify-center">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> RECOMMENDED
            </span>
          </div>
          
          <h3 className="text-2xl font-bold text-primary mb-2">{t("pro_plan", "Professional")}</h3>
          <p className="text-on-surface-variant mb-6 text-sm">For power users and teams who need more</p>
          <div className="text-4xl font-bold text-on-surface mb-8">
            $3.69<span className="text-lg text-on-surface-variant font-normal">/mo</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm text-on-surface-variant">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> 
              <span className="font-medium text-on-surface">Up to {PLAN_LIMITS.pro.maxCustomSections} Custom Sections</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> 
              <span className="font-medium text-on-surface">Advanced Money & Investing module</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> 
              <span className="font-medium text-on-surface">Priority Email Support</span>
            </li>
          </ul>
          
          <button 
            onClick={() => setShowModal(true)}
            disabled={alreadyRequested}
            className={`w-full py-3 px-4 text-center rounded-xl font-semibold transition-colors shadow-lg flex items-center justify-center gap-2 mt-auto ${
              alreadyRequested 
                ? "bg-surface-variant text-on-surface-variant cursor-not-allowed shadow-none" 
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
            }`}
          >
            {alreadyRequested ? "Request Pending" : "Apply for Upgrade"} {!alreadyRequested && <ArrowRight className="w-4 h-4" />}
          </button>
        </motion.div>
      </div>

      {/* Upgrade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-high border border-surface-variant rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Request Sent!</h3>
                <p className="text-on-surface-variant mb-6">
                  We have received your request for upgradation to the Professional tier. Our team will contact you shortly with the next steps.
                </p>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 bg-surface-container rounded-xl font-medium text-white hover:bg-surface-variant transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpgradeRequest} className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-1">Upgrade to Professional</h3>
                <p className="text-sm text-on-surface-variant mb-6">Send a request for upgradation. Our team will manually review and provision your workspace.</p>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-11 px-4 bg-black/20 border border-surface-variant rounded-xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-11 px-4 bg-black/20 border border-surface-variant rounded-xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                    placeholder="john@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1 uppercase tracking-wider">Company (Optional)</label>
                  <input 
                    type="text" 
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full h-11 px-4 bg-black/20 border border-surface-variant rounded-xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                    placeholder="Acme Inc"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 bg-surface-container rounded-xl font-medium text-white hover:bg-surface-variant transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || alreadyRequested}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
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
