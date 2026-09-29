"use client";

import { useState, useEffect } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="bg-[#030712] font-sans text-slate-200 antialiased flex flex-col min-h-screen relative overflow-hidden selection:bg-stitch-primary/20 selection:text-stitch-primary">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-stitch-primary/20 blur-[120px] transition-transform duration-[10s] ease-in-out ${mounted ? 'translate-x-[20%] translate-y-[10%]' : ''}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] transition-transform duration-[15s] ease-in-out ${mounted ? 'translate-x-[-20%] translate-y-[-10%]' : ''}`}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
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
        <div className={`w-full max-w-[420px] mx-auto transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Header Branding Section */}
          <div className="flex flex-col items-center text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5">Welcome back</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-[280px]">
              Log in to synchronize your sprints, tasks, and team routines
            </p>
          </div>
          
          {/* Form Container */}
          <div className="relative w-full mt-2">
            
            <form className="relative flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit} method="POST">
              
              {error && (
                <div className="p-2.5 text-xs sm:text-sm font-medium text-red-200 bg-red-500/20 border border-red-500/30 rounded-xl text-center backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Work Email Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] sm:text-xs font-semibold tracking-wide text-slate-300 uppercase" htmlFor="email">
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
                <div className="flex items-center justify-between">
                  <label className="text-[10px] sm:text-xs font-semibold tracking-wide text-slate-300 uppercase" htmlFor="password">Password</label>
                  <Link href="/forgot-password" className="text-[10px] sm:text-xs font-medium text-stitch-primary hover:text-white transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative flex items-center group">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-stitch-primary transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    placeholder="••••••••" 
                    className="w-full h-10 pl-10 pr-12 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-stitch-primary/50 focus:border-stitch-primary/50 focus:bg-black/40 transition-all hover:bg-black/30"
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
              
              {/* Remember Me */}
              <div className="flex items-center justify-between text-[11px] sm:text-sm mt-0.5 sm:mt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md border border-white/20 bg-black/20 peer-checked:bg-stitch-primary peer-checked:border-stitch-primary transition-all flex items-center justify-center group-hover:border-white/40">
                      <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-black opacity-0 peer-checked:opacity-100 font-bold transition-opacity scale-50 peer-checked:scale-100" strokeWidth={3} />
                    </div>
                  </div>
                  <span className="text-slate-300 group-hover:text-white transition-colors">Remember me</span>
                </label>
              </div>
              
              {/* Primary Action CTA Button */}
              <button 
                type="submit" 
                className="w-full mt-2 h-10 rounded-xl bg-gradient-to-r from-stitch-primary to-blue-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(125,211,252,0.5)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
                disabled={loading}
              >
                <span>{loading && authMethod === "credentials" ? "Synchronizing..." : "Sign In"}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Social Authentication Section */}
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-[#0c121e]">
                  or continue with
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
          <div className="mt-6 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              Don't have an account? 
              <Link href="/register" className="font-semibold text-white hover:text-stitch-primary ml-1 sm:ml-2 transition-colors">Create one now</Link>
            </p>
          </div>
          
          {/* Bottom Trust Badge */}
          <div className="mt-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 border border-white/5">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-300">256-bit End-to-End Encrypted</span>
            </div>
          </div>
          
          {/* Verification Modal / Toast Simulation */}
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-[340px] p-4 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/20 text-white flex items-center gap-4 shadow-2xl transition-all duration-500 z-50 ${showToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
            <div className="w-10 h-10 rounded-full bg-stitch-primary/20 flex items-center justify-center shrink-0 border border-stitch-primary/30">
              <Loader2 className="text-stitch-primary w-5 h-5 animate-spin" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold">Secure Connection</span>
              <span className="text-xs text-slate-300 truncate">Authenticating your credentials...</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
