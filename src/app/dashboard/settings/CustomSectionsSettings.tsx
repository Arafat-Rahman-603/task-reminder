"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Archive, Trash2, Edit2, RotateCcw, Link as LinkIcon, Database, Save, Plus, Folder, Lock, Unlock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateCustomSection, setCustomSectionActiveStatus, deleteCustomSection } from "@/actions/customSection.actions";
import { useSectionSecurity } from "@/context/SectionSecurityContext";
import { SectionPasswordConfirmModal } from "@/components/security/SectionPasswordConfirmModal";


export interface CustomSectionSettingItem {
  _id: string;
  name: string;
  icon?: string;
  slug: string;
  isActive?: boolean;
  [key: string]: unknown;
}

export default function CustomSectionsSettings({ customSections = [] }: { customSections?: CustomSectionSettingItem[] }) {
  const router = useRouter();
  const { lockedSections, toggleLock, isInitialized } = useSectionSecurity();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<{
    slug: string;
    name: string;
    isLocking: boolean;
  } | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleConfirmPassword = async (password: string) => {
    if (!confirmTarget) return { success: false, error: "No section selected" };
    const res = await toggleLock(confirmTarget.slug, confirmTarget.isLocking, password);
    if (res.success) {
      setConfirmTarget(null);
    }
    return res;
  };

  const handleArchive = (id: string, currentStatus: boolean) => {
    const action = currentStatus ? "archive" : "restore";
    if (!confirm(`Are you sure you want to ${action} this section?`)) return;
    
    startTransition(async () => {
      await setCustomSectionActiveStatus(id, !currentStatus);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete Section? All records and dashboard configuration inside this section will be permanently removed. This cannot be undone.")) return;
    
    startTransition(async () => {
      await deleteCustomSection(id);
      router.refresh();
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    startTransition(async () => {
      await updateCustomSection(id, { name: editName.trim(), icon: editIcon });
      setEditingId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {alertMsg && (
        <div className="px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{alertMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertMsg(null)}
            className="text-amber-400 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-on-surface tracking-tight">Custom Sections</h3>
          <p className="text-xs text-on-surface-variant mt-1">Manage the lifecycle of your custom databases.</p>
        </div>
        <div className="flex items-center gap-3">
          {pending && <Loader2 className="w-5 h-5 text-stitch-primary animate-spin" />}
          <Link href="/dashboard/custom/new" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Create Section</span>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {customSections.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-surface-container-high rounded-2xl">
            <Database className="w-8 h-8 text-on-surface-variant/50 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-on-surface">No Custom Sections</h4>
            <p className="text-xs text-on-surface-variant mt-1">You haven&apos;t created any custom sections yet.</p>
          </div>
        ) : (
          customSections.map((section: CustomSectionSettingItem) => (
            <div key={section._id} className={`p-4 rounded-2xl border transition-all ${section.isActive ? 'bg-surface-container/40 border-surface-container-high' : 'bg-surface/30 border-surface-container-high/50 opacity-75'}`}>
              {editingId === section._id ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Icon (emoji)"
                      value={editIcon}
                      onChange={e => setEditIcon(e.target.value)}
                      className="w-12 h-10 px-2 text-center rounded-xl bg-surface-container-high text-sm focus:outline-none focus:ring-1 focus:ring-stitch-primary"
                    />
                    <input 
                      type="text" 
                      placeholder="Section Name"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl bg-surface-container-high text-sm focus:outline-none focus:ring-1 focus:ring-stitch-primary"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="h-8 px-3 rounded-lg bg-surface-variant text-on-surface-variant text-xs font-semibold hover:text-on-surface">
                      Cancel
                    </button>
                    <button onClick={() => handleSaveEdit(section._id)} className="h-8 px-3 rounded-lg bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-lg">
                      {section.icon || <Folder className="w-5 h-5 text-stitch-primary" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        {section.name}
                        {!section.isActive && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-variant text-on-surface-variant">Archived</span>}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        <p className="text-[11px] text-on-surface-variant font-mono">{section.slug}</p>
                        <a href={`/dashboard/custom/${section.slug}`} className="text-[11px] text-stitch-primary hover:underline flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" /> Visit Page
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isInitialized) {
                          setAlertMsg("Please initialize your Section Security password in the 'Section Security' tab first.");
                          return;
                        }
                        const isCurrentlyLocked = lockedSections.includes(section.slug);
                        setConfirmTarget({
                          slug: section.slug,
                          name: section.name,
                          isLocking: !isCurrentlyLocked,
                        });
                      }}
                      className={`h-8 px-2.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${
                        lockedSections.includes(section.slug)
                          ? "bg-stitch-secondary/20 text-stitch-secondary border border-stitch-secondary/30"
                          : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                      }`}
                      title={lockedSections.includes(section.slug) ? "Password Protected (Click to remove lock)" : "Lock with Password"}
                    >
                      {lockedSections.includes(section.slug) ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-stitch-secondary" />
                          <span className="hidden sm:inline">Protected</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Lock</span>
                        </>
                      )}
                    </button>

                    <button 
                      onClick={() => { setEditingId(section._id); setEditName(section.name); setEditIcon(section.icon || ""); }}
                      className="h-8 px-2.5 rounded-lg bg-surface-container-high text-on-surface hover:text-stitch-primary transition-colors flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Edit</span>
                    </button>
                    
                    {section.isActive ? (
                      <button 
                        onClick={() => handleArchive(section._id, !!section.isActive)}
                        className="h-8 px-2.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-tertiary transition-colors flex items-center gap-1.5 text-xs font-medium"
                      >
                        <Archive className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Archive</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleArchive(section._id, !!section.isActive)}
                        className="h-8 px-2.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-success transition-colors flex items-center gap-1.5 text-xs font-medium"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Restore</span>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleDelete(section._id)}
                      className="h-8 px-2.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 rounded-xl bg-primary-container/30 border border-stitch-primary/20 text-xs text-on-surface-variant leading-relaxed">
        <strong>Note on Navigation:</strong> When you Archive a section, it is hidden from the sidebar but your data remains intact. If you Delete a section, the database fields, records, and dashboards are destroyed forever.
      </div>

      {/* Password Confirmation Modal for Lock/Unlock */}
      <SectionPasswordConfirmModal
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        sectionName={confirmTarget?.name || ""}
        isLocking={confirmTarget?.isLocking ?? true}
        onConfirm={handleConfirmPassword}
      />
    </div>
  );
}
