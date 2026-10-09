"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Edit2, Trash2 } from "lucide-react";
import { deleteCustomRecord } from "@/actions/customSection.actions";
import { useTransition } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CustomRecordDetailClient({ section, fields, record }: { section: any; fields: any[]; record: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Delete this record?")) return;
    startTransition(async () => {
      const res = await deleteCustomRecord(record._id);
      if (res.success) {
        router.push(`/dashboard/custom/${section.slug}`);
      }
    });
  };

  return (
    <div className="flex flex-col w-full text-on-surface space-y-6">
      <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
        <Link href={`/dashboard/custom/${section.slug}`} className="flex items-center gap-1.5 hover:text-stitch-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {section.name}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-surface-container/60 p-6 rounded-2xl border border-surface-container-high">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">{record.title || "Untitled"}</h1>
          {record.date && (
            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Calendar className="w-4 h-4" />
              {new Date(record.date).toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* We might add an edit form here or simply redirect to the section to edit, but for now we provide delete, editing can be done on the list view or added here later */}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-error/10 text-error font-medium text-sm hover:bg-error/20 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="bg-surface-container/60 p-6 rounded-2xl border border-surface-container-high space-y-6">
        <h2 className="text-lg font-bold text-on-surface">Details</h2>
        
        {fields.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No custom fields configured for this section.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(field => (
              <div key={field._id} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {field.name}
                </span>
                <div className="text-sm text-on-surface">
                  {(field.type === "image" || field.type === "document") && record.data?.[field._id] ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(record.data[field._id]) ? (
                        record.data[field._id].map((att: any, i: number) => (
                          <a key={i} href={att.publicId ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'auto'}` : att.url} target="_blank" rel="noopener noreferrer" className="block border border-surface-variant rounded-lg overflow-hidden hover:border-stitch-primary transition-colors">
                            {att.resourceType === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={att.publicId ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'image'}` : att.url} alt={att.originalFilename || field.name} className="h-24 w-24 object-cover" />
                            ) : (
                              <div className="h-24 w-24 flex items-center justify-center bg-surface-variant/20 text-on-surface-variant flex-col p-2 text-center">
                                <span className="text-[10px] font-medium truncate w-full mt-1">{att.originalFilename || `File ${i + 1}`}</span>
                              </div>
                            )}
                          </a>
                        ))
                      ) : typeof record.data[field._id] === 'string' ? (
                        <a href={record.data[field._id]} target="_blank" rel="noopener noreferrer" className="block border border-surface-variant rounded-lg overflow-hidden hover:border-stitch-primary transition-colors">
                          <img src={record.data[field._id]} alt={field.name} className="h-24 w-24 object-cover" />
                        </a>
                      ) : null}
                    </div>
                  ) : field.type === "url" && record.data?.[field._id] ? (
                    <a href={record.data[field._id]} target="_blank" rel="noopener noreferrer" className="text-stitch-primary hover:underline">
                      {record.data[field._id]}
                    </a>
                  ) : record.data?.[field._id] ? (
                    <span className={field.type === "textarea" || field.type === "longText" ? "whitespace-pre-wrap" : ""}>
                      {record.data[field._id]}
                    </span>
                  ) : (
                    <span className="text-on-surface-variant/50">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
