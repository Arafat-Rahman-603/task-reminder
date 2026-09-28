"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Settings2, Check, X, GripVertical, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import BlockRenderer from './BlockRenderer';
import { EmptyState } from "@/components/ui/EmptyState";
import { createDashboardBlock, updateDashboardBlock, deleteDashboardBlock, reorderDashboardBlocks } from "@/actions/dashboard.actions";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DashboardBlockEngine({ sectionId, initialBlocks, fields, records }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [blocks, setBlocks] = useState(initialBlocks || []);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setBlocks(initialBlocks || []);
  }, [initialBlocks]);

  const handleAddBlock = (type: string) => {
    startTransition(async () => {
      const res = await createDashboardBlock(sectionId, {
        type,
        title: `New ${type} block`,
        config: {},
        order: blocks.length,
        width: 'full'
      });
      console.log("createDashboardBlock response:", res);
      if (res.success) {
        setBlocks([...blocks, res.block]);
      } else {
        alert("Failed to save block: " + res.error);
      }
    });
  };

  const handleRemoveBlock = (blockId: string) => {
    startTransition(async () => {
      const res = await deleteDashboardBlock(blockId);
      if (res.success) {
        setBlocks(blocks.filter((b: any) => b._id !== blockId));
      }
    });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    setBlocks(newBlocks);

    startTransition(async () => {
      await reorderDashboardBlocks(sectionId, newBlocks.map((b: any) => b._id));
    });
  };

  const updateBlockConfig = (blockId: string, updates: any) => {
    // Optimistic update
    setBlocks(blocks.map((b: any) => b._id === blockId ? { ...b, ...updates } : b));
    startTransition(async () => {
      await updateDashboardBlock(blockId, updates);
    });
  };

  return (
    <div className="flex flex-col space-y-4 relative">
      {/* Edit Mode Toggle */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95",
            isEditing 
              ? "bg-stitch-primary text-on-primary hover:bg-primary-fixed"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface"
          )}
        >
          {isEditing ? <Check className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
          {isEditing ? "Done Editing" : "Edit Dashboard"}
        </button>
      </div>

      {blocks.length === 0 && !isEditing ? (
        <EmptyState 
          title="Empty Dashboard"
          description="Click 'Edit Dashboard' to add your first block."
        />
      ) : (
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:items-start auto-rows-min">
          {blocks.map((block: any, index: number) => (
            <div 
              key={block._id}
              className={cn(
                "relative transition-all duration-300",
                block.width === 'full' ? 'md:col-span-2 lg:col-span-3' : 
                block.width === 'half' ? 'md:col-span-1 lg:col-span-2' : 'md:col-span-1 lg:col-span-1',
                isEditing ? "ring-2 ring-primary/20 rounded-2xl bg-surface-container/30 p-2 shadow-sm" : ""
              )}
            >
              {isEditing && (
                <div className="absolute -top-3 -right-3 z-20 flex bg-surface-container-high rounded-lg shadow-md border border-surface-variant overflow-hidden">
                  <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1.5 text-on-surface-variant hover:bg-surface-variant disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1.5 text-on-surface-variant hover:bg-surface-variant disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleRemoveBlock(block._id)} className="p-1.5 text-error hover:bg-error/20"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
              
              <BlockRenderer 
                block={block} 
                fields={fields} 
                records={records} 
                isEditing={isEditing} 
                onUpdate={(updates: any) => updateBlockConfig(block._id, updates)} 
              />
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="p-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 flex flex-wrap gap-2 items-center justify-center mt-4">
          <span className="text-xs font-semibold text-stitch-primary w-full text-center mb-1">Add Block</span>
          {['stat', 'progress', 'status_summary', 'chart', 'recent', 'record_table', 'text'].map(type => (
            <button 
              key={type}
              onClick={() => handleAddBlock(type)}
              disabled={pending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container text-xs font-medium text-on-surface hover:bg-primary/20 hover:text-stitch-primary transition-colors border border-surface-variant"
            >
              <Plus className="w-3 h-3" />
              {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
