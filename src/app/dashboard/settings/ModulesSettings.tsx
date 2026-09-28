"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SYSTEM_MODULES } from "@/config/modules";
import { LucideIcon } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ModulesSettings({ initialModules }: any) {
  const router = useRouter();
  const [modules, setModules] = useState<Record<string, boolean>>(initialModules);
  const [pending, startTransition] = useTransition();
  const allModules = Object.values(SYSTEM_MODULES);

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
                    
                    <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">
                      {mod.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
