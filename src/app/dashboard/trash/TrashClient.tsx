"use client";

import { useState } from "react";
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Loader2,
  FileText,
  Lock,
  Wallet,
  CheckSquare,
  FolderOpen,
  Database,
  Lightbulb,
  RotateCw
} from "lucide-react";
import { restoreFromTrash, permanentlyDeleteTrashItem } from "@/actions/trash.actions";

interface TrashItemRecord {
  _id: string;
  entityId: string;
  title: string;
  module: string;
  entityType: string;
  deletedAt: string;
  purgeAt: string;
  daysRemaining: number;
  hoursRemaining: number;
  expiresLabel: string;
  attachments?: unknown[];
}

export default function TrashClient({
  initialItems = [],
  initialTotal = 0,
}: {
  initialItems: TrashItemRecord[];
  initialTotal: number;
}) {
  const [items, setItems] = useState<TrashItemRecord[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("All");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmPermanentId, setConfirmPermanentId] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const modules = [
    "All",
    "Tasks & Projects",
    "Notes",
    "Routines",
    "Ideas",
    "Documents",
    "Custom Databases",
    "Finance",
    "Vault",
  ];

  const filteredItems = items.filter((item) => {
    const matchesModule = selectedModule === "All" || item.module === selectedModule;
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.entityType.toLowerCase().includes(search.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const handleRestore = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await restoreFromTrash(id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i._id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        showToast("Item restored to its original place successfully.");
      } else {
        showToast(res.error || "Failed to restore item.", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Failed to restore item.", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await permanentlyDeleteTrashItem(id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i._id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        setConfirmPermanentId(null);
        showToast("Item permanently purged.");
      } else {
        showToast(res.error || "Failed to purge item.", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Failed to purge item.", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const getModuleIcon = (entityType: string) => {
    switch (entityType) {
      case "Task": return <CheckSquare className="w-4 h-4 text-stitch-primary" />;
      case "Project": return <FolderOpen className="w-4 h-4 text-stitch-secondary" />;
      case "Note":
      case "NoteGroup": return <FileText className="w-4 h-4 text-emerald-400" />;
      case "Routine": return <RotateCw className="w-4 h-4 text-purple-400" />;
      case "Idea": return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case "Document": return <FileText className="w-4 h-4 text-sky-400" />;
      case "CustomSection":
      case "CustomRecord": return <Database className="w-4 h-4 text-indigo-400" />;
      case "Transaction":
      case "Account":
      case "Debt":
      case "Investment": return <Wallet className="w-4 h-4 text-emerald-300" />;
      case "VaultItem": return <Lock className="w-4 h-4 text-rose-400" />;
      default: return <Trash2 className="w-4 h-4 text-on-surface-variant" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-3">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border ${
              toast.type === "success"
                ? "bg-stitch-primary/10 border-stitch-primary/30 text-stitch-primary backdrop-blur-xl"
                : "bg-error/15 border-error/30 text-error backdrop-blur-xl"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl bg-surface-container-low/60 border border-surface-container-high p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-stitch-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error">
                <Trash2 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold font-headline text-on-surface tracking-tight">
                Recently Deleted
              </h1>
            </div>
            <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
              Deleted items remain safely recoverable for <strong className="text-on-surface">7 days</strong>. After this grace period, they and their associated storage are permanently erased by the automated background cleaner.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container-high/60 px-3.5 py-2 rounded-xl border border-surface-container-highest">
            <Clock className="w-4 h-4 text-stitch-primary shrink-0" />
            <span>{total} item{total === 1 ? "" : "s"} &bull; 7-Day Retention Window</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Module Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedModule(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                selectedModule === m
                  ? "bg-stitch-primary text-on-primary font-semibold shadow-sm"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-surface-container-high"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deleted items..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-stitch-primary"
          />
        </div>
      </div>

      {/* Item List / Table */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl bg-surface-container-low/40 border border-surface-container-high p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-container mx-auto flex items-center justify-center text-on-surface-variant border border-surface-container-high">
            <Trash2 className="w-7 h-7 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-on-surface">Trash is Empty</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {search || selectedModule !== "All"
              ? "No deleted items match the selected filter or search term."
              : "Items deleted from any module will appear here for 7 days before permanent removal."}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-surface-container-low/40 border border-surface-container-high overflow-hidden shadow-xl">
          <div className="divide-y divide-surface-container-high/60">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container/30 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-surface-container-highest">
                    {getModuleIcon(item.entityType)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-on-surface truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant border border-surface-container-highest">
                        {item.entityType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                      <span>Deleted {new Date(item.deletedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className={item.daysRemaining <= 1 ? "text-error font-medium" : "text-stitch-primary font-medium"}>
                        {item.expiresLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    disabled={loadingId === item._id}
                    onClick={() => handleRestore(item._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    {loadingId === item._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>Restore</span>
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === item._id}
                    onClick={() => setConfirmPermanentId(item._id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-error/15 border border-surface-container-high text-xs text-on-surface-variant hover:text-error transition-all"
                    title="Permanently Delete Immediately"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Immediate Purge */}
      {confirmPermanentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-surface-container-low border border-surface-container-high p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-error/15 text-error flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Permanent Deletion</h3>
                <p className="text-xs text-on-surface-variant">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete this item and its files now? It will not be recoverable.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPermanentId(null)}
                className="px-4 py-2 rounded-xl bg-surface-container text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePermanentDelete(confirmPermanentId)}
                className="px-4 py-2 rounded-xl bg-error text-white text-xs font-semibold hover:bg-error/90 transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
