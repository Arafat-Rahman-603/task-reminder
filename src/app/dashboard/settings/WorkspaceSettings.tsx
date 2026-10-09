"use client";

import { useState, useEffect } from "react";
import { Link2, Copy, Check, Plus, Trash2, Shield, Users } from "lucide-react";
import { createInvitation, getActiveInvitations, revokeInvitation } from "@/actions/workspaceInvitation.actions";

export default function WorkspaceSettings({ activeWorkspace }: { activeWorkspace: any }) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, [activeWorkspace._id]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await getActiveInvitations(activeWorkspace._id);
      setInvitations(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (generating) return;
    try {
      setGenerating(true);
      const res = await createInvitation({ workspaceId: activeWorkspace._id, role, maxUses: 1, expiresInDays: 7 });
      alert("Invitation generated");
      // Add a dummy entry to UI with the token to allow copying immediately
      setInvitations([{
        _id: 'temp-' + Date.now(),
        token: res.token,
        role: role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        uses: 0,
        maxUses: 1,
        createdBy: { name: 'You' }
      }, ...invitations]);
    } catch (err: any) {
      alert(err.message || "Failed to generate invitation");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    alert("Invite link copied");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    if (id.startsWith('temp-')) {
      alert("Please refresh to revoke this newly created link");
      return;
    }
    try {
      await revokeInvitation(id);
      alert("Invitation revoked");
      setInvitations(invitations.filter(i => i._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to revoke invitation");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-on-surface mb-2">Workspace Settings</h3>
        <p className="text-sm text-on-surface-variant max-w-2xl">
          Manage your team workspace, invite collaborators, and assign roles. Currently managing <strong>{activeWorkspace.name}</strong>.
        </p>
      </div>

      <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-surface-variant/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-on-surface">Invite Members</h4>
              <p className="text-sm text-on-surface-variant">Generate unique links to invite people to your workspace.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="px-4 py-2 bg-stitch-background border border-surface-variant/50 rounded-xl outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-stitch-primary text-white font-medium rounded-xl hover:bg-stitch-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus size={16} />
              Generate Link
            </button>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-6 text-center text-secondary-text text-sm">Loading invitations...</div>
          ) : invitations.length === 0 ? (
            <div className="p-6 text-center text-secondary-text text-sm">No active invitations found.</div>
          ) : (
            <div className="divide-y divide-surface-variant/30">
              {invitations.map((invite) => (
                <div key={invite._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-variant/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                      <Link2 size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm capitalize">{invite.role}</span>
                        <span className="text-xs text-secondary-text bg-surface-variant/30 px-2 py-0.5 rounded-full">
                          Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-secondary-text">
                        Created by {invite.createdBy?.name || 'Unknown'} • Uses: {invite.uses}/{invite.maxUses || '∞'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {invite.token ? (
                      <button
                        onClick={() => handleCopy(invite.token)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-surface-variant/50 rounded-lg text-primary hover:bg-primary/5 transition-colors"
                      >
                        {copied === invite.token ? <Check size={14} /> : <Copy size={14} />}
                        {copied === invite.token ? "Copied" : "Copy Link"}
                      </button>
                    ) : (
                      <span className="text-xs text-secondary-text italic px-2">Link hidden for security</span>
                    )}
                    <button
                      onClick={() => handleRevoke(invite._id)}
                      className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                      title="Revoke invitation"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
