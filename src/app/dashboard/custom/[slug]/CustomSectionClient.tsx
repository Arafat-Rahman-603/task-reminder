"use client";

import { useState, useTransition, useEffect } from "react";
import { createCustomRecord, updateCustomRecord, deleteCustomRecord } from "@/actions/customSection.actions";
import { updateCustomSectionAndFields } from "@/actions/customSection.actions";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, Edit2, X, Plus, Save, Loader2, Search, Settings } from "lucide-react";
import DashboardBlockEngine from "@/components/dashboard/DashboardBlockEngine";
import { FilterSystem, FilterDefinition } from "@/components/ui/FilterSystem";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CustomSectionClient({ section, fields, initialRecords, initialBlocks = [] }: { section: any; fields: any[]; initialRecords: any[]; initialBlocks?: any[] }) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  useEffect(() => { setRecords(initialRecords); }, [initialRecords]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Generate dynamic filters based on custom fields
  const CUSTOM_FILTERS: FilterDefinition[] = [
    { id: "createdAt", label: "Date Created", type: "date-range" }
  ];
  
  fields.forEach(f => {
    if (f.type === 'date') {
      CUSTOM_FILTERS.push({
        id: f._id,
        label: f.name,
        type: 'date-range'
      });
    } else if (f.type === 'select') {
      const uniqueValues = Array.from(new Set(records.map(r => r.data?.[f._id]).filter(Boolean)));
      if (uniqueValues.length > 0) {
        CUSTOM_FILTERS.push({
          id: f._id,
          label: f.name,
          type: 'select',
          options: uniqueValues.map(v => ({ value: v, label: v }))
        });
      }
    }
  });

  // Edit Section State
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [editSectionName, setEditSectionName] = useState(section.name);
  const [editSectionDesc, setEditSectionDesc] = useState(section.description || "");
  const [editSectionFields, setEditSectionFields] = useState<{_id?: string; name: string; type: string; required: boolean; clientId?: string}[]>([]);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [sectionError, setSectionError] = useState("");

  const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Long Text" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "url", label: "URL" },
    { value: "email", label: "Email" },
    { value: "select", label: "Select" },
  ];

  const handleOpenEditSection = () => {
    setEditSectionName(section.name);
    setEditSectionDesc(section.description || "");
    setEditSectionFields(fields.map(f => ({
      _id: f._id,
      name: f.name,
      type: f.type === 'longText' ? 'textarea' : f.type,
      required: f.isRequired
    })));
    setShowEditSectionModal(true);
  };

  const handleAddEditField = () => {
    setEditSectionFields([...editSectionFields, { clientId: `f${Date.now()}`, name: "", type: "text", required: false }]);
  };

  const handleSaveSection = async () => {
    if (!editSectionName.trim()) { setSectionError("Section name is required"); return; }
    if (editSectionFields.some(f => !f.name.trim())) { setSectionError("All fields must have a name"); return; }
    
    setIsSavingSection(true);
    setSectionError("");
    
    const res = await updateCustomSectionAndFields(section._id, {
      name: editSectionName.trim(),
      description: editSectionDesc.trim(),
      fields: editSectionFields.map(f => ({
        _id: f._id,
        name: f.name.trim(),
        type: f.type,
        required: f.required
      }))
    });
    
    setIsSavingSection(false);
    if (res.success) {
      setShowEditSectionModal(false);
      router.refresh();
    } else {
      setSectionError(res.error || "Failed to save section");
    }
  };

  const handleEdit = (record: any) => {
    setFormData(record.data);
    let initDate = "";
    let initTime = "";
    if (record.reminder && record.reminder.remindAt) {
      const dt = new Date(record.reminder.remindAt);
      initDate = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, '0') + "-" + String(dt.getDate()).padStart(2, '0');
      initTime = String(dt.getHours()).padStart(2, '0') + ":" + String(dt.getMinutes()).padStart(2, '0');
    }
    setReminderDate(initDate);
    setReminderTime(initTime);
    setEditingRecordId(record._id);
    setShowAddForm(true);
  };

  const filteredRecords = records.filter(record => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const hasMatch = fields.some(field => {
        const val = record.data?.[field._id];
        return val && typeof val === 'string' && val.toLowerCase().includes(query);
      });
      if (!hasMatch) return false;
    }
    
    // Check dynamic filters
    for (const f of CUSTOM_FILTERS) {
      if (f.type === 'select' && filters[f.id]) {
        if (record.data?.[f.id] !== filters[f.id]) return false;
      }
      
      if (f.type === 'date-range') {
        const startKey = `${f.id}_start`;
        const endKey = `${f.id}_end`;
        if (filters[startKey] || filters[endKey]) {
          // 'createdAt' is top level, custom date fields are inside 'data'
          const dateVal = f.id === 'createdAt' ? record.createdAt : record.data?.[f.id];
          if (!dateVal) return false;
          
          const d = new Date(dateVal);
          if (filters[startKey]) {
            const start = new Date(filters[startKey]);
            start.setHours(0,0,0,0);
            if (d < start) return false;
          }
          if (filters[endKey]) {
            const end = new Date(filters[endKey]);
            end.setHours(23,59,59,999);
            if (d > end) return false;
          }
        }
      }
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

    let finalReminderTime: string | null | undefined = undefined;
    if (reminderDate && reminderTime) {
      const dt = new Date(`${reminderDate}T${reminderTime}`);
      if (!isNaN(dt.getTime())) {
        finalReminderTime = dt.toISOString();
      }
    } else if (!reminderDate && !reminderTime) {
      finalReminderTime = null;
    }

    if (editingRecordId) {
      const res = await updateCustomRecord(editingRecordId, formData, finalReminderTime);
      if (res.success) {
        setRecords(prev => prev.map(r => r._id === editingRecordId ? res.record : r));
        setFormData({});
        setReminderDate("");
        setReminderTime("");
        setEditingRecordId(null);
        setShowAddForm(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update record");
      }
    } else {
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
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">{section.name}</h2>
            <button 
              onClick={handleOpenEditSection}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-stitch-primary hover:bg-primary/10 transition-colors"
              title="Edit Section Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
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
            <FilterSystem 
              filters={CUSTOM_FILTERS} 
              appliedState={filters}
              onApply={(newFilters) => setFilters(newFilters)} 
            />
            <button
              onClick={() => {
                if (showAddForm) {
                  setShowAddForm(false);
                  setEditingRecordId(null);
                  setFormData({});
                  setReminderDate("");
                  setReminderTime("");
                } else {
                  setShowAddForm(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-primary-container text-on-primary-container font-medium text-xs shadow-md hover:bg-stitch-primary hover:text-on-primary transition-all active:scale-95"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? "Cancel" : "New Item"}
            </button>
          </div>
        )}
      </div>

      {/* Edit Section Modal */}
      {showEditSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-2xl border border-surface-variant overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-surface-variant/50 flex justify-between items-center bg-surface-container/30 shrink-0">
              <h3 className="text-lg font-bold text-on-surface tracking-tight">Edit Section Settings</h3>
              <button 
                onClick={() => setShowEditSectionModal(false)}
                className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-6">
              {sectionError && (
                <div className="p-3 text-sm text-danger-foreground bg-danger/20 rounded-xl">
                  {sectionError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Section Name</label>
                  <input
                    type="text"
                    value={editSectionName}
                    onChange={e => setEditSectionName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary border border-surface-variant/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Description</label>
                  <input
                    type="text"
                    value={editSectionDesc}
                    onChange={e => setEditSectionDesc(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary border border-surface-variant/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stitch-primary">Data Fields</label>
                  <button
                    onClick={handleAddEditField}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-stitch-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                </div>
                
                {editSectionFields.length === 0 ? (
                  <p className="text-xs text-on-surface-variant/60">No fields configured. Click "Add Field" to create one.</p>
                ) : (
                  <div className="space-y-2">
                    {editSectionFields.map((field, idx) => (
                      <div key={field._id || field.clientId} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-surface-container border border-surface-variant/50">
                        <input
                          type="text"
                          placeholder="Field Name"
                          value={field.name}
                          onChange={e => {
                            const newF = [...editSectionFields];
                            newF[idx].name = e.target.value;
                            setEditSectionFields(newF);
                          }}
                          className="flex-1 h-9 px-3 rounded-lg bg-surface-container-high text-on-surface text-sm focus:outline-none border border-transparent focus:border-stitch-primary/50"
                        />
                        <div className="flex items-center gap-3">
                          <select
                            value={field.type}
                            onChange={e => {
                              const newF = [...editSectionFields];
                              newF[idx].type = e.target.value;
                              setEditSectionFields(newF);
                            }}
                            className="h-9 px-2 rounded-lg bg-surface-container-high text-on-surface text-sm focus:outline-none border border-transparent focus:border-stitch-primary/50"
                          >
                            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          
                          <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={e => {
                                const newF = [...editSectionFields];
                                newF[idx].required = e.target.checked;
                                setEditSectionFields(newF);
                              }}
                              className="w-4 h-4 rounded text-stitch-primary focus:ring-stitch-primary focus:ring-offset-surface bg-surface-container-high border-surface-variant"
                            />
                            Required
                          </label>

                          <button
                            onClick={() => {
                              const newF = [...editSectionFields];
                              newF.splice(idx, 1);
                              setEditSectionFields(newF);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-5 border-t border-surface-variant/50 flex justify-end gap-3 bg-surface-container/30 shrink-0">
              <button 
                onClick={() => setShowEditSectionModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSection}
                disabled={isSavingSection}
                className="px-6 py-2.5 rounded-xl bg-stitch-primary text-on-primary text-sm font-bold hover:bg-primary-fixed-dim transition-all shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-60"
              >
                {isSavingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}



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
          <h3 className="text-sm font-semibold text-on-surface mb-3">{editingRecordId ? "Edit Record" : "New Record"}</h3>
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
                            record.data?.[field._id] || <span className="text-on-surface-variant/50">â€”</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-stitch-primary hover:bg-primary/10 transition-colors mr-1"
                          aria-label="Edit record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
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


