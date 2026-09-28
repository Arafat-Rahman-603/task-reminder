"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/actions/onboarding.actions";
import { Layout, Check, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    currency: "USD",
    theme: "system"
  });

  const handleComplete = async () => {
    setLoading(true);
    await completeOnboarding(preferences);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 py-12 px-6">
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="mb-8 flex items-center justify-center">
          <div className="h-12 w-12 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
            <Layout className="h-6 w-6 text-white dark:text-zinc-900" />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">Welcome to your Personal OS.</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Let&apos;s set up your command center in just a few steps.</p>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
              <div className="space-y-4">
                <label className="block text-sm font-medium">Select your primary currency</label>
                <p className="text-sm text-zinc-500 mb-4">You can change this later in settings, but it sets the default for your accounts and budgets.</p>
                <select 
                  value={preferences.currency}
                  onChange={(e) => setPreferences({...preferences, currency: e.target.value})}
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-shadow"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="BDT">BDT (৳)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-3 rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">You&apos;re all set!</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Your workspace is ready. You can customize the sidebar and build your own sections at any time.</p>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm text-center">
               <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Check className="h-10 w-10" />
               </div>
               
               <button 
                  onClick={handleComplete}
                  disabled={loading}
                  className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-3 rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {loading ? "Preparing Dashboard..." : "Enter Dashboard"}
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
