import { getInvitationDetails } from "@/actions/workspaceInvitation.actions";
import InviteClient from "./InviteClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const token = resolvedParams?.token;
  if (!token) return { title: "Invitation | Manageo" };

  try {
    const data = await getInvitationDetails(token);
    if (data.valid && data.workspace?.name) {
      return {
        title: `Join ${data.workspace.name} | Manageo`,
        description: `You've been invited to join ${data.workspace.name} on Manageo.`,
      };
    }
  } catch {
    // fallback
  }

  return {
    title: "Workspace Invitation | Manageo",
    description: "Accept your invitation to collaborate on Manageo.",
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = await params;
  const token = resolvedParams?.token;

  if (!token) {
    notFound();
  }

  const inviteData = await getInvitationDetails(token);

  return <InviteClient token={token} inviteData={inviteData} />;
}
