"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Layout, Layers, Database, Bell, Mail, Shield, Coins, Clock, Lock, Palette, Sparkles } from "lucide-react";
import ModulesSettings from "./ModulesSettings";
import ThemeSettings from "./ThemeSettings";
import AiAndMcpSettings from "./AiAndMcpSettings";
import NavGroupBuilder from "./NavGroupBuilder";
import CustomSectionsSettings from "./CustomSectionsSettings";
import SectionSecuritySettings from "./SectionSecuritySettings";
import LanguageSettings from "./LanguageSettings";
import TaskSettings from "./TaskSettings";
import NotificationSettings from "./NotificationSettings";
import VaultSettings from "./VaultSettings";
import WorkspaceSettings from "./WorkspaceSettings";
import InstantSupportAssistant from "@/components/support/InstantSupportAssistant";
import { useLanguage } from "@/context/LanguageContext";

import type { WorkspaceInfo } from "@/components/WorkspaceSwitcher";

export interface SettingsUser {
  name?: string;
  email?: string;
  preferences?: {
    currency?: string;
    timezone?: string;
    taskSettings?: Record<string, unknown>;
    vaultSettings?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SettingsClientProps {
  user: SettingsUser;
  initialModules?: Record<string, boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customSections?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navGroups?: any[];
  initialTab?: string;
  initialSubTab?: string;
  activeWorkspace?: WorkspaceInfo | null;
}

export default function SettingsClient({
  user,
  initialModules,
  customSections,
  navGroups,
  initialTab = "personalization",
  initialSubTab,
  activeWorkspace,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { t } = useLanguage();

  const mobileTabs = [
    { id: "personalization", label: t("modules") },
    { id: "appearance", label: t("appearance", "Appearance") },
    { id: "ai-mcp", label: "AI & MCP" },
    { id: "navigation", label: t("navigation") },
    { id: "sections", label: t("custom_sections") },
    { id: "profile", label: t("profile_security") },
    { id: "security", label: "Security & Locks" },
    ...(activeWorkspace && activeWorkspace.type === "team"
      ? [{ id: "workspace", label: "Workspace" }]
      : []),
    { id: "tasks", label: "Tasks" },
    { id: "language", label: t("language") },
    { id: "notifications", label: "Notifications" },
    { id: "vault", label: "Vault Security" },
    { id: "support", label: "Contact Support" },
  ];

  return (
    <div className="w-full min-w-0 min-h-full max-w-5xl mx-auto space-y-4 md:space-y-6 pb-8 flex flex-col md:flex-row gap-4 md:gap-8">
      {/* Mobile Compact Header + Horizontal Section Switcher */}
      <div className="md:hidden space-y-3 min-w-0">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-stitch-primary">
            {t("settings")}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-on-surface mt-0.5">
            {t("control_center")}
          </h2>
        </div>
        <div
          aria-label="Settings Sections"
          className="flex overflow-x-auto gap-1.5 pb-1.5 -mx-0.5 px-0.5"
        >
          {mobileTabs.map((item) => {
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex-none whitespace-nowrap px-3.5 py-2 min-h-10 rounded-xl text-xs font-semibold border transition-colors ${
                  isSelected
                    ? "bg-stitch-primary/15 border-stitch-primary/40 text-stitch-primary"
                    : "bg-surface-container/70 border-surface-container-high text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Settings Sidebar */}
      <div className="hidden md:block w-full md:w-64 lg:w-72 shrink-0 space-y-1">
        <div className="mb-6 px-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-stitch-primary">{t("settings")}</span>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface mt-1">{t("control_center")}</h2>
        </div>

        <div className="space-y-0.5">
          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">{t("personalization")}</div>
          <button onClick={() => setActiveTab("personalization")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'personalization' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Layout className="w-4 h-4 shrink-0" /> <span className="truncate">{t("modules")}</span>
          </button>
          <button onClick={() => setActiveTab("appearance")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'appearance' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Palette className="w-4 h-4 shrink-0" /> <span className="truncate">{t("appearance", "Appearance & Theme")}</span>
          </button>
          <button onClick={() => setActiveTab("ai-mcp")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'ai-mcp' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Sparkles className="w-4 h-4 shrink-0" /> <span className="truncate">AI &amp; MCP Connector</span>
          </button>
          <button onClick={() => setActiveTab("navigation")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'navigation' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Layers className="w-4 h-4 shrink-0" /> <span className="truncate">{t("navigation")}</span>
          </button>
          <button onClick={() => setActiveTab("sections")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'sections' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Database className="w-4 h-4 shrink-0" /> <span className="truncate">{t("custom_sections")}</span>
          </button>
          
          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">{t("account")}</div>
          <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'profile' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <User className="w-4 h-4 shrink-0" /> <span className="truncate">{t("profile_security")}</span>
          </button>
          <button onClick={() => setActiveTab("security")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'security' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Lock className="w-4 h-4 shrink-0" /> <span className="truncate">Security &amp; Locks</span>
          </button>
          {activeWorkspace && activeWorkspace.type === 'team' && (
            <button onClick={() => setActiveTab("workspace")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'workspace' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
              <Database className="w-4 h-4 shrink-0" /> <span className="truncate">Workspace Settings</span>
            </button>
          )}
          
          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">{t("app_preferences")}</div>
          <button onClick={() => setActiveTab("tasks")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'tasks' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square shrink-0"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span className="truncate">Tasks</span>
          </button>
          <button onClick={() => setActiveTab("language")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'language' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            <span className="truncate">{t("language")}</span>
          </button>
          <button onClick={() => setActiveTab("notifications")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'notifications' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Bell className="w-4 h-4 shrink-0" /> <span className="truncate">Notifications</span>
          </button>
          <button onClick={() => setActiveTab("vault")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'vault' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Shield className="w-4 h-4 shrink-0" /> <span className="truncate">Vault Security</span>
          </button>

          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">Help & Support</div>
          <button onClick={() => setActiveTab("support")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === 'support' ? 'bg-stitch-primary/15 text-stitch-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
            <Mail className="w-4 h-4 shrink-0" /> <span className="truncate">Contact Support</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-surface-container-low/40 rounded-2xl sm:rounded-3xl border border-surface-container-high p-3.5 sm:p-5 md:p-6 shadow-xl backdrop-blur-xl">
        {activeTab === "personalization" && (
          <ModulesSettings
            initialModules={initialModules}
            onOpenSecurity={() => setActiveTab("security")}
            onOpenVaultSecurity={() => setActiveTab("vault")}
          />
        )}
        {activeTab === "appearance" && <ThemeSettings />}
        {activeTab === "ai-mcp" && <AiAndMcpSettings activeWorkspace={activeWorkspace} />}
        {activeTab === "navigation" && (
          <NavGroupBuilder initialGroups={navGroups} customSections={customSections} />
        )}
        {activeTab === "sections" && (
          <CustomSectionsSettings
            customSections={customSections}
            onOpenSecurity={() => setActiveTab("security")}
          />
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
          <div className="space-y-4">
            <InstantSupportAssistant userName={user?.name} compact />
            <div className="rounded-2xl bg-surface-container/60 border border-surface-container-high px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-stitch-primary shrink-0" />
                <span className="text-xs text-on-surface-variant">
                  Need a human specialist for billing or account issues?
                </span>
              </div>
              <Link
                href="/dashboard/support?view=tickets"
                className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2 min-h-11 sm:min-h-9 rounded-xl bg-stitch-primary text-on-primary font-semibold hover:bg-primary-fixed-dim transition-colors text-xs"
              >
                Open Human Support Tickets →
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
