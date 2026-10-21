"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Layout, Layers, Database, Bell, Mail, Shield, Coins, Clock, Lock } from "lucide-react";
import ModulesSettings from "./ModulesSettings";
import NavGroupBuilder from "./NavGroupBuilder";
import CustomSectionsSettings from "./CustomSectionsSettings";
import SectionSecuritySettings from "./SectionSecuritySettings";
import LanguageSettings from "./LanguageSettings";
import TaskSettings from "./TaskSettings";
import NotificationSettings from "./NotificationSettings";
import VaultSettings from "./VaultSettings";
import WorkspaceSettings from "./WorkspaceSettings";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsClient({ user, initialModules, customSections, navGroups, initialTab = "personalization", initialSubTab, activeWorkspace }: any) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { t } = useLanguage();

  return (
    <div className="w-full min-h-full max-w-5xl mx-auto space-y-6 pb-10 flex flex-col md:flex-row gap-8">
      
      {/* Settings Sidebar */}
      <div className="w-full md:w-64 shrink-0 space-y-1">
        <div className="mb-6 px-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-stitch-primary">{t("settings")}</span>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface mt-1">{t("control_center")}</h2>
        </div>

        <div className="space-y-0.5">
          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">{t("personalization")}</div>
          <button onClick={() => setActiveTab("personalization")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'personalization' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Layout className="w-4 h-4" /> {t("modules")}
          </button>
          <button onClick={() => setActiveTab("navigation")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'navigation' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Layers className="w-4 h-4" /> {t("navigation")}
          </button>
          <button onClick={() => setActiveTab("sections")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'sections' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Database className="w-4 h-4" /> {t("custom_sections")}
          </button>
          
          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">{t("account")}</div>
          <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <User className="w-4 h-4" /> {t("profile_security")}
          </button>
          <button onClick={() => setActiveTab("security")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Lock className="w-4 h-4" /> Section Security & Lock
          </button>
          {activeWorkspace && activeWorkspace.type === 'team' && (
            <button onClick={() => setActiveTab("workspace")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'workspace' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
              <Database className="w-4 h-4" /> Workspace Settings
            </button>
          )}
          
          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">{t("app_preferences")}</div>
          <button onClick={() => setActiveTab("tasks")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'tasks' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Tasks
          </button>
          <button onClick={() => setActiveTab("language")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'language' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            {t("language")}
          </button>
          <button onClick={() => setActiveTab("notifications")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button onClick={() => setActiveTab("vault")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'vault' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Shield className="w-4 h-4" /> Vault Security
          </button>

          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">Help & Support</div>
          <button onClick={() => setActiveTab("support")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'support' ? 'bg-stitch-primary/15 text-stitch-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Mail className="w-4 h-4" />
            Contact Support
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
        {activeTab === "tasks" && (
          <TaskSettings initialSettings={user.preferences?.taskSettings} />
        )}
        {activeTab === "language" && (
          <LanguageSettings />
        )}
        {activeTab === "notifications" && (
          <NotificationSettings />
        )}
        {activeTab === "vault" && (
          <VaultSettings vaultSettings={user.preferences?.vaultSettings} />
        )}
        {activeTab === "security" && (
          <SectionSecuritySettings customSections={customSections} />
        )}
        {activeTab === "profile" && (
          <div className="py-6 space-y-6 max-w-lg mx-auto">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-stitch-primary/10 flex items-center justify-center text-stitch-primary mb-3">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold font-headline text-on-surface">User Information & Regional Settings</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mt-1">
                Your currency and local timezone are saved permanently to your profile and will not change unless you modify them.
              </p>
            </div>

            <div className="rounded-2xl bg-surface-container/60 p-4 border border-surface-container-high space-y-3">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-stitch-primary" />
                  <span className="text-xs font-semibold text-on-surface-variant">Selected Currency</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stitch-primary/15 text-stitch-primary font-mono">
                  {user?.preferences?.currency || "BDT"}
                </span>
              </div>

              <div className="h-px bg-surface-container-high"></div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-stitch-secondary" />
                  <span className="text-xs font-semibold text-on-surface-variant">Local Timezone</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stitch-secondary/15 text-stitch-secondary font-mono">
                  {user?.preferences?.timezone || "UTC"}
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <a 
                href="/dashboard/profile" 
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-stitch-primary text-on-primary font-semibold hover:bg-primary-fixed-dim transition-colors text-sm shadow-md"
              >
                Open User Information & Edit
              </a>
            </div>
          </div>
        )}
        {activeTab === "workspace" && activeWorkspace && (
          <WorkspaceSettings activeWorkspace={activeWorkspace} initialSubTab={initialSubTab} />
        )}
        {activeTab === "support" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="w-12 h-12 text-stitch-primary mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">Support Ticket Desk</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">Need help with your account, billing, or custom database? Create and manage real-time support tickets with our dedicated support team.</p>
            <Link href="/dashboard/support" className="px-6 py-2.5 rounded-xl bg-stitch-primary text-black font-semibold hover:bg-primary-fixed-dim transition-colors shadow-lg">
              Open Support Ticket Desk
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
