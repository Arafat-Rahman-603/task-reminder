"use client";

import { useState } from "react";
import { updateUpgradeRequestStatus } from "@/actions/admin.actions";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminClient({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const router = useRouter();

  const handleUpdate = async (id: string, status: "approved" | "rejected") => {
    if (!confirm(`Are you sure you want to ${status} this request?`)) return;
    try {
      await updateUpgradeRequestStatus(id, status);
      setRequests(requests.map(r => r._id === id ? { ...r, status } : r));
      router.refresh();
    } catch (err: any) {
      alert("Failed to update: " + err.message);
    }
  };

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-surface-variant overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-variant bg-surface-container-low">
        <h2 className="text-xl font-semibold text-on-surface">Upgrade Requests</h2>
      </div>
      <div className="p-0">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">No upgrade requests found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/50 border-b border-surface-variant">
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Workspace</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Requested By</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/50">
              {requests.map(req => (
                <tr key={req._id} className="hover:bg-surface-variant/10 transition-colors">
                  <td className="px-6 py-4 text-sm text-on-surface">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface">
                    <span className="font-medium">{req.workspaceId?.name || "Unknown"}</span>
                    <br />
                    <span className="text-xs text-on-surface-variant uppercase">{req.workspaceId?.type || ""}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface">
                    {req.requestedBy?.name || "Unknown"}
                    <br />
                    <span className="text-xs text-on-surface-variant">{req.requestedBy?.email || ""}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-stitch-primary/10 text-stitch-primary rounded-full text-xs font-bold uppercase tracking-wider">
                      {req.requestedPlan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      req.status === 'approved' ? 'bg-green-500/10 text-green-600' :
                      req.status === 'rejected' ? 'bg-red-500/10 text-red-600' :
                      'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {req.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleUpdate(req._id, "approved")} className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors" title="Approve">
                          <Check size={16} />
                        </button>
                        <button onClick={() => handleUpdate(req._id, "rejected")} className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors" title="Reject">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
