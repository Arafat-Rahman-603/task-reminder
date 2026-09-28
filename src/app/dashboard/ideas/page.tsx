import { getIdeas } from "@/actions/idea.actions";
import { getDashboardBlocks } from "@/actions/dashboard.actions";
import IdeasClient from "./IdeasClient";
import { ModuleGuard } from "@/components/ModuleGuard";

export default async function IdeasPage() {
  return (
    <ModuleGuard moduleId="ideas">
      <IdeasPageContent />
    </ModuleGuard>
  );
}

async function IdeasPageContent() {
  const [{ ideas }, { blocks }] = await Promise.all([
    getIdeas(),
    getDashboardBlocks("ideas_dashboard")
  ]);

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-5xl">
      <IdeasClient initialIdeas={ideas} initialBlocks={blocks} />
    </div>
  );
}
