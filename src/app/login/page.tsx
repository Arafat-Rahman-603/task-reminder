"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HelpCircle, Mail, Lock, Eye, EyeOff, Check, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [authMethod, setAuthMethod] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAuthMethod("credentials");
    setShowToast(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
      setShowToast(false);
    } else {
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 800);
    }
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setAuthMethod("google");
    setShowToast(true);
    signIn('google', { callbackUrl: '/dashboard' });
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
          <div className="flex items-center gap-1.5">
            <Link 
              href="/contact"
              aria-label="Help & Support" 
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-stitch-primary hover:bg-surface-variant/40 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 bg-transparent z-10 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex flex-col w-full px-5 py-4 min-w-0 relative select-none mx-auto max-w-md">
          {/* Ambient frozen aura orbs */}
          <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-stitch-primary/10 blur-[80px]"></div>
          <div className="pointer-events-none absolute top-80 -right-16 w-56 h-56 rounded-full bg-tertiary/10 blur-[70px]"></div>
          
          {/* Header Branding Section */}
          <div className="relative z-10 flex flex-col items-center text-center mt-2 mb-6">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-stitch-primary/20 blur-md scale-110"></div>
              <img src="/logo.png" alt="Logo" className="relative h-24 w-auto object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]" />
              <div className="absolute -bottom-1 -right-3 px-1.5 py-0.5 rounded-full bg-surface-container-highest text-[10px] font-semibold tracking-wider text-stitch-primary flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-stitch-primary animate-pulse"></span>
                v2.4
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Welcome back</h2>
            <p className="text-xs text-on-surface-variant max-w-[270px] mt-1.5 leading-relaxed">
              Log in to synchronize your sprints, tasks, and team routines
            </p>
          </div>
          
          {/* Frosted Glass Card Container */}
          <div className="relative z-10 w-full rounded-2xl bg-stitch-surface/60 backdrop-blur-xl p-5 shadow-2xl shadow-black/40">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              
              {error && (
                <div className="p-3 text-sm font-medium text-danger-foreground bg-danger/90 rounded-md text-center">
                  {error}
                </div>
              )}

              {/* Work Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant flex items-center justify-between" htmlFor="email">
                  <span>Email</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="name@company.com" 
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant" htmlFor="password">Password</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    placeholder="Enter your password" 
                    className="w-full h-12 pl-10 pr-11 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm tracking-wide focus:outline-none focus:bg-surface-container-high transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              
              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    <div className="w-4 h-4 rounded bg-surface-container-high peer-checked:bg-stitch-primary transition-colors flex items-center justify-center">
                      <Check className="w-3 h-3 text-on-primary opacity-0 peer-checked:opacity-100 font-bold transition-opacity" strokeWidth={3} />
                    </div>
                  </div>
                  <span className="text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-stitch-primary hover:text-primary-fixed text-xs font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              
              {/* Primary Action CTA Button */}
              <button 
                type="submit" 
                className="w-full mt-2 h-12 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-80 disabled:pointer-events-none"
                disabled={loading}
              >
                <span>{loading && authMethod === "credentials" ? "Synchronizing..." : "Sign In"}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
          
          {/* Social Authentication Section */}
          <div className="relative z-10 mt-6 flex flex-col gap-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-[1px] bg-surface-variant"></div>
              </div>
              <span className="relative px-3 bg-stitch-background text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                or continue with
              </span>
            </div>
            <div className="gap-3 flex justify-center">
              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="h-12 w-full rounded-xl bg-surface-container/70 hover:bg-surface-container-high text-on-surface text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm border border-surface-variant/50 disabled:opacity-50" 
                type="button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z" fill="#EA4335"></path>
                  <path d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" fill="#4285F4"></path>
                  <path d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.3 0 12s.7 3.2 1.9 5.6l3.7-2.9z" fill="#FBBC05"></path>
                  <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.3 7.5 23 12 23z" fill="#34A853"></path>
                </svg>
                <span>{loading && authMethod === "google" ? "Connecting..." : "Google"}</span>
              </button>
            </div>
          </div>
          
          {/* Sign Up Link */}
          <div className="relative z-10 mt-7 text-center">
            <p className="text-xs text-on-surface-variant">
              Don't have an account? 
              <Link href="/register" className="font-semibold text-stitch-primary hover:text-primary-fixed ml-1 transition-colors">Sign Up</Link>
            </p>
          </div>
          
          {/* Bottom Trust Badge */}
          <div className="relative z-10 mt-6 mb-2 flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low/80 backdrop-blur-md">
              <ShieldCheck className="w-[14px] h-[14px] text-stitch-primary" />
              <span className="text-[11px] font-medium text-on-surface-variant tracking-tight">256-bit End-to-End Encrypted</span>
            </div>
          </div>
          
          {/* Verification Modal / Toast Simulation */}
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-xs p-3.5 rounded-xl bg-surface-container-highest/95 backdrop-blur-2xl text-on-surface flex items-center gap-3 shadow-2xl transition-all duration-300 z-50 ${showToast ? 'opacity-100 -translate-y-2' : 'opacity-0 pointer-events-none'}`}>
            <div className="w-8 h-8 rounded-full bg-stitch-primary/20 flex items-center justify-center shrink-0">
              <Loader2 className="text-stitch-primary w-5 h-5 animate-spin" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-on-surface">Connecting...</span>
              <span className="text-[11px] text-on-surface-variant truncate">Authenticating securely</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
