"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Unlock, AlertCircle, Fingerprint, Zap, Shield, Smartphone, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { SYSTEM_MODULES } from "@/config/modules";
import { LucideIcon } from "lucide-react";
import { useSectionSecurity, SectionLockConfig } from "@/context/SectionSecurityContext";
import { SectionPasswordConfirmModal } from "@/components/security/SectionPasswordConfirmModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ModulesSettings({ initialModules }: any) {
  const router = useRouter();
  const [modules, setModules] = useState<Record<string, boolean>>(initialModules);
  const [pending, startTransition] = useTransition();
  const allModules = Object.values(SYSTEM_MODULES);
  const { lockedSections, toggleLock, isInitialized } = useSectionSecurity();
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    name: string;
    isLocking: boolean;
  } | null>(null);
  const [expandedLockModId, setExpandedLockModId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleConfirmPassword = async (password: string) => {
    if (!confirmTarget) return { success: false, error: "No section selected" };
    const res = await toggleLock(confirmTarget.id, confirmTarget.isLocking, password);
    if (res.success) {
      setConfirmTarget(null);
    }
    return res;
  };

  const toggleModule = async (modId: string) => {
    const newValue = !modules[modId];
    setModules(prev => ({ ...prev, [modId]: newValue }));
    
    startTransition(async () => {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: { [modId]: newValue } })
      });
      router.refresh();
    });
  };

  const categories = ["Productivity", "Money", "Personal", "System"];

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

      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-on-surface tracking-tight">Module Management</h3>
          <p className="text-xs text-on-surface-variant mt-1">Enable or disable features to customize your workspace.</p>
        </div>
        {pending && <Loader2 className="w-5 h-5 text-stitch-primary animate-spin" />}
      </div>

      {categories.map(category => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mods = allModules.filter((m: any) => m.category === category && m.implemented && m.id !== 'custom');
        if (mods.length === 0) return null;
        
        return (
          <div key={category} className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stitch-primary">{category} Modules</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {mods.map((mod: any) => {
                const enabled = modules[mod.id] !== undefined ? modules[mod.id] : mod.defaultEnabled;
                
                return (
                  <div 
                    key={mod.id} 
                    className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-300 flex flex-col gap-2 ${
                      enabled 
                        ? 'bg-surface-container-high/60 border-stitch-primary/30 shadow-[0_4px_12px_rgba(125,211,252,0.05)]' 
                        : 'bg-surface/40 border-surface-container-high opacity-70'
                    }`}
                  >
                    {enabled && <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-stitch-primary/5 to-transparent pointer-events-none"></div>}
                    
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          enabled ? 'bg-primary/20 text-stitch-primary' : 'bg-surface-variant text-on-surface-variant'
                        }`}>
                          {/* Note: Icon is rendered by the client, we need to extract it from SYSTEM_MODULES because we serialized it from server */}
                          {(() => {
                            const IconCmp = SYSTEM_MODULES[mod.id]?.icon as LucideIcon;
                            return IconCmp ? <IconCmp className="w-[18px] h-[18px]" /> : null;
                          })()}
                        </div>
                        <span className={`text-sm font-semibold ${enabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          {mod.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {mod.id !== "vault" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isInitialized) {
                                setAlertMsg("Please initialize your Section Security password in the 'Section Security' tab first.");
                                return;
                              }
                              setExpandedLockModId((prev) => (prev === mod.id ? null : mod.id));
                            }}
                            className={`p-1.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1 ${
                              lockedSections.includes(mod.id)
                                ? "text-stitch-primary bg-stitch-primary/15 border border-stitch-primary/30 shadow-xs"
                                : "text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-variant/40"
                            }`}
                            title={lockedSections.includes(mod.id) ? "Protected (Click to configure lock & biometrics)" : "Click to configure password protection"}
                          >
                            {lockedSections.includes(mod.id) ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            {lockedSections.includes(mod.id) && (
                              <ChevronDown className={`w-3 h-3 text-stitch-primary/70 transition-transform ${expandedLockModId === mod.id ? "rotate-180" : ""}`} />
                            )}
                          </button>
                        )}
                        <button 
                          onClick={() => toggleModule(mod.id)}
                          disabled={pending}
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out disabled:opacity-50 ${
                            enabled ? 'bg-stitch-primary' : 'bg-surface-variant'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-on-primary transition-transform duration-300 ease-in-out shadow-sm ${
                            enabled ? 'translate-x-5' : 'translate-x-0 bg-on-surface-variant'
                          }`} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">
                      {mod.description}
                    </p>

                    {expandedLockModId === mod.id && mod.id !== "vault" && (
                      <ModuleLockSettingsDrawer
                        modId={mod.id}
                        modLabel={mod.label}
                        isLocked={lockedSections.includes(mod.id)}
                        onPromptPasswordLock={() => {
                          const isCurrentlyLocked = lockedSections.includes(mod.id);
                          setConfirmTarget({
                            id: mod.id,
                            name: mod.label,
                            isLocking: !isCurrentlyLocked,
                          });
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

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

function ModuleLockSettingsDrawer({
  modId,
  modLabel,
  isLocked,
  onPromptPasswordLock,
}: {
  modId: string;
  modLabel: string;
  isLocked: boolean;
  onPromptPasswordLock: () => void;
}) {
  const { getSectionConfig, updateSectionConfig, isBiometricAvailable } = useSectionSecurity();
  const config = getSectionConfig(modId);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (key: keyof SectionLockConfig, value: boolean | number) => {
    setSaving(true);
    await updateSectionConfig(modId, { [key]: value });
    setSaving(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-surface-container-high/80 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-on-surface flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-stitch-primary" />
          Lock &amp; Biometrics
        </span>
        <button
          type="button"
          onClick={onPromptPasswordLock}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
            isLocked
              ? "bg-stitch-primary/15 text-stitch-primary border border-stitch-primary/30 hover:bg-stitch-primary/25"
              : "bg-surface-container-high text-on-surface border border-surface-variant/40 hover:bg-surface-container"
          }`}
        >
          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          <span>{isLocked ? "Remove Protection" : "Enable Protection"}</span>
        </button>
      </div>

      {isLocked ? (
        <div className="space-y-2 pt-1">
          {/* Biometric Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low/70 border border-surface-variant/20">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-stitch-primary shrink-0" />
              <div>
                <p className="text-xs font-medium text-on-surface">Allow Device Biometrics</p>
                <p className="text-[10px] text-on-surface-variant">Unlock using fingerprint or Face ID</p>
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleToggle("biometricEnabled", !config.biometricEnabled)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 disabled:opacity-50 ${
                config.biometricEnabled ? "bg-stitch-primary" : "bg-surface-variant"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                  config.biometricEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Auto-Prompt Biometric Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low/70 border border-surface-variant/20">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning shrink-0" />
              <div>
                <p className="text-xs font-medium text-on-surface">Auto-Prompt on Entry</p>
                <p className="text-[10px] text-on-surface-variant">Immediately prompt fingerprint on opening</p>
              </div>
            </div>
            <button
              type="button"
              disabled={saving || !config.biometricEnabled}
              onClick={() => handleToggle("autoPromptBiometric", !config.autoPromptBiometric)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 disabled:opacity-30 ${
                config.autoPromptBiometric && config.biometricEnabled ? "bg-stitch-primary" : "bg-surface-variant"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                  config.autoPromptBiometric && config.biometricEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Re-lock on Background Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low/70 border border-surface-variant/20">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-stitch-secondary shrink-0" />
              <div>
                <p className="text-xs font-medium text-on-surface">Re-Lock on App Background</p>
                <p className="text-[10px] text-on-surface-variant">Lock again when switching away from app</p>
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleToggle("lockOnBackground", !config.lockOnBackground)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 disabled:opacity-50 ${
                config.lockOnBackground ? "bg-stitch-primary" : "bg-surface-variant"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                  config.lockOnBackground ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-on-surface-variant/70 leading-relaxed bg-surface-container-low/40 p-2.5 rounded-xl border border-surface-variant/20">
          This module is public. Click <strong>Enable Protection</strong> to require your security password or biometrics to open.
        </p>
      )}
    </div>
  );
}
