"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  LogIn, 
  UserPlus 
} from "lucide-react";
import { 
  InvitationDetailsResult, 
  acceptInvitation, 
  switchAndOpenWorkspace 
} from "@/actions/workspaceInvitation.actions";

export default function InviteClient({
  token,
  inviteData,
}: {
  token: string;
  inviteData: InvitationDetailsResult;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAccept = async () => {
    if (loading || success) return;
    setLoading(true);
    setError(null);

    try {
      const res = await acceptInvitation(token);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      } else {
        setError(res.error || "Failed to join workspace.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleOpenExisting = async () => {
    if (!inviteData.workspace?.id) {
      router.push("/dashboard");
      return;
    }
    setLoading(true);
    try {
      await switchAndOpenWorkspace(inviteData.workspace.id);
      router.push("/dashboard");
      router.refresh();
    } catch {
      router.push("/dashboard");
    }
  };

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`;
  const registerUrl = `/register?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <div className="bg-[#030712] font-sans text-slate-200 antialiased flex flex-col min-h-screen relative overflow-hidden selection:bg-stitch-primary/20 selection:text-stitch-primary">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-stitch-primary/20 blur-[130px] transition-transform duration-[10s] ease-in-out ${mounted ? 'translate-x-[15%] translate-y-[10%]' : ''}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-500/10 blur-[130px] transition-transform duration-[15s] ease-in-out ${mounted ? 'translate-x-[-15%] translate-y-[-10%]' : ''}`}></div>
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}></div>
      </div>

      {/* Header with Manageo Logo */}
      <header className="absolute top-0 inset-x-0 z-50 pt-[env(safe-area-inset-top,0px)]">
        <div className="h-24 px-4 sm:px-6 flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="Manageo Logo" 
              className="h-20 sm:h-24 w-auto max-w-[60vw] object-contain drop-shadow-[0_0_15px_rgba(125,211,252,0.3)]" 
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href="/dashboard"
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex flex-col justify-center items-center relative w-full pt-20 pb-8 z-10 px-4 sm:px-6 min-h-screen">
        <div className={`w-full max-w-[460px] mx-auto transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          <div className="bg-[#0c121e]/85 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            
            {/* STATE 1: INVALID / EXPIRED INVITATION */}
            {!inviteData.valid && (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                  {inviteData.reason === "EXPIRED" ? (
                    <Clock className="w-8 h-8" />
                  ) : (
                    <AlertCircle className="w-8 h-8" />
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {inviteData.reason === "EXPIRED" 
                    ? "Invitation Expired" 
                    : inviteData.reason === "MAX_USES_REACHED" 
                    ? "Invitation Limit Reached" 
                    : "Invitation Not Found"}
                </h1>

                <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-sm leading-relaxed">
                  {inviteData.reason === "EXPIRED" 
                    ? "This workspace invite link has expired. Please ask the team owner to generate and share a new link." 
                    : inviteData.reason === "MAX_USES_REACHED"
                    ? "This invite link has already reached its maximum usage limit."
                    : "This invitation link is invalid or has been revoked. Please check the URL or request a new invitation."}
                </p>

                <div className="w-full flex flex-col gap-2.5">
                  <Link 
                    href="/dashboard"
                    className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-sm flex items-center justify-center transition-all"
                  >
                    Go to Dashboard
                  </Link>
                  <Link 
                    href="/"
                    className="w-full h-10 rounded-xl text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center transition-colors"
                  >
                    Return to Home
                  </Link>
                </div>
              </div>
            )}

            {/* STATE 2: VALID INVITATION */}
            {inviteData.valid && (
              <div className="flex flex-col items-center text-center">
                
                {/* Workspace Icon & Banner */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-stitch-primary/20 to-blue-500/20 border border-stitch-primary/30 flex items-center justify-center text-stitch-primary mb-4 shadow-[0_0_25px_rgba(125,211,252,0.2)]">
                  <Building2 className="w-8 h-8" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stitch-primary/10 border border-stitch-primary/20 text-stitch-primary text-[11px] font-semibold mb-3 uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  <span>Team Workspace Invitation</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
                  {inviteData.workspace?.name}
                </h1>

                <p className="text-xs sm:text-sm text-slate-400 mb-6">
                  Invited by <strong className="text-slate-200 font-semibold">{inviteData.inviter?.name}</strong>
                  {inviteData.inviter?.email && (
                    <span className="text-slate-400 font-normal"> ({inviteData.inviter.email})</span>
                  )}
                </p>

                {/* Workspace & Role Metadata Box */}
                <div className="w-full p-3.5 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-around mb-6 text-xs text-slate-300">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Role</span>
                    <span className="font-bold text-stitch-primary capitalize mt-0.5">
                      {inviteData.invitation?.role || "Member"}
                    </span>
                  </div>
                  <div className="w-px h-7 bg-white/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Workspace Type</span>
                    <span className="font-semibold text-slate-200 capitalize mt-0.5">
                      {inviteData.workspace?.type || "Team"}
                    </span>
                  </div>
                  <div className="w-px h-7 bg-white/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Members</span>
                    <span className="font-semibold text-slate-200 mt-0.5">
                      {inviteData.workspace?.memberCount || 1}
                    </span>
                  </div>
                </div>

                {/* Error Banner if any */}
                {error && (
                  <div className="w-full p-3 mb-5 text-xs font-medium text-red-200 bg-red-500/20 border border-red-500/30 rounded-xl text-center">
                    {error}
                  </div>
                )}

                {/* Success Banner if accepted */}
                {success && (
                  <div className="w-full p-4 mb-5 text-sm font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <span>Joined successfully! Redirecting to dashboard...</span>
                  </div>
                )}

                {/* SUB-CASE 2A: USER IS NOT LOGGED IN */}
                {!inviteData.userState?.isLoggedIn && (
                  <div className="w-full flex flex-col gap-3">
                    <p className="text-xs text-slate-400 mb-1">
                      Sign in or create an account to accept this invitation and collaborate with your team.
                    </p>

                    <Link 
                      href={loginUrl}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-stitch-primary to-blue-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(125,211,252,0.5)] active:scale-[0.98] transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Log In to Accept</span>
                    </Link>

                    <Link 
                      href={registerUrl}
                      className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Create an Account</span>
                    </Link>
                  </div>
                )}

                {/* SUB-CASE 2B: USER IS LOGGED IN & ALREADY A MEMBER */}
                {inviteData.userState?.isLoggedIn && inviteData.userState.isMember && (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full p-3.5 mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3 text-left">
                      <UserCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                      <div>
                        <span className="font-bold">You are already a member</span>
                        <p className="text-emerald-300/80 text-[11px] mt-0.5">
                          You are currently {inviteData.userState.currentRole ? `an ${inviteData.userState.currentRole}` : 'a member'} of this workspace.
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={handleOpenExisting}
                      disabled={loading}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-stitch-primary to-blue-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(125,211,252,0.5)] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Opening Workspace...</span>
                        </>
                      ) : (
                        <>
                          <span>Open Workspace Dashboard</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* SUB-CASE 2C: USER IS LOGGED IN & NOT YET A MEMBER */}
                {inviteData.userState?.isLoggedIn && !inviteData.userState.isMember && (
                  <div className="w-full flex flex-col gap-3">
                    <div className="w-full p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 flex items-center justify-center gap-1.5">
                      <span>Logged in as:</span>
                      <strong className="text-white truncate max-w-[200px]">
                        {inviteData.userState.user?.name || inviteData.userState.user?.email}
                      </strong>
                    </div>

                    <button 
                      onClick={handleAccept}
                      disabled={loading || success}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-stitch-primary to-blue-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(125,211,252,0.5)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Joining Workspace...</span>
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Joined!</span>
                        </>
                      ) : (
                        <>
                          <span>Accept Invitation & Join Team</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="mt-2 text-center">
                      <Link 
                        href={loginUrl}
                        className="text-[11px] text-slate-400 hover:text-stitch-primary transition-colors"
                      >
                        Not your account? Sign in with a different account
                      </Link>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Bottom Security Trust Badge */}
            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-medium text-slate-400">Manageo Team Collaboration</span>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
