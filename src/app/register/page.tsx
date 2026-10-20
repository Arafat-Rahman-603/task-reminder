"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  HelpCircle,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Users,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const loginUrl = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"individual" | "team_owner">("individual");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState("Creating your account securely...");
  const [authMethod, setAuthMethod] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const typeParam = searchParams.get("type");
    if (typeParam === "team_owner" || typeParam === "individual") {
      setAccountType(typeParam);
    }
  }, [searchParams]);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request OTP and proceed to verification
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    setAuthMethod("credentials");

    try {
      const res = await fetch("/api/auth/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send verification code");
        setLoading(false);
        return;
      }

      setStep("otp");
      setResendCooldown(60);
      setOtp("");
      setError("");
    } catch {
      setError("An unexpected network error occurred while sending the code");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to resend verification code");
      } else {
        setResendCooldown(60);
        setToastText("New verification code sent to your email!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch {
      setError("Unable to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setError("");
    setToastText("Verifying code & provisioning your account...");
    setShowToast(true);

    try {
      const browserTimezone =
        typeof window !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : "UTC";

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          timezone: browserTimezone,
          accountType,
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        setShowToast(false);
      } else {
        setSuccessMessage("Account created & email verified successfully!");
        setToastText("Welcome to Manageo! Redirecting to login...");
        setTimeout(() => {
          router.push(loginUrl);
        }, 1200);
      }
    } catch {
      setError("An unexpected network error occurred");
      setLoading(false);
      setShowToast(false);
    }
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setAuthMethod("google");
    setToastText("Connecting to Google securely...");
    setShowToast(true);
    const targetUrl = callbackUrl || "/dashboard";
    signIn("google", { callbackUrl: targetUrl });
  };

  return (
    <div className="bg-[#030712] font-sans text-slate-200 antialiased flex flex-col min-h-screen relative overflow-hidden selection:bg-stitch-primary/20 selection:text-stitch-primary">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-stitch-primary/20 blur-[120px] transition-transform duration-[12s] ease-in-out ${
            mounted ? "translate-x-[-20%] translate-y-[10%]" : ""
          }`}
        />
        <div
          className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] transition-transform duration-[18s] ease-in-out ${
            mounted ? "translate-x-[20%] translate-y-[-10%]" : ""
          }`}
        />
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <header
        className="absolute top-0 inset-x-0 z-50"
        style={{ paddingTop: "var(--safe-area-top, env(safe-area-inset-top, 0px))" }}
      >
        <div className="h-24 px-4 sm:px-6 flex items-center justify-between mx-auto max-w-7xl">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Manageo"
              className="h-12 sm:h-14 md:h-16 w-auto max-w-[240px] object-contain drop-shadow-[0_0_15px_rgba(125,211,252,0.3)]"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              aria-label="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
              onClick={() => {
                if (step === "otp") {
                  setStep("form");
                  setError("");
                } else {
                  router.back();
                }
              }}
              type="button"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Link
              href="/contact"
              aria-label="Help & Support"
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Support</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center relative w-full pt-16 pb-6 z-10 px-4 sm:px-6 min-h-screen">
        <div
          className={`w-full max-w-[420px] mx-auto transition-all duration-700 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Header Branding Section */}
          <div className="flex flex-col items-center text-center mb-5">
            {step === "otp" && (
              <div className="mb-3">
                <div className="w-14 h-14 rounded-2xl bg-stitch-primary/10 border border-stitch-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(125,211,252,0.3)]">
                  <Mail className="w-7 h-7 text-stitch-primary animate-pulse" />
                </div>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5">
              {step === "form" ? "Create an account" : "Verify your email"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-[320px]">
              {step === "form" ? (
                "Create your account and start organizing your life"
              ) : (
                <>
                  We sent a 6-digit verification code to{" "}
                  <span className="text-white font-medium">{email}</span>
                </>
              )}
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  step === "otp"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-stitch-primary text-black font-extrabold shadow-[0_0_10px_rgba(125,211,252,0.4)]"
                }`}
              >
                {step === "otp" ? "✓" : "1"}
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  step === "form" ? "text-white font-semibold" : "text-slate-400"
                }`}
              >
                Details
              </span>
            </div>

            <div
              className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${
                step === "otp" ? "bg-stitch-primary" : "bg-white/10"
              }`}
            />

            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  step === "otp"
                    ? "bg-stitch-primary text-black font-extrabold shadow-[0_0_10px_rgba(125,211,252,0.4)] scale-105"
                    : "bg-white/5 text-slate-500 border border-white/10"
                }`}
              >
                2
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  step === "otp" ? "text-white font-semibold" : "text-slate-500"
                }`}
              >
                Verification
              </span>
            </div>
          </div>

          {/* Form Container */}
          <div className="relative w-full">
            {error && (
              <div className="mb-4 p-2.5 text-xs sm:text-sm font-medium text-red-200 bg-red-500/20 border border-red-500/30 rounded-xl text-center backdrop-blur-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 text-xs sm:text-sm font-medium text-emerald-200 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center backdrop-blur-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* STEP 1: Registration Information Form */}
            {step === "form" && (
              <>
                <form
                  className="relative flex flex-col gap-3 sm:gap-4"
                  onSubmit={handleInitiateSignup}
                  method="POST"
                >
                  {/* Account Type Selection */}
                  <div className="flex flex-col gap-2 mb-1">
                    <label className="text-[10px] sm:text-xs font-semibold tracking-wide text-slate-300 uppercase">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAccountType("individual")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                          accountType === "individual"
                            ? "bg-stitch-primary/10 border-stitch-primary text-stitch-primary shadow-[0_0_15px_rgba(125,211,252,0.15)]"
                            : "bg-black/20 border-white/10 text-slate-400 hover:bg-black/30 hover:border-white/20"
                        }`}
                      >
                        <User className="w-5 h-5 mb-1" />
                        <span className="text-sm font-semibold">Individual</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType("team_owner")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                          accountType === "team_owner"
                            ? "bg-stitch-primary/10 border-stitch-primary text-stitch-primary shadow-[0_0_15px_rgba(125,211,252,0.15)]"
                            : "bg-black/20 border-white/10 text-slate-400 hover:bg-black/30 hover:border-white/20"
                        }`}
                      >
                        <Users className="w-5 h-5 mb-1" />
                        <span className="text-sm font-semibold">Team Owner</span>
                      </button>
                    </div>
                  </div>

                  {/* Name Field */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[10px] sm:text-xs font-semibold tracking-wide text-slate-300 uppercase"
                      htmlFor="name"
                    >
                      Name
                    </label>
                    <div className="relative flex items-center group">
                      <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-stitch-primary transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="John Doe"
                        className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-stitch-primary/50 focus:border-stitch-primary/50 focus:bg-black/40 transition-all hover:bg-black/30"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[10px] sm:text-xs font-semibold tracking-wide text-slate-300 uppercase"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <div className="relative flex items-center group">
                      <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-stitch-primary transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="name@company.com"
                        className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-stitch-primary/50 focus:border-stitch-primary/50 focus:bg-black/40 transition-all hover:bg-black/30"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[10px] sm:text-xs font-semibold tracking-wide text-slate-300 uppercase"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <div className="relative flex items-center group">
                      <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-stitch-primary transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Create a password"
                        className="w-full h-10 pl-10 pr-11 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-stitch-primary/50 focus:border-stitch-primary/50 focus:bg-black/40 transition-all hover:bg-black/30"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        aria-label="Toggle password visibility"
                        className="absolute right-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[10px] sm:text-xs font-semibold tracking-wide text-slate-300 uppercase"
                      htmlFor="confirmPassword"
                    >
                      Confirm Password
                    </label>
                    <div className="relative flex items-center group">
                      <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-stitch-primary transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Confirm your password"
                        className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-stitch-primary/50 focus:border-stitch-primary/50 focus:bg-black/40 transition-all hover:bg-black/30"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Primary Action CTA Button */}
                  <button
                    type="submit"
                    className="w-full mt-2 h-10 rounded-xl bg-gradient-to-r from-stitch-primary to-blue-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(125,211,252,0.5)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
                    disabled={loading}
                  >
                    {loading && authMethod === "credentials" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Verification</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Social Authentication Section */}
                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-[#0c121e]">
                      or sign up with
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="h-10 w-full rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold flex items-center justify-center gap-3 transition-all border border-white/10 hover:border-white/20 disabled:opacity-50"
                    type="button"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                      <path
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                        fill="#EA4335"
                      />
                      <path
                        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                        fill="#4285F4"
                      />
                      <path
                        d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.3 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.3 7.5 23 12 23z"
                        fill="#34A853"
                      />
                    </svg>
                    <span>
                      {loading && authMethod === "google" ? "Connecting..." : "Google"}
                    </span>
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: OTP Verification Form */}
            {step === "otp" && (
              <form
                className="relative flex flex-col gap-5"
                onSubmit={handleVerifyAndRegister}
                method="POST"
              >
                {/* Email Delivery & Spam Advisory Notice */}
                <div className="p-3.5 rounded-2xl bg-stitch-primary/10 border border-stitch-primary/30 flex items-start gap-3 text-left shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-stitch-primary/20 flex items-center justify-center text-stitch-primary shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white leading-tight">
                      Verification code dispatched to <span className="text-stitch-primary font-mono">{email}</span>
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Don&apos;t see it in your inbox? <strong>Please check your Spam or Junk folder</strong>. Email filters sometimes misroute verification codes.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-[10px] sm:text-xs font-semibold tracking-wide text-slate-300 uppercase"
                      htmlFor="otp-input"
                    >
                      6-Digit Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("form");
                        setError("");
                      }}
                      className="text-[11px] text-stitch-primary hover:underline transition-colors"
                    >
                      Change email
                    </button>
                  </div>

                  {/* Segmented OTP Visual Display */}
                  <div className="relative flex justify-center items-center gap-2 sm:gap-3 py-1">
                    <input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtp(cleaned);
                        if (error) setError("");
                      }}
                      disabled={loading}
                      autoFocus
                      className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const digit = otp[index] || "";
                      const isFocused = otp.length === index;
                      const isFilled = Boolean(digit);
                      return (
                        <div
                          key={index}
                          className={`w-11 h-13 sm:w-12 sm:h-14 rounded-xl border flex items-center justify-center font-mono text-xl sm:text-2xl font-bold transition-all duration-200 select-none ${
                            isFilled
                              ? "border-stitch-primary/70 bg-stitch-primary/10 text-stitch-primary shadow-[0_0_12px_rgba(125,211,252,0.25)]"
                              : isFocused
                              ? "border-stitch-primary ring-2 ring-stitch-primary/40 bg-black/40 text-white"
                              : "border-white/10 bg-black/20 text-slate-600"
                          }`}
                        >
                          {digit ||
                            (isFocused ? (
                              <span className="inline-block w-0.5 h-6 bg-stitch-primary animate-pulse" />
                            ) : (
                              "•"
                            ))}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Click anywhere on the boxes to type or paste your code.
                  </p>
                </div>

                {/* Primary Verify CTA */}
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-stitch-primary to-blue-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(125,211,252,0.5)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
                  disabled={loading || otp.trim().length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Resend & Back Actions */}
                <div className="flex flex-col items-center gap-3 pt-1">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    {resendCooldown > 0 ? (
                      <span>
                        Resend code in{" "}
                        <strong className="text-stitch-primary font-mono font-semibold">
                          {resendCooldown}s
                        </strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendLoading}
                        className="text-stitch-primary hover:text-white transition-colors font-medium flex items-center gap-1.5"
                      >
                        {resendLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Resending...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Didn&apos;t receive code? Resend OTP</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setError("");
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ← Back to edit account information
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href={loginUrl}
                className="font-semibold text-white hover:text-stitch-primary ml-1 sm:ml-2 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Bottom Trust Badge */}
          <div className="mt-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 border border-white/5">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-300">
                256-bit End-to-End Encrypted
              </span>
            </div>
          </div>

          {/* Verification Modal / Toast Feedback */}
          <div
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-[340px] p-4 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/20 text-white flex items-center gap-4 shadow-2xl transition-all duration-500 z-50 ${
              showToast
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-8 scale-95 pointer-events-none"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-stitch-primary/20 flex items-center justify-center shrink-0 border border-stitch-primary/30">
              <Loader2 className="text-stitch-primary w-5 h-5 animate-spin" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold">Secure Connection</span>
              <span className="text-xs text-slate-300 truncate">{toastText}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
