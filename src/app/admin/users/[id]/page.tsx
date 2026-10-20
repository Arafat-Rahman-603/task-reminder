import { checkAdmin, getAdminUserDetails } from "@/actions/admin.actions";
import { redirect } from "next/navigation";
import UserDetailsClient from "./UserDetailsClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailsPage({
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
    const userData = await getAdminUserDetails(id);
    return (
      <div className="min-h-screen bg-stitch-background text-on-surface antialiased">
        <UserDetailsClient initialData={userData} />
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-stitch-background text-on-surface flex items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-surface border border-surface-variant max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold text-white">User Not Found</h2>
          <p className="text-sm text-slate-400">
            The requested user account does not exist or has been deleted.
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
