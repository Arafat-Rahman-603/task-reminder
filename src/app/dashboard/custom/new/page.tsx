"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FieldType, ViewType } from "@/models/CustomSection";

// We duplicate types here to avoid importing mongoose in client components if needed,
// but since it's just type definitions, it's fine. We'll use local types for simplicity.

type FieldDef = {
  id: string;
  name: string;
  type: string;
  required: boolean;
};

export default function NewCustomSectionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [defaultView, setDefaultView] = useState<string>("Simple List");
  const [fields, setFields] = useState<FieldDef[]>([
    { id: "f1", name: "Title", type: "Text", required: true }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addField = () => {
    setFields([...fields, { id: `f${Date.now()}`, name: "", type: "Text", required: false }]);
  };

  const updateField = (id: string, updates: Partial<FieldDef>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app we would call a server action or API route here.
      // For now we'll mock the success to unblock navigation testing.
      const res = await fetch("/api/custom-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, defaultView, fields })
      });
      
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        console.error("Failed to create section");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Create Custom Section</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-surface p-6 rounded-xl border border-border">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Section Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Books to Read, Client CRM, Inventory"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:ring-1 focus:ring-focus outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Default View</label>
            <select
              value={defaultView}
              onChange={e => setDefaultView(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:ring-1 focus:ring-focus outline-none"
            >
              <option value="Simple List">Simple List</option>
              <option value="Table">Table</option>
              <option value="Kanban">Kanban</option>
              <option value="Gallery">Gallery</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-foreground">Data Fields</h2>
            <button 
              type="button" 
              onClick={addField}
              className="text-sm font-medium text-primary hover:underline"
            >
              + Add Field
            </button>
          </div>
          
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border">
                <input
                  required
                  type="text"
                  placeholder="Field Name"
                  value={field.name}
                  onChange={e => updateField(field.id, { name: e.target.value })}
                  className="flex-1 bg-transparent border-b border-border outline-none py-1 focus:border-focus"
                />
                <select
                  value={field.type}
                  onChange={e => updateField(field.id, { type: e.target.value })}
                  className="bg-surface border border-border rounded px-2 py-1 text-sm outline-none"
                >
                  <option value="Text">Text</option>
                  <option value="Long Text">Long Text</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date</option>
                  <option value="Select">Select</option>
                  <option value="Checkbox">Checkbox</option>
                </select>
                <label className="flex items-center gap-1 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateField(field.id, { required: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                  Required
                </label>
                {index > 0 && (
                  <button 
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="text-danger hover:text-danger/80 text-sm ml-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Section"}
          </button>
        </div>
      </form>
    </div>
  );
}
