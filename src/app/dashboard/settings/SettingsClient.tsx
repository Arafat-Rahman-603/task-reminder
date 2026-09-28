"use client";

import { useState } from "react";
import { User, Layout, Layers, ShieldCheck, Database, Bell, MoreVertical } from "lucide-react";
import ModulesSettings from "./ModulesSettings";
import NavGroupBuilder from "./NavGroupBuilder";
import CustomSectionsSettings from "./CustomSectionsSettings";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SettingsClient({ user, initialModules, customSections, navGroups }: any) {
  const [activeTab, setActiveTab] = useState("personalization");

  return (
    <div className="w-full min-h-full max-w-5xl mx-auto space-y-6 pb-10 flex flex-col md:flex-row gap-8">
      
      {/* Settings Sidebar */}
      <div className="w-full md:w-64 shrink-0 space-y-1">
        <div className="mb-6 px-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-stitch-primary">Settings</span>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface mt-1">Control Center</h2>
        </div>

        <div className="space-y-0.5">
          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">Personalization</div>
          <button onClick={() => setActiveTab("personalization")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'personalization' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Layout className="w-4 h-4" /> Modules
          </button>
          <button onClick={() => setActiveTab("navigation")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'navigation' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Layers className="w-4 h-4" /> Navigation
          </button>
          <button onClick={() => setActiveTab("sections")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'sections' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Database className="w-4 h-4" /> Custom Sections
          </button>
          
          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">Account</div>
          <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <User className="w-4 h-4" /> Profile & Security
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-surface-container-low/40 rounded-3xl border border-surface-container-high p-6 shadow-xl backdrop-blur-xl">
        {activeTab === "personalization" && (
          <ModulesSettings initialModules={initialModules} />
        )}
        {activeTab === "navigation" && (
          <NavGroupBuilder initialGroups={navGroups} customSections={customSections} />
        )}
        {activeTab === "sections" && (
          <CustomSectionsSettings customSections={customSections} />
        )}
        {activeTab === "profile" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="w-12 h-12 text-stitch-primary mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">Profile & Security</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">Manage your name, email, and password from the dedicated profile page.</p>
            <a href="/dashboard/profile" className="px-6 py-2.5 rounded-xl bg-stitch-primary text-on-primary font-semibold hover:bg-primary-fixed-dim transition-colors">Go to Profile</a>
          </div>
        )}
      </div>

    </div>
  );
}
