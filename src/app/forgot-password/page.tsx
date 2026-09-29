"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, ArrowRight, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";

type Step = "email" | "otp" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send code");
      } else {
        setStep("otp");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
      } else {
        setStep("success");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#030712] font-sans text-slate-200 antialiased flex flex-col min-h-screen relative overflow-hidden selection:bg-stitch-primary/20 selection:text-stitch-primary">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-stitch-primary/20 blur-[120px] transition-transform duration-[12s] ease-in-out ${mounted ? 'translate-x-[-20%] translate-y-[10%]' : ''}`}></div>
        <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] transition-transform duration-[18s] ease-in-out ${mounted ? 'translate-x-[20%] translate-y-[-10%]' : ''}`}></div>
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}></div>
      </div>
      
      <header className="absolute top-0 inset-x-0 z-50 pt-[env(safe-area-inset-top,0px)]">
        <div className="h-24 px-4 sm:px-6 flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-20 sm:h-24 w-auto max-w-[60vw] object-contain drop-shadow-[0_0_15px_rgba(125,211,252,0.3)]" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              aria-label="Go back" 
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95" 
              onClick={() => router.back()} 
              type="button"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Link href="/login" className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center relative w-full pt-16 pb-6 z-10 px-4 sm:px-6 min-h-screen">
        <div className={`w-full max-w-[420px] mx-auto transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Header Branding */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <div className="relative w-16 h-16 rounded-2xl bg-white/5 p-3 backdrop-blur-xl flex items-center justify-center shadow-lg border border-white/10">
                <div className="w-full h-full bg-stitch-primary/20 border border-stitch-primary/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(125,211,252,0.4)]">
                  <ShieldCheck className="text-stitch-primary w-6 h-6" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5">
              {step === "email" ? "Recover your account" : step === "otp" ? "Enter verification code" : "Password updated!"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-[280px]">
              {step === "email" && "Enter your email and we'll send you a 6-digit recovery code."}
              {step === "otp" && `Enter the code sent to ${email} and set a new password.`}
              {step === "success" && "Your password has been reset. You can now log in with your new password."}
            </p>
          </div>
          
          {/* Step Indicator */}
          {step !== "success" && (
            <div className="flex items-center justify-center gap-3 mb-8">
              {["email", "otp"].map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                    step === s ? "bg-stitch-primary text-black shadow-[0_0_10px_rgba(125,211,252,0.5)] scale-110" :
                    (s === "email" && step === "otp") ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                    "bg-white/5 text-slate-500 border border-white/10"
                  }`}>
                    {s === "email" && step === "otp" ? "✓" : i + 1}
                  </div>
                  {i === 0 && <div className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${step === "otp" ? "bg-emerald-500/50" : "bg-white/10"}`}></div>}
                </div>
              ))}
            </div>
          )}

          {/* Form Container */}
          <div className="relative w-full mt-2">
            
            {/* Error */}
            {error && (
              <div className="relative z-10 mb-5 p-3.5 text-sm font-medium text-red-200 bg-red-500/20 border border-red-500/30 rounded-xl text-center backdrop-blur-sm">
                {error}
              </div>
            )}

            {/* Email Step */}
            {step === "email" && (
              <form className="relative flex flex-col gap-5" onSubmit={handleSendOtp} method="POST">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wide text-slate-300 uppercase" htmlFor="email">Email address</label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-stitch-primary transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-stitch-primary/50 focus:border-stitch-primary/50 focus:bg-black/40 transition-all hover:bg-black/30"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 h-12 rounded-xl bg-gradient-to-r from-stitch-primary to-blue-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(125,211,252,0.5)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
                  disabled={loading || !email}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> <span>Sending...</span></> : <><span>Send Recovery Code</span> <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* OTP + New Password Step */}
            {step === "otp" && (
              <form className="relative flex flex-col gap-5" onSubmit={handleResetPassword} method="POST">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wide text-slate-300 uppercase" htmlFor="otp">6-digit verification code</label>
                  <input
                    id="otp"
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="• • • • • •"
                    maxLength={6}
                    className="w-full h-12 px-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-center text-xl tracking-[0.4em] font-mono focus:outline-none focus:ring-1 focus:ring-stitch-primary/50 focus:border-stitch-primary/50 focus:bg-black/40 transition-all hover:bg-black/30"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wide text-slate-300 uppercase" htmlFor="newPassword">New password</label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-stitch-primary transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full h-12 pl-11 pr-12 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-stitch-primary/50 focus:border-stitch-primary/50 focus:bg-black/40 transition-all hover:bg-black/30"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-4 flex items-center text-slate-400 hover:text-white transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wide text-slate-300 uppercase" htmlFor="confirmPassword">Confirm new password</label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-stitch-primary transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-stitch-primary/50 focus:border-stitch-primary/50 focus:bg-black/40 transition-all hover:bg-black/30"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 h-12 rounded-xl bg-gradient-to-r from-stitch-primary to-blue-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(125,211,252,0.5)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
                  disabled={loading || !otp || !newPassword || !confirmPassword}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> <span>Resetting...</span></> : <><span>Reset Password</span> <ArrowRight className="w-4 h-4" /></>}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); setOtp(""); }}
                  className="text-xs font-medium text-slate-400 hover:text-stitch-primary transition-colors text-center mt-2"
                >
                  Didn&apos;t receive a code? Try again
                </button>
              </form>
            )}

            {/* Success Step */}
            {step === "success" && (
              <div className="relative flex flex-col items-center gap-5 py-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <ShieldCheck className="w-10 h-10 text-emerald-400" />
                </div>
                <p className="text-sm text-slate-300 text-center leading-relaxed">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <Link
                  href="/login"
                  className="w-full mt-2 h-12 rounded-xl bg-gradient-to-r from-stitch-primary to-blue-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(125,211,252,0.5)] active:scale-[0.98] transition-all"
                >
                  <span>Sign In</span> <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
          
          {/* Sign In Link */}
          {step !== "success" && (
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                Remember your password?{" "}
                <Link href="/login" className="font-semibold text-white hover:text-stitch-primary ml-2 transition-colors">Sign In</Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
