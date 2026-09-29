"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterButton, FilterPanel } from "@/components/ui/FilterPanel";

export function DashboardToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const currentPriority = searchParams?.get('priority') || "";

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(`/dashboard`);
    setShowFilterPanel(false);
  };

  return (
    <div className="flex justify-end mb-4">
      <FilterButton 
        isActive={showFilterPanel || !!currentPriority}
        activeCount={currentPriority ? 1 : 0}
        onClick={() => setShowFilterPanel(!showFilterPanel)}
      />
      <FilterPanel 
        isOpen={showFilterPanel} 
        onClose={() => setShowFilterPanel(false)}
        onClear={clearFilters}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface-variant">Task Priority</label>
          <select 
            value={currentPriority} 
            onChange={e => applyFilter('priority', e.target.value)} 
            className="w-full h-10 px-3 bg-surface-container text-sm rounded-xl border border-surface-variant/50 focus:outline-none focus:border-stitch-primary/50 transition-colors"
          >
            <option value="">Any Priority</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </FilterPanel>
    </div>
  );
}
