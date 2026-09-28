"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Loader2, FolderOpen } from "lucide-react";

type FieldDef = {
  id: string;
  name: string;
  type: string;
  required: boolean;
};

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "email", label: "Email" },
  { value: "select", label: "Select" },
];

export default function NewCustomSectionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [group, setGroup] = useState("");
  const [fields, setFields] = useState<FieldDef[]>([
    { id: "f1", name: "Title", type: "text", required: true }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addField = () => {
    setFields([...fields, { id: `f${Date.now()}`, name: "", type: "text", required: false }]);
  };

  const updateField = (id: string, updates: Partial<FieldDef>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const generateSlug = (str: string) =>
    str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Section name is required"); return; }
    if (fields.some(f => !f.name.trim())) { setError("All fields must have a name"); return; }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/custom-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: generateSlug(name),
          description: description.trim(),
          group: group.trim(),
          fields: fields.map(f => ({
            name: f.name.trim(),
            type: f.type.toLowerCase(),
            required: f.required,
          }))
        })
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create section");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-stitch-primary">Custom Sections</span>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">Create New Section</h1>
        </div>
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center pt-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-stitch-primary flex items-center justify-center">
          <FolderOpen className="w-7 h-7" />
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-danger-foreground bg-danger/20 rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section Info Card */}
        <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-surface-container-high p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stitch-primary">Section Details</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant">Section Name <span className="text-error">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Books to Read, Client CRM, Inventory"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
            />
            {name && (
              <p className="text-[11px] text-on-surface-variant/60">
                URL slug: /dashboard/custom/{generateSlug(name)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant">Description <span className="text-on-surface-variant/50 font-normal">(optional)</span></label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What will you track in this section?"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant">Navigation Group <span className="text-on-surface-variant/50 font-normal">(optional)</span></label>
            <input
              type="text"
              value={group}
              onChange={e => setGroup(e.target.value)}
              placeholder="e.g. Personal, Work (leave blank for My Sections)"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
            />
          </div>
        </div>

        {/* Fields Card */}
        <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-surface-container-high p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stitch-primary">Data Fields</h3>
            <button
              type="button"
              onClick={addField}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-stitch-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Field
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-surface-container-high/40 border border-surface-container-high">
                <input
                  type="text"
                  required
                  placeholder="Field name..."
                  value={field.name}
                  onChange={e => updateField(field.id, { name: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-lg bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-xs focus:outline-none focus:bg-surface-container-high transition-all min-w-0"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={field.type}
                    onChange={e => updateField(field.id, { type: e.target.value })}
                    className="h-9 px-2.5 rounded-lg bg-surface-container-high/60 text-on-surface text-xs focus:outline-none focus:bg-surface-container-high transition-all"
                  >
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>

                  <label className="flex items-center gap-1.5 text-[11px] text-on-surface-variant cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={e => updateField(field.id, { required: e.target.checked })}
                      className="w-3.5 h-3.5 rounded"
                    />
                    Required
                  </label>

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                      aria-label="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 h-12 rounded-xl bg-surface-container-high text-on-surface-variant font-medium text-sm flex items-center justify-center hover:text-on-surface transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Section"}
          </button>
        </div>
      </form>
    </div>
  );
}
