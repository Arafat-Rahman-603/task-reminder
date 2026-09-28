"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { SYSTEM_MODULES } from "@/config/modules";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  // We initialize with default enabled status from config
  const defaultModules = Object.values(SYSTEM_MODULES).reduce((acc, mod) => {
    acc[mod.id] = mod.defaultEnabled;
    return acc;
  }, {} as Record<string, boolean>);

  const [modules, setModules] = useState<Record<string, boolean>>(defaultModules);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Need to fetch user preferences
    fetch("/api/user/preferences")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch preferences");
        return res.json();
      })
      .then(data => {
        if (data.preferences?.modules) {
          setModules(prev => ({ ...prev, ...data.preferences.modules }));
        }
        if (data.preferences?.theme) {
          setTheme(data.preferences.theme);
        }
        setMounted(true);
      })
      .catch(err => {
        console.error(err);
        setMounted(true);
      });
  }, [setTheme]);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    await fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: newTheme })
    });
  };

  const toggleModule = async (modId: string) => {
    const newValue = !modules[modId];
    setModules(prev => ({ ...prev, [modId]: newValue }));
    
    setSaving(true);
    await fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modules: { [modId]: newValue } })
    });
    setSaving(false);
    
    // Refresh router to update sidebar if needed
    router.refresh();
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account preferences and application modules.</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-medium text-foreground border-b border-border pb-2">Appearance</h2>
        <div className="flex items-center justify-between bg-surface p-4 rounded-lg border border-border">
          <div>
            <p className="font-medium text-foreground">Theme</p>
            <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
          </div>
          <select 
            value={theme} 
            onChange={(e) => handleThemeChange(e.target.value)}
            className="block rounded-md border border-border bg-background py-1.5 px-3 text-foreground shadow-sm focus:ring-1 focus:ring-focus sm:text-sm"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-2">
          <h2 className="text-lg font-medium text-foreground">My Modules</h2>
          {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>
        <p className="text-sm text-muted-foreground mb-4">Turn features on or off. Disabled modules will be completely hidden from the application.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(SYSTEM_MODULES).filter(m => m.category !== "System" && m.implemented).map((mod) => {
            const enabled = modules[mod.id] !== undefined ? modules[mod.id] : mod.defaultEnabled;
            return (
              <div key={mod.id} className="flex flex-col bg-surface p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <mod.icon className="h-5 w-5 text-primary" />
                    <p className="font-medium text-foreground">{mod.label}</p>
                  </div>
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 ${enabled ? 'bg-primary' : 'bg-disabled'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{mod.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
