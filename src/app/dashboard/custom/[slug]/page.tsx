/* eslint-disable @typescript-eslint/no-explicit-any -- Unavoidable dynamic db payload */
import { getCustomSections, getCustomFields, getCustomRecords } from "@/actions/customSection.actions";
import { notFound } from "next/navigation";
import { PlusCircle, LayoutGrid, List } from "lucide-react";

export default async function CustomSectionPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const { sections } = await getCustomSections();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const section = sections.find((s: any) => s.slug === params.slug);

  if (!section) {
    return notFound();
  }

  const [{ fields }, { records }] = await Promise.all([
    getCustomFields(section._id),
    getCustomRecords(section._id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{section.name}</h1>
          {section.description && (
            <p className="text-muted-foreground dark:text-zinc-400 mt-1">{section.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-muted rounded-md">
             <button className={`p-1.5 rounded-sm ${section.layout === 'list' ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-muted-foreground hover:text-zinc-900'}`}>
               <List className="h-4 w-4" />
             </button>
             <button className={`p-1.5 rounded-sm ${section.layout === 'gallery' ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-muted-foreground hover:text-zinc-900'}`}>
               <LayoutGrid className="h-4 w-4" />
             </button>
          </div>
          <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors transition-colors">
            <PlusCircle className="h-4 w-4" />
            New Item
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        {fields.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-medium">No Fields Configured</h3>
            <p className="text-muted-foreground mt-2 mb-6">Create your database schema by adding fields like Text, Date, Select, etc.</p>
            <button className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors">
              Configure Fields
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-muted/50 border-border">
                <tr>
                  {fields.map((f: Record<string, any>) => (
                    <th key={f._id} className="px-6 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {f.name}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={fields.length + 1} className="px-6 py-8 text-center text-muted-foreground">
                      No records found. Click &apos;New Item&apos; to create one.
                    </td>
                  </tr>
                ) : (
                  records.map((r: Record<string, any>) => (
                    <tr key={r._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      {fields.map((f: Record<string, any>) => (
                        <td key={f._id} className="px-6 py-4 whitespace-nowrap">
                          {r.data?.[f._id] || <span className="text-zinc-400">-</span>}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <button className="text-muted-foreground hover:text-zinc-900 dark:hover:text-white transition-colors">Edit</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
