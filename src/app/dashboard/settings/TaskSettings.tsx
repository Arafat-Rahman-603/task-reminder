"use client";

import { useState } from "react";
import { updateUserPreferences } from "@/actions/user.actions";
import { useRouter } from "next/navigation";
import { CheckSquare } from "lucide-react";

export default function TaskSettings({ initialSettings }: { initialSettings: any }) {
  const router = useRouter();
  const [settings, setSettings] = useState({
    defaultPriority: initialSettings?.defaultPriority || "Medium",
    hideCompleted: initialSettings?.hideCompleted || false,
    defaultView: initialSettings?.defaultView || "list"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    const res = await updateUserPreferences({ taskSettings: settings });
    if (res.success) {
      setSuccessMsg("Settings saved!");
      router.refresh();
    }
    setIsSaving(false);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-variant/30 pb-4">
        <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-stitch-primary" /> Task Settings
        </h3>
        <p className="text-sm text-on-surface-variant mt-1">Configure how tasks behave and display by default.</p>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Default Priority</label>
          <select 
            value={settings.defaultPriority}
            onChange={e => setSettings({ ...settings, defaultPriority: e.target.value })}
            className="w-full p-2.5 bg-surface border border-surface-variant rounded-xl text-on-surface text-sm"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Default View</label>
          <select 
            value={settings.defaultView}
            onChange={e => setSettings({ ...settings, defaultView: e.target.value })}
            className="w-full p-2.5 bg-surface border border-surface-variant rounded-xl text-on-surface text-sm"
          >
            <option value="list">List View</option>
            <option value="kanban">Kanban Board</option>
          </select>
        </div>

        <div className="flex items-center gap-3 py-2">
          <input 
            type="checkbox" 
            id="hideCompleted"
            checked={settings.hideCompleted}
            onChange={e => setSettings({ ...settings, hideCompleted: e.target.checked })}
            className="w-4 h-4 rounded text-primary focus:ring-primary bg-surface border-surface-variant"
          />
          <label htmlFor="hideCompleted" className="text-sm font-medium text-on-surface select-none">
            Hide completed tasks by default
          </label>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
          {successMsg && <span className="text-sm font-medium text-success">{successMsg}</span>}
        </div>
      </div>
    </div>
  );
}
