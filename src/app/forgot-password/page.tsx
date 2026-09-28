"use client";

import { useState } from "react";
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
    <div className="bg-stitch-background font-sans text-on-surface antialiased flex flex-col min-h-screen relative selection:bg-stitch-primary/20 selection:text-stitch-primary">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(125,211,252,0.12),rgba(10,14,26,0))]"></div>

      <header className="fixed top-0 inset-x-0 z-50 bg-stitch-surface/75 backdrop-blur-2xl pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_12px_rgba(0,0,0,0.25)]">
        <div className="h-16 px-4 flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            <button
              aria-label="Go back"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 transition-colors"
              onClick={() => router.back()}
              type="button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />
            </div>
          </div>
          <Link href="/login" className="text-xs font-medium text-stitch-primary hover:text-primary-fixed transition-colors">
            Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 bg-transparent z-10 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex flex-col w-full px-5 py-4 min-w-0 relative select-none mx-auto max-w-md">
          {/* Ambient orbs */}
          <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-stitch-primary/10 blur-[80px]"></div>
          <div className="pointer-events-none absolute top-80 -right-16 w-56 h-56 rounded-full bg-tertiary/10 blur-[70px]"></div>

          {/* Header Branding */}
          <div className="relative z-10 flex flex-col items-center text-center mt-2 mb-6">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-stitch-primary/20 blur-md scale-110"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-surface-container-high/80 p-2.5 backdrop-blur-xl flex items-center justify-center shadow-lg">
                <div className="w-full h-full bg-stitch-primary rounded-xl flex items-center justify-center drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]">
                  <ShieldCheck className="text-on-primary w-8 h-8" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">
              {step === "email" ? "Recover your account" : step === "otp" ? "Enter verification code" : "Password updated!"}
            </h2>
            <p className="text-xs text-on-surface-variant max-w-[270px] mt-1.5 leading-relaxed">
              {step === "email" && "Enter your email and we'll send you a 6-digit recovery code."}
              {step === "otp" && `Enter the code sent to ${email} and set a new password.`}
              {step === "success" && "Your password has been reset. You can now log in with your new password."}
            </p>
          </div>

          {/* Step Indicator */}
          {step !== "success" && (
            <div className="relative z-10 flex items-center justify-center gap-2 mb-5">
              {["email", "otp"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                    step === s ? "bg-stitch-primary text-on-primary" :
                    (s === "email" && step === "otp") ? "bg-success/20 text-success" :
                    "bg-surface-container text-on-surface-variant"
                  }`}>
                    {s === "email" && step === "otp" ? "✓" : i + 1}
                  </div>
                  {i === 0 && <div className="w-8 h-0.5 bg-surface-container-high rounded-full"></div>}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="relative z-10 mb-4 p-3 text-sm font-medium text-danger-foreground bg-danger/90 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Email Step */}
          {step === "email" && (
            <div className="relative z-10 w-full rounded-2xl bg-stitch-surface/60 backdrop-blur-xl p-5 shadow-2xl shadow-black/40">
              <form className="flex flex-col gap-4" onSubmit={handleSendOtp}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-on-surface-variant" htmlFor="email">Email address</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 h-12 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-80 disabled:pointer-events-none"
                  disabled={loading || !email}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send Recovery Code <ArrowRight className="w-5 h-5" /></>}
                </button>
              </form>
            </div>
          )}

          {/* OTP + New Password Step */}
          {step === "otp" && (
            <div className="relative z-10 w-full rounded-2xl bg-stitch-surface/60 backdrop-blur-xl p-5 shadow-2xl shadow-black/40">
              <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-on-surface-variant" htmlFor="otp">6-digit verification code</label>
                  <input
                    id="otp"
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="• • • • • •"
                    maxLength={6}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:bg-surface-container-high transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-on-surface-variant" htmlFor="newPassword">New password</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Min. 6 characters"
                      className="w-full h-12 pl-10 pr-11 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-3.5 flex items-center text-on-surface-variant hover:text-stitch-primary transition-colors p-1"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-on-surface-variant" htmlFor="confirmPassword">Confirm new password</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Re-enter password"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 h-12 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-80 disabled:pointer-events-none"
                  disabled={loading || !otp || !newPassword || !confirmPassword}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : <>Reset Password <ArrowRight className="w-5 h-5" /></>}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); setOtp(""); }}
                  className="text-xs text-on-surface-variant hover:text-stitch-primary transition-colors text-center"
                >
                  Didn&apos;t receive a code? Try again
                </button>
              </form>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="relative z-10 w-full rounded-2xl bg-stitch-surface/60 backdrop-blur-xl p-6 shadow-2xl shadow-black/40 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-success" />
              </div>
              <p className="text-sm text-on-surface-variant text-center">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="w-full h-12 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                Sign In <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}

          <div className="relative z-10 mt-7 text-center">
            <p className="text-xs text-on-surface-variant">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold text-stitch-primary hover:text-primary-fixed ml-1 transition-colors">Sign In</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
