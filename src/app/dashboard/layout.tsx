import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { getResolvedNavigation } from "@/actions/navigation.actions";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";
import { CommandMenu } from "@/components/CommandMenu";
import { ForceLogout } from "@/components/ForceLogout";
import User from "@/models/User";
import SupportTicket from "@/models/SupportTicket";
import dbConnect from "@/lib/db";
import { sanitizePreferencesForClient } from "@/lib/sanitize-preferences";

import { SectionSecurityProvider, SectionLockConfig } from "@/context/SectionSecurityContext";
import { SectionSecurityGuard } from "@/components/security/SectionSecurityGuard";
import { AppLockProvider, AppLockSettings, BiometricConfig } from "@/context/AppLockContext";
import { AppLockGuard } from "@/components/security/AppLockGuard";
import { UploadProvider } from "@/context/UploadContext";
import { BackgroundUploadWidget } from "@/components/ui/BackgroundUploadWidget";
import { getNoIndexMetadata } from "@/lib/seo/metadata";

function maskEmailAddress(email?: string | null): string | undefined {
  if (!email || !email.includes("@")) return undefined;
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0] || "*"}*@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

// The authenticated app must never appear in search results.
export const metadata = getNoIndexMetadata("Dashboard");

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  await dbConnect();
  const userId = (session.user as { id?: string }).id;
  const user = userId ? await User.findById(userId).lean() : null;

  if (!user) {
    return <ForceLogout />;
  }

  const safePrefs = sanitizePreferencesForClient((user as { preferences?: unknown }).preferences);
  const userModulesMap =
    safePrefs.modules && typeof safePrefs.modules === "object"
      ? (safePrefs.modules as Record<string, boolean>)
      : {};

  const safeSec = (safePrefs.sectionSecurity as Record<string, unknown> | undefined) || {};
  const initialLockedSections = Array.isArray(safeSec.lockedSections)
    ? (safeSec.lockedSections as string[])
    : [];
  const initialIsInitialized = Boolean(safeSec.isInitialized);
  const initialSectionConfigs =
    (safeSec.sectionConfigs as Record<string, SectionLockConfig> | undefined) || {};

  const rawLock = (safePrefs.appLockSettings as Record<string, unknown> | undefined) || {};
  const appLockSettings: AppLockSettings = {
    isEnabled: Boolean(rawLock.isEnabled),
    authMethod: (rawLock.authMethod as AppLockSettings["authMethod"]) || "password",
    timeoutMinutes: typeof rawLock.timeoutMinutes === "number" ? rawLock.timeoutMinutes : 5,
    lockOnBackground: rawLock.lockOnBackground !== undefined ? Boolean(rawLock.lockOnBackground) : true,
    requireBiometricWithoutFallback: Boolean(rawLock.requireBiometricWithoutFallback),
    strictSharedDeviceMode: Boolean(rawLock.strictSharedDeviceMode),
    hasCustomPin: Boolean(rawLock.hasCustomPin),
  };

  const rawBio = (safePrefs.biometricSettings as Record<string, unknown> | undefined) || {};
  const isBiometricEnrolled = Boolean(rawBio.isEnrolled);
  const biometricSettings: BiometricConfig = {
    isEnabled: rawBio.isEnabled !== undefined ? Boolean(rawBio.isEnabled) : isBiometricEnrolled,
    credentials: Array.isArray(rawBio.credentials)
      ? (rawBio.credentials as BiometricConfig["credentials"])
      : [],
    requireForVault: rawBio.requireForVault !== undefined ? Boolean(rawBio.requireForVault) : true,
    requireForSections: rawBio.requireForSections !== undefined ? Boolean(rawBio.requireForSections) : true,
    requireForAppLock: rawBio.requireForAppLock !== undefined ? Boolean(rawBio.requireForAppLock) : true,
    allowPasswordFallback: rawBio.allowPasswordFallback !== undefined ? Boolean(rawBio.allowPasswordFallback) : true,
    strictSharedDeviceProtection: Boolean(rawBio.strictSharedDeviceProtection),
    autoPromptAppLock: rawBio.autoPromptAppLock !== undefined ? Boolean(rawBio.autoPromptAppLock) : true,
    autoPromptVault: rawBio.autoPromptVault !== undefined ? Boolean(rawBio.autoPromptVault) : true,
  };

  const accountType = (session.user as { accountType?: string }).accountType || "individual";
  const isPlatformAdmin = !!(user as { isPlatformAdmin?: boolean }).isPlatformAdmin;
  const isSupportTeam = !!(user as { isSupportTeam?: boolean }).isSupportTeam;

  // Fetch navigation, active workspace, and unread ticket counts in parallel to minimize SSR latency
  const [{ groups }, workspaceInfo, unreadSupportCount, staffUnreadSupportCount] = await Promise.all([
    getResolvedNavigation(userModulesMap),
    getActiveWorkspaceInfo(),
    SupportTicket.countDocuments({ userId: (user as { _id: unknown })._id, userHasUnread: true }),
    isPlatformAdmin || isSupportTeam
      ? SupportTicket.countDocuments({
          staffHasUnread: true,
          status: { $in: ["open", "in_progress"] },
        })
      : Promise.resolve(0),
  ]);

  const workspaces = workspaceInfo?.workspaces || [];
  const activeWorkspace = workspaceInfo?.activeWorkspace;

  return (
    <AppLockProvider
      initialSettings={appLockSettings}
      initialBiometric={biometricSettings}
      initialIsEnrolled={isBiometricEnrolled}
      skipInitialFetch
    >
      <AppLockGuard>
        <SectionSecurityProvider
          initialLockedSections={initialLockedSections}
          initialIsInitialized={initialIsInitialized}
          initialSectionConfigs={initialSectionConfigs}
          initialUserEmail={maskEmailAddress((user as { email?: string }).email)}
          initialStrictSharedDeviceProtection={biometricSettings.strictSharedDeviceProtection}
          skipInitialFetch
        >
          <UploadProvider>
            {/* Use 100dvh so mobile browser chrome collapse/expand doesn't break layout */}
            {/* overflow-hidden on container + overflow-y-auto on main = one predictable scroll surface */}
            <div className="flex w-full overflow-hidden bg-stitch-background text-on-surface font-sans selection:bg-stitch-primary/20 selection:text-stitch-primary" style={{ height: "100dvh" }}>
              <CommandMenu userModules={userModulesMap} />
              {/* Desktop sidebar */}
              <Sidebar
                navGroups={groups || []}
                workspaces={workspaces}
                activeWorkspace={activeWorkspace}
                accountType={accountType}
                isPlatformAdmin={isPlatformAdmin}
                isSupportTeam={isSupportTeam}
                unreadSupportCount={unreadSupportCount}
                staffUnreadSupportCount={staffUnreadSupportCount}
              />
              {/* Mobile nav drawer + fixed top bar & bottom bar */}
              <MobileNav
                navGroups={groups || []}
                workspaces={workspaces}
                activeWorkspace={activeWorkspace}
                accountType={accountType}
                isPlatformAdmin={isPlatformAdmin}
                isSupportTeam={isSupportTeam}
                unreadSupportCount={unreadSupportCount}
                staffUnreadSupportCount={staffUnreadSupportCount}
              />
              <main
                id="dashboard-main-scroll"
                className="flex-1 min-w-0 overflow-y-auto overscroll-contain overflow-x-hidden"
                style={{
                  paddingLeft: "var(--safe-area-left, env(safe-area-inset-left, 0px))",
                  paddingRight: "var(--safe-area-right, env(safe-area-inset-right, 0px))",
                }}
                // overscroll-contain prevents scroll chaining to the window on iOS
              >
                {/* Top safe-area spacer (mobile only) — pushes content below fixed header + notch */}
                <div
                  className="md:hidden shrink-0"
                  style={{ height: "calc(3.5rem + var(--safe-area-top, env(safe-area-inset-top, 0px)))" }}
                  aria-hidden="true"
                />
                <div className="mx-auto max-w-7xl pt-3 pb-6 px-3.5 sm:px-6 md:px-8 md:pt-8 md:pb-8">
                  <SectionSecurityGuard>
                    {children}
                  </SectionSecurityGuard>
                </div>
                {/* Bottom safe-area spacer (mobile only) — pushes content above fixed bottom bar + home indicator */}
                <div
                  className="md:hidden shrink-0"
                  style={{ height: "calc(4.5rem + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)))" }}
                  aria-hidden="true"
                />
              </main>
              {/* Persistent Background Upload Drawer / Widget */}
              <BackgroundUploadWidget />
            </div>
          </UploadProvider>
        </SectionSecurityProvider>
      </AppLockGuard>
    </AppLockProvider>
  );
}
