import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import {
  getSupportAgentDashboardData,
  getSupportCustomerDirectory,
} from "@/actions/ticket.actions";
import SupportAgentClient from "./SupportAgentClient";

export const dynamic = "force-dynamic";

export default async function SupportAgentPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  // @ts-ignore
  const userId = session.user.id;
  await dbConnect();
  const user = await User.findById(userId)
    .select("isPlatformAdmin isSupportTeam name email")
    .lean();

  if (!user || (!user.isPlatformAdmin && !user.isSupportTeam)) {
    redirect("/dashboard/support");
  }

  const [dashboardData, customerDirectory] = await Promise.all([
    getSupportAgentDashboardData(),
    getSupportCustomerDirectory(),
  ]);

  return (
    <div className="min-h-full">
      <SupportAgentClient
        initialData={dashboardData}
        initialCustomers={customerDirectory}
        user={session.user}
      />
    </div>
  );
}
