import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getUserSupportTickets } from "@/actions/ticket.actions";
import SupportClient from "./SupportClient";

export const dynamic = "force-dynamic";

export default async function SupportPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const resolvedParams = (await searchParams) || {};
  const initialView = resolvedParams.view === "tickets" ? "tickets" : "ai";

  // @ts-ignore
  const userId = session.user.id;
  await dbConnect();
  const dbUser = await User.findById(userId)
    .select("isPlatformAdmin isSupportTeam")
    .lean();

  const isStaff = !!(dbUser?.isPlatformAdmin || dbUser?.isSupportTeam);

  const tickets = await getUserSupportTickets();

  return (
    <div className="min-h-full">
      <SupportClient
        initialTickets={tickets}
        user={session.user}
        isStaff={isStaff}
        initialView={initialView}
      />
    </div>
  );
}

