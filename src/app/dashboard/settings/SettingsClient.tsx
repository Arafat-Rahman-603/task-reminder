"use client";

import { useState } from "react";
import { User, Layout, Layers, Database, Bell, Mail } from "lucide-react";
import ModulesSettings from "./ModulesSettings";
import NavGroupBuilder from "./NavGroupBuilder";
import CustomSectionsSettings from "./CustomSectionsSettings";
import LanguageSettings from "./LanguageSettings";
import TaskSettings from "./TaskSettings";
import NotificationSettings from "./NotificationSettings";
import { useLanguage } from "@/context/LanguageContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SettingsClient({ user, initialModules, customSections, navGroups, initialTab = "personalization" }: any) {
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
        {activeTab === "profile" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="w-12 h-12 text-stitch-primary mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">Profile & Security</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">Manage your name, email, and password from the dedicated profile page.</p>
            <a href="/dashboard/profile" className="px-6 py-2.5 rounded-xl bg-stitch-primary text-on-primary font-semibold hover:bg-primary-fixed-dim transition-colors">Go to Profile</a>
          </div>
        )}
        {activeTab === "support" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="w-12 h-12 text-stitch-primary mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">Need Help?</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">If you have any questions, encounter issues, or need assistance, our support team is here to help you.</p>
            <a href="/contact" className="px-6 py-2.5 rounded-xl bg-stitch-primary text-on-primary font-semibold hover:bg-primary-fixed-dim transition-colors">Contact Us</a>
          </div>
        )}
      </div>

    </div>
  );
}
