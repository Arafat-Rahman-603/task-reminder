"use client";

import { FilterSystem } from "@/components/ui/FilterSystem";

const DASHBOARD_FILTERS = [
  {
    id: "priority",
    label: "Task Priority",
    type: "select" as const,
    options: [
      { value: "Urgent", label: "Urgent" },
      { value: "High", label: "High" },
      { value: "Medium", label: "Medium" },
      { value: "Low", label: "Low" },
    ]
  },
  {
    id: "timeframe",
    label: "Timeframe",
    type: "select" as const,
    options: [
      { value: "today", label: "Today" },
      { value: "week", label: "This Week" },
      { value: "month", label: "This Month" },
      { value: "custom", label: "Custom Dates" },
    ]
  },
  {
    id: "date",
    label: "Custom Date Range",
    type: "date-range" as const
  }
];

export function DashboardToolbar() {
  return (
    <div className="flex justify-end mb-4">
      <FilterSystem filters={DASHBOARD_FILTERS} basePath="/dashboard" />
    </div>
  );
}
