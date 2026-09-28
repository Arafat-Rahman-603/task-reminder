"use client";

import { useState } from "react";
import DashboardBlockEngine from "@/components/dashboard/DashboardBlockEngine";
import { LayoutDashboard } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CustomDashboardClient({ section, fields, records, initialBlocks }: any) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 flex items-center justify-center text-stitch-primary shrink-0">
          <LayoutDashboard className="w-[20px] h-[20px]" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-stitch-primary">Dashboard</span>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">{section.name}</h1>
        </div>
      </div>
      
      {/* Dashboard engine renders the blocks and provides builder UX */}
      <DashboardBlockEngine 
        sectionId={section._id} 
        initialBlocks={initialBlocks} 
        fields={fields} 
        records={records} 
      />
    </div>
  );
}
