"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X, FilterX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterDefinition = {
  id: string;
  label: string;
  type: "select" | "multi-select" | "date-range" | "checkbox";
  options?: FilterOption[];
};

export interface FilterSystemProps {
  filters: FilterDefinition[];
  // If provided, uses controlled state. If omitted, uses URL search params.
  appliedState?: Record<string, any>;
  onApply?: (filters: Record<string, any>) => void;
  basePath?: string; // used when syncing with URL
}

export function FilterSystem({ filters, appliedState, onApply, basePath }: FilterSystemProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [localState, setLocalState] = useState<Record<string, any>>({});
  const [error, setError] = useState("");

  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updatePosition = () => {
    if (buttonRef.current && !isMobile) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        right: `${window.innerWidth - rect.right}px`,
        maxHeight: `calc(100dvh - ${rect.bottom + 24}px)`
      });
    } else {
      setPopoverStyle({}); // mobile uses CSS classes
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true); // capture scroll
      
      // prevent background scroll on mobile
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isMobile]);

  // Compute currently applied filters from props or URL
  const currentApplied = appliedState || Array.from(searchParams?.entries() || []).reduce((acc, [key, val]) => {
    acc[key] = val;
    return acc;
  }, {} as Record<string, any>);

  const activeCount = filters.reduce((count, f) => {
    if (f.type === 'date-range') {
      return count + ((currentApplied[`${f.id}_start`] || currentApplied[`${f.id}_end`]) ? 1 : 0);
    }
    return count + (currentApplied[f.id] ? 1 : 0);
  }, 0);

  const handleOpen = () => {
    setLocalState({ ...currentApplied });
    setError("");
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleApply = () => {
    setError("");
    // Validate date ranges
    for (const f of filters) {
      if (f.type === 'date-range') {
        const start = localState[`${f.id}_start`];
        const end = localState[`${f.id}_end`];
        if (start && end) {
          const dStart = new Date(start);
          const dEnd = new Date(end);
          if (dEnd < dStart) {
            setError(`End date for ${f.label} must be on or after the start date.`);
            return;
          }
        }
      }
    }

    if (onApply) {
      onApply(localState);
    } else if (basePath !== undefined) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      
      filters.forEach(f => {
        if (f.type === 'date-range') {
          if (localState[`${f.id}_start`]) params.set(`${f.id}_start`, localState[`${f.id}_start`]);
          else params.delete(`${f.id}_start`);
          
          if (localState[`${f.id}_end`]) params.set(`${f.id}_end`, localState[`${f.id}_end`]);
          else params.delete(`${f.id}_end`);
        } else {
          if (localState[f.id]) params.set(f.id, localState[f.id]);
          else params.delete(f.id);
        }
      });
      
      router.push(`${basePath}?${params.toString()}`);
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalState({});
    setError("");
  };

  const renderField = (f: FilterDefinition) => {
    if (f.type === "select") {
      return (
        <div key={f.id} className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</label>
          <select 
            value={localState[f.id] || ""}
            onChange={e => setLocalState({ ...localState, [f.id]: e.target.value })}
            className="w-full h-10 px-3 bg-[#13141a] text-white text-sm rounded-xl border-0 focus:ring-1 focus:ring-[#7dd3fc] transition-colors"
          >
            <option value="">Any</option>
            {f.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }
    if (f.type === "date-range") {
      return (
        <div key={f.id} className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] text-gray-400">From</label>
              <input 
                type="date"
                value={localState[`${f.id}_start`] || ""}
                onChange={e => setLocalState({ ...localState, [`${f.id}_start`]: e.target.value })}
                className="w-full h-10 px-3 bg-[#13141a] text-white text-sm rounded-xl border-0 focus:ring-1 focus:ring-[#7dd3fc] transition-colors"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] text-gray-400">To</label>
              <input 
                type="date"
                value={localState[`${f.id}_end`] || ""}
                onChange={e => setLocalState({ ...localState, [`${f.id}_end`]: e.target.value })}
                className="w-full h-10 px-3 bg-[#13141a] text-white text-sm rounded-xl border-0 focus:ring-1 focus:ring-[#7dd3fc] transition-colors"
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative inline-block">
      <button 
        ref={buttonRef}
        onClick={handleOpen} 
        aria-label="Filter"
        title="Filter Options"
        className={`h-9 px-3 flex items-center gap-2 rounded-xl border transition-all text-sm font-semibold ${
          activeCount > 0 
            ? 'bg-stitch-primary/10 text-stitch-primary border-stitch-primary/30' 
            : 'bg-surface-container/50 text-on-surface hover:bg-surface-container border-surface-variant/50'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="hidden sm:inline">Filter</span>
        {activeCount > 0 && (
          <span className="ml-1 w-5 h-5 flex items-center justify-center bg-stitch-primary text-on-primary rounded-full text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop for mobile bottom sheet or desktop click-outside */}
          <div 
            className={`fixed inset-0 z-[100] ${isMobile ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`} 
            onClick={handleClose} 
          />
          
          <div 
            ref={popoverRef}
            style={isMobile ? undefined : popoverStyle}
            className={`
              z-[101] bg-[#1c1d22] flex flex-col shadow-2xl border border-white/5
              ${isMobile 
                ? "fixed inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] animate-in slide-in-from-bottom duration-300" 
                : "rounded-2xl w-[320px] animate-in zoom-in-95 origin-top-right duration-200"
              }
            `}
          >
            <div className="flex items-center justify-between p-5 pb-2 shrink-0">
              <h3 className="text-lg font-bold text-white tracking-tight">Filters</h3>
              <button 
                onClick={handleClose} 
                className="p-1.5 -mr-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>
            
            <div className="overflow-y-auto p-5 pt-3 pb-6 flex-1 space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-error/10 text-error text-xs font-semibold">
                  {error}
                </div>
              )}
              {filters.map(renderField)}
            </div>
            
            <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3 shrink-0">
              <button 
                onClick={handleReset} 
                className="py-2.5 px-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <FilterX className="w-4 h-4" /> Reset
              </button>
              <button 
                onClick={handleApply} 
                className="w-32 py-2.5 rounded-xl bg-[#7dd3fc] text-[#001f2e] text-sm font-bold shadow-md hover:bg-[#7dd3fc]/90 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
