"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { acceptInvitation } from "@/actions/workspaceInvitation.actions";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { setActiveWorkspace } from "@/actions/workspace.actions";

export default function InvitePage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;

    const handleAccept = async () => {
      try {
        const res = await acceptInvitation(token);
        // Switch to the newly joined workspace
        await setActiveWorkspace(res.workspaceId);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || "Failed to accept invitation.");
      }
    };

    handleAccept();
  }, [token]);

  return (
    <div className="min-h-screen bg-stitch-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-stitch-surface border border-surface-variant/30 rounded-2xl p-8 shadow-xl text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 size={48} className="animate-spin text-stitch-primary mb-4" />
            <h1 className="text-xl font-bold text-on-surface">Joining Workspace...</h1>
            <p className="text-secondary-text mt-2">Please wait while we verify your invitation.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle size={48} className="text-green-500 mb-4" />
            <h1 className="text-xl font-bold text-on-surface mb-2">Welcome to the Team!</h1>
            <p className="text-secondary-text mb-6">You have successfully joined the workspace.</p>
            <Link 
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-stitch-primary text-white font-medium hover:bg-stitch-primary/90 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle size={48} className="text-error mb-4" />
            <h1 className="text-xl font-bold text-on-surface mb-2">Invitation Failed</h1>
            <p className="text-secondary-text mb-6">{errorMsg}</p>
            <Link 
              href="/dashboard"
              className="px-6 py-3 rounded-xl border border-surface-variant text-on-surface hover:bg-surface-variant/20 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
