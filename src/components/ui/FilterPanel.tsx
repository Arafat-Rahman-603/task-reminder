"use client";

import { X, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";

export function FilterButton({ 
  isActive, 
  activeCount, 
  onClick 
}: { 
  isActive: boolean; 
  activeCount: number; 
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick} 
      aria-label="Filter" 
      className={`h-10 px-3 flex items-center gap-2 rounded-xl border transition-colors text-sm font-medium ${
        isActive 
          ? 'bg-stitch-primary text-on-primary border-stitch-primary shadow-md' 
          : 'bg-surface-container-low/70 text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container border-surface-variant/40'
      }`}
    >
      <SlidersHorizontal className="w-[16px] h-[16px]" />
      <span className="hidden sm:inline">Filter</span>
      {activeCount > 0 && (
        <span className="ml-1 w-5 h-5 flex items-center justify-center bg-surface/20 rounded-full text-[10px] font-bold">
          {activeCount}
        </span>
      )}
    </button>
  );
}

export function FilterPanel({ 
  isOpen, 
  onClose, 
  onClear, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onClear: () => void; 
  children: React.ReactNode 
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="relative w-full max-h-[85vh] bg-surface rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between p-5 border-b border-surface-variant/30">
            <h3 className="text-lg font-bold text-on-surface">Filters</h3>
            <button onClick={onClose} className="p-2 -mr-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20 rounded-full transition-colors">
              <X className="w-5 h-5"/>
            </button>
          </div>
          <div className="overflow-y-auto p-5 pb-8 flex-1">
            {children}
          </div>
          <div className="p-5 border-t border-surface-variant/30 bg-surface-container-lowest/50 flex gap-3">
            <button onClick={onClear} className="flex-1 py-3 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-variant/20 transition-colors">
              Clear All
            </button>
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-stitch-primary text-on-primary text-sm font-bold shadow-lg hover:bg-primary-fixed transition-colors">
              Apply
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop inline panel
  return (
    <div className="rounded-2xl bg-surface border border-surface-variant/40 shadow-lg p-4 mb-4 animate-in slide-in-from-top-2 duration-200 w-full relative z-20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-on-surface">Filters</h3>
        <div className="flex gap-3 items-center">
          <button 
            onClick={onClear} 
            className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Clear all
          </button>
          <button onClick={onClose} className="p-1 -mr-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20 rounded-lg transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
