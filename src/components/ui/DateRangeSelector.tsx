"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateRange = "today" | "this_week" | "this_month" | "this_year" | "all_time" | "custom";

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (value: DateRange, customRange?: { start: Date; end: Date }) => void;
  className?: string;
}

const RANGES = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
  { value: "all_time", label: "All Time" },
];

export function DateRangeSelector({ value, onChange, className }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = RANGES.find(r => r.value === value)?.label || "Custom Range";

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex justify-center w-full rounded-xl border border-surface-variant/50 bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors shadow-sm items-center gap-2"
      >
        <Calendar className="w-4 h-4 text-on-surface-variant" />
        {selectedLabel}
        <ChevronDown className="w-4 h-4 text-on-surface-variant ml-1 -mr-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-surface-container-high shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-surface-variant overflow-hidden">
          <div className="py-1">
            {RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => {
                  onChange(range.value as DateRange);
                  setIsOpen(false);
                }}
                className={cn(
                  "block w-full text-left px-4 py-2.5 text-sm transition-colors",
                  value === range.value
                    ? "bg-primary/10 text-stitch-primary font-medium"
                    : "text-on-surface hover:bg-surface-container-highest"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
