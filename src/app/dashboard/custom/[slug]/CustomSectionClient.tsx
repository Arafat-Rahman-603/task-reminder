"use client";

import { useState, useTransition } from "react";
import { createCustomRecord, deleteCustomRecord } from "@/actions/customSection.actions";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, X, Plus, Save, Loader2, Search } from "lucide-react";
import DashboardBlockEngine from "@/components/dashboard/DashboardBlockEngine";
import { FilterButton, FilterPanel } from "@/components/ui/FilterPanel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CustomSectionClient({ section, fields, initialRecords, initialBlocks = [] }: { section: any; fields: any[]; initialRecords: any[]; initialBlocks?: any[] }) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecords = records.filter(record => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      // Search across all data fields
      const hasMatch = fields.some(field => {
        const val = record.data?.[field._id];
        return val && typeof val === 'string' && val.toLowerCase().includes(query);
      });
      if (!hasMatch) return false;
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Custom Validation
    const missingFields = fields.filter(f => f.required && !formData[f._id]);
    if (missingFields.length > 0) {
      setError(`Cannot add item yet. Missing required fields: ${missingFields.map(f => f.name).join(", ")}. Please complete them to continue.`);
      setSaving(false);
      return;
    }

    let finalReminderTime = undefined;
    if (reminderDate && reminderTime) {
      const dt = new Date(`${reminderDate}T${reminderTime}`);
      if (!isNaN(dt.getTime())) {
        finalReminderTime = dt.toISOString();
      }
    }

    const res = await createCustomRecord(section._id, formData, finalReminderTime);
    if (res.success) {
      setRecords(prev => [res.record, ...prev]);
      setFormData({});
      setReminderDate("");
      setReminderTime("");
      setShowAddForm(false);
      router.refresh();
    } else {
      setError(res.error || "Failed to create record");
    }
    setSaving(false);
  };

  const handleDelete = (recordId: string) => {
    if (!confirm("Delete this record?")) return;
    startTransition(async () => {
      const res = await deleteCustomRecord(recordId);
      if (res.success) {
        setRecords(prev => prev.filter(r => r._id !== recordId));
      }
    });
  };

  return (
    <div className="flex flex-col w-full text-on-surface space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-stitch-primary">Custom Section</span>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">{section.name}</h2>
          {section.description && <p className="text-xs text-on-surface-variant mt-0.5">{section.description}</p>}
        </div>
        {fields.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-on-surface-variant pointer-events-none" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..." 
                className="w-full pl-10 pr-4 h-10 text-sm rounded-xl bg-surface-container-low/70 backdrop-blur-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:bg-surface-container/90 transition-all border border-surface-variant/40" 
              />
            </div>
            <FilterButton 
              isActive={showFilterPanel || !!searchQuery}
              activeCount={searchQuery ? 1 : 0}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            />
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-primary-container text-on-primary-container font-medium text-xs shadow-md hover:bg-stitch-primary hover:text-on-primary transition-all active:scale-95"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? "Cancel" : "New Item"}
            </button>
          </div>
        )}
      </div>

      <FilterPanel 
        isOpen={showFilterPanel} 
        onClose={() => setShowFilterPanel(false)}
        onClear={() => setSearchQuery("")}
      >
        <div className="space-y-4">
          <div className="space-y-1.5 sm:hidden">
            <label className="text-xs font-semibold text-on-surface-variant">Search</label>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..." 
              className="w-full px-3 h-10 text-sm rounded-xl bg-surface-container text-on-surface focus:outline-none border border-surface-variant/50 focus:border-stitch-primary/50" 
            />
          </div>
        </div>
      </FilterPanel>

      {/* Dashboard Block Engine for Custom Section */}
      <DashboardBlockEngine 
        sectionId={section._id} 
        initialBlocks={initialBlocks} 
        fields={fields} 
        records={records} 
      />

      {/* Add Record Form */}
      {showAddForm && fields.length > 0 && (
        <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-4 shadow-lg border border-primary/20">
          <h3 className="text-sm font-semibold text-on-surface mb-3">New Record</h3>
          {error && <div className="mb-3 p-2 text-xs text-danger-foreground bg-danger/20 rounded-lg">{error}</div>}
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            {fields.map((field) => (
              <div key={field._id} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant">
                  {field.name} {field.required && <span className="text-error">*</span>}
                </label>
                {field.type === "text" || field.type === "number" || field.type === "email" || field.type === "url" || field.type === "date" ? (
                  <input
                    type={field.type === "text" ? "text" : field.type}
                    value={formData[field._id] || ""}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, [field._id]: e.target.value }));
                      setError(""); // Clear error when typing
                    }}
                    className={`h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all ${error && field.required && !formData[field._id] ? 'border border-error' : ''}`}
                    placeholder={`Enter ${field.name.toLowerCase()}...`}
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={formData[field._id] || ""}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, [field._id]: e.target.value }));
                      setError("");
                    }}
                    className={`px-3.5 py-2 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all resize-none ${error && field.required && !formData[field._id] ? 'border border-error' : ''}`}
                    placeholder={`Enter ${field.name.toLowerCase()}...`}
                  />
                ) : (field.type === "select" || field.type === "status") && field.options?.length ? (
                  <select
                    value={formData[field._id] || ""}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, [field._id]: e.target.value }));
                      setError("");
                    }}
                    className={`h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all ${error && field.required && !formData[field._id] ? 'border border-error' : ''}`}
                  >
                    <option value="">Select...</option>
                    {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === "image" ? (
                  <div className="flex items-center gap-3">
                    {formData[field._id] && (
                      <img src={formData[field._id]} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-surface-container-high" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({ ...prev, [field._id]: reader.result as string }));
                            setError("");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className={`block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stitch-primary file:text-on-primary hover:file:bg-primary-fixed-dim transition-all ${error && field.required && !formData[field._id] ? 'border border-error' : ''}`}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData[field._id] || ""}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, [field._id]: e.target.value }));
                      setError("");
                    }}
                    className={`h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all ${error && field.required && !formData[field._id] ? 'border border-error' : ''}`}
                    placeholder={`Enter ${field.name.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
            
            <div className="flex flex-col gap-1 border-t border-surface-container-high pt-3 mt-1">
              <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
                Optional Reminder
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={reminderDate}
                  onChange={e => setReminderDate(e.target.value)}
                  className="h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
                />
                <input
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-xl bg-stitch-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors disabled:opacity-60 mt-1"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Record</>}
            </button>
          </form>
        </div>
      )}

      {/* No Fields State */}
      {fields.length === 0 && (
        <div className="rounded-2xl bg-surface-container/60 p-8 text-center border border-dashed border-surface-container-high">
          <PlusCircle className="w-10 h-10 text-on-surface-variant opacity-50 mx-auto mb-3" />
          <p className="text-sm font-medium text-on-surface-variant mb-1">No fields configured yet</p>
          <p className="text-xs text-on-surface-variant/60">This section has no fields. You can add fields by creating a new section from scratch.</p>
        </div>
      )}

      {/* Records Table */}
      {fields.length > 0 && (
        <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-surface-container-high overflow-hidden">
          {records.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-on-surface-variant">No records yet. Click &apos;New Item&apos; to create one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-high/50">
                  <tr>
                    {fields.map(field => (
                      <th key={field._id} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                        {field.name}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {filteredRecords.map((record) => (
                    <tr key={record._id} className={`hover:bg-surface-container/80 transition-colors ${isPending ? 'opacity-50' : ''}`}>
                      {fields.map(field => (
                        <td key={field._id} className="px-4 py-3 text-on-surface whitespace-nowrap">
                          {field.type === "image" && record.data?.[field._id] ? (
                            <img src={record.data[field._id]} alt="Image" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            record.data?.[field._id] || <span className="text-on-surface-variant/50">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                          aria-label="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {filteredRecords.length > 0 && (
        <p className="text-xs text-on-surface-variant text-right">
          {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
