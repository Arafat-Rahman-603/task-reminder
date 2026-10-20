import {
  checkAdmin,
  getAdminOverview,
  getAdminUsers,
  getAdminWorkspaces,
  getAdminUpgradeRequests,
  getLiveSystemDiagnostics,
  getAdminTransactions,
  getAdminContactMessages,
  getAdminAllPlans,
  getCustomizerConfig,
  getAdminBillingOverview,
} from "@/actions/admin.actions";
import {
  getAdminSupportTickets,
  getSupportAgentsList,
} from "@/actions/ticket.actions";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const [
    overview,
    users,
    workspaces,
    upgradeRequests,
    systemDiagnostics,
    transactionsData,
    contactMessages,
    platformPlans,
    customizerConfig,
    billingOverview,
    supportTicketsData,
    supportAgents,
  ] = await Promise.all([
    getAdminOverview(),
    getAdminUsers(),
    getAdminWorkspaces(),
    getAdminUpgradeRequests(),
    getLiveSystemDiagnostics(),
    getAdminTransactions(),
    getAdminContactMessages(),
    getAdminAllPlans(),
    getCustomizerConfig(),
    getAdminBillingOverview(),
    getAdminSupportTickets(),
    getSupportAgentsList(),
  ]);

  return (
    <div className="min-h-screen bg-stitch-background text-on-surface antialiased">
      <AdminClient
        initialOverview={overview}
        initialUsers={users}
        initialWorkspaces={workspaces}
        initialRequests={upgradeRequests}
        initialDiagnostics={systemDiagnostics}
        initialTransactions={transactionsData}
        initialContacts={contactMessages}
        initialPlans={platformPlans}
        initialCustomizerConfig={customizerConfig}
        initialBillingOverview={billingOverview}
        initialSupportTicketsData={supportTicketsData}
        initialSupportAgents={supportAgents}
      />
    </div>
  );
}
