import { getTrashItems } from "@/actions/trash.actions";
import TrashClient from "./TrashClient";
import { getNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = getNoIndexMetadata("Trash / Recently Deleted");
export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const { items, total } = await getTrashItems({ limit: 100 });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <TrashClient initialItems={items || []} initialTotal={total || 0} />
    </div>
  );
}
