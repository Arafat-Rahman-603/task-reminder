import { checkAdmin, getAdminStats, getUpgradeRequests } from "@/actions/admin.actions";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const stats = await getAdminStats();
  const upgradeRequests = await getUpgradeRequests();

  return (
    <div className="min-h-screen bg-stitch-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-on-surface">Platform Administration</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-surface-variant">
            <h3 className="text-lg font-medium text-on-surface-variant">Total Users</h3>
            <p className="text-4xl font-bold text-stitch-primary mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-surface-variant">
            <h3 className="text-lg font-medium text-on-surface-variant">Total Workspaces</h3>
            <p className="text-4xl font-bold text-stitch-primary mt-2">{stats.totalWorkspaces}</p>
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-surface-variant">
            <h3 className="text-lg font-medium text-on-surface-variant">Pending Upgrades</h3>
            <p className="text-4xl font-bold text-stitch-primary mt-2">{stats.pendingUpgrades}</p>
          </div>
        </div>

        <AdminClient initialRequests={upgradeRequests} />
      </div>
    </div>
  );
}
