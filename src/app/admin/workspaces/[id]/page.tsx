import { checkAdmin, getAdminWorkspaceDetails } from "@/actions/admin.actions";
import { redirect } from "next/navigation";
import WorkspaceDetailsClient from "./WorkspaceDetailsClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const { id } = await params;

  try {
    const wsData = await getAdminWorkspaceDetails(id);
    return (
      <div className="min-h-screen bg-stitch-background text-on-surface antialiased">
        <WorkspaceDetailsClient initialData={wsData} />
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-stitch-background text-on-surface flex items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-surface border border-surface-variant max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Workspace Not Found</h2>
          <p className="text-sm text-slate-400">
            The requested workspace tenant does not exist or has been removed.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Admin Panel</span>
          </Link>
        </div>
      </div>
    );
  }
}
