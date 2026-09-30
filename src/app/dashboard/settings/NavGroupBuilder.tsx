"use client";

import { useState, useTransition, useEffect } from "react";
import { Loader2, Plus, GripVertical, ArrowUp, ArrowDown, Trash2, RotateCcw, Edit2, X, Check } from "lucide-react";
import { updateNavGroupsBatch, createNavGroup, deleteNavGroup, resetNavGroups } from "@/actions/navgroup.actions";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NavGroupBuilder({ initialGroups, customSections }: any) {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>(initialGroups || []);

  useEffect(() => {
    setGroups(initialGroups || []);
  }, [initialGroups]);

  const [pending, startTransition] = useTransition();
  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addingItemToGroupIdx, setAddingItemToGroupIdx] = useState<number | null>(null);

  // Get all currently used item IDs
  const usedItemIds = groups.flatMap(g => g.items.map((i: any) => i.id));
  
  // Available items to add
  const availableItems = [
    { id: 'tasks', label: 'Tasks', type: 'core', href: '/dashboard/tasks' },
    { id: 'routines', label: 'Routines', type: 'core', href: '/dashboard/routines' },
    { id: 'money', label: 'Money', type: 'core', href: '/dashboard/money' },
    { id: 'journal', label: 'Journal', type: 'core', href: '/dashboard/journal' },
    ...((customSections || []).map((cs: any) => ({
      id: cs.slug,
      label: cs.name,
      type: 'custom',
      href: `/dashboard/custom/${cs.slug}`
    })))
  ].filter(item => !usedItemIds.includes(item.id));

  const saveGroups = async (newGroups: any[]) => {
    setGroups(newGroups);
    startTransition(async () => {
      await updateNavGroupsBatch(newGroups);
      router.refresh();
    });
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    startTransition(async () => {
      const res = await createNavGroup(newGroupName.trim());
      if (res.success) {
        setGroups([...groups, res.group]);
      }
      setNewGroupName("");
      setAddingGroup(false);
      router.refresh();
    });
  };

  const handleMoveGroup = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === groups.length - 1) return;
    
    const newGroups = [...groups];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    [newGroups[index], newGroups[targetIdx]] = [newGroups[targetIdx], newGroups[index]];
    saveGroups(newGroups);
  };

  const handleMoveItem = (groupIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const newGroups = [...groups];
    const group = newGroups[groupIndex];
    if (direction === 'up' && itemIndex === 0) return;
    if (direction === 'down' && itemIndex === group.items.length - 1) return;
    
    const targetIdx = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    [group.items[itemIndex], group.items[targetIdx]] = [group.items[targetIdx], group.items[itemIndex]];
    saveGroups(newGroups);
  };

  const handleMoveItemToGroup = (sourceGroupIdx: number, itemIdx: number, targetGroupIdx: number) => {
    if (sourceGroupIdx === targetGroupIdx) return;
    
    const newGroups = [...groups];
    const item = newGroups[sourceGroupIdx].items[itemIdx];
    newGroups[sourceGroupIdx].items.splice(itemIdx, 1);
    newGroups[targetGroupIdx].items.push(item);
    
    saveGroups(newGroups);
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all navigation groups to defaults?")) return;
    startTransition(async () => {
      await resetNavGroups();
      window.location.reload(); // Hard reload to fetch defaults again
    });
  };

  const handleDeleteGroup = async (groupId: string, index: number) => {
    if (!confirm("Are you sure you want to delete this group? Any items inside will be unassigned and can be added back later.")) {
      return;
    }
    
    startTransition(async () => {
      if (!groupId.startsWith('default-')) {
        await deleteNavGroup(groupId);
      }
      const newGroups = [...groups];
      newGroups.splice(index, 1);
      await updateNavGroupsBatch(newGroups);
      setGroups(newGroups);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-on-surface tracking-tight">Navigation Builder</h3>
          <p className="text-xs text-on-surface-variant mt-1">Organize your sidebar groups and items.</p>
        </div>
        <div className="flex items-center gap-3">
          {pending && <Loader2 className="w-5 h-5 text-stitch-primary animate-spin" />}
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-xs font-semibold text-on-surface hover:text-stitch-primary transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((group, gIdx) => (
          <div key={group._id} className="bg-surface-container/40 rounded-2xl border border-surface-container-high overflow-hidden">
            {/* Group Header */}
            <div className="flex items-center justify-between p-3 bg-surface-container-high/40 border-b border-surface-container-high">
              {editingGroupId === group._id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 h-8 px-2 rounded-md bg-surface-container-high text-sm focus:outline-none focus:ring-1 focus:ring-stitch-primary"
                    autoFocus
                  />
                  <button onClick={() => {
                    if (editName.trim()) {
                      const newGroups = [...groups];
                      newGroups[gIdx].name = editName.trim();
                      saveGroups(newGroups);
                    }
                    setEditingGroupId(null);
                  }} className="p-1.5 rounded-md bg-stitch-primary text-on-primary">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface">{group.name}</h4>
                  <button onClick={() => { setEditingGroupId(group._id); setEditName(group.name); }} className="p-1 text-on-surface-variant hover:text-stitch-primary transition-colors">
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <button onClick={() => handleMoveGroup(gIdx, 'up')} disabled={gIdx === 0} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => handleMoveGroup(gIdx, 'down')} disabled={gIdx === groups.length - 1} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteGroup(group._id, gIdx)} className="p-1.5 rounded-lg text-error hover:bg-error/10 ml-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Group Items */}
            <div className="p-2 space-y-1">
              {group.items.length === 0 ? (
                <div className="p-4 text-center text-xs text-on-surface-variant border border-dashed border-surface-container-high rounded-xl">
                  Empty group
                </div>
              ) : (
                group.items.map((item: any, iIdx: number) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface/50 hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-on-surface-variant opacity-50" />
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase">{item.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select 
                        onChange={(e) => handleMoveItemToGroup(gIdx, iIdx, parseInt(e.target.value))}
                        value={gIdx}
                        className="text-xs bg-surface-container rounded-lg px-2 py-1 border-0 focus:ring-1 focus:ring-stitch-primary text-on-surface-variant"
                      >
                        {groups.map((g, idx) => (
                          <option key={g._id} value={idx}>Move to {g.name}</option>
                        ))}
                      </select>
                      
                      <div className="flex items-center bg-surface-container rounded-lg overflow-hidden">
                        <button onClick={() => handleMoveItem(gIdx, iIdx, 'up')} disabled={iIdx === 0} className="p-1 hover:bg-surface-variant disabled:opacity-30">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleMoveItem(gIdx, iIdx, 'down')} disabled={iIdx === group.items.length - 1} className="p-1 hover:bg-surface-variant disabled:opacity-30">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {addingItemToGroupIdx === gIdx ? (
                <div className="flex items-center gap-2 mt-2 p-2 bg-surface-container rounded-xl border border-surface-container-high animate-in fade-in zoom-in duration-200">
                  <select 
                    className="flex-1 text-xs bg-surface-container-high text-on-surface rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-stitch-primary"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const itemToAdd = availableItems.find(i => i.id === e.target.value);
                      if (itemToAdd) {
                        const newGroups = [...groups];
                        newGroups[gIdx].items.push(itemToAdd);
                        saveGroups(newGroups);
                      }
                      setAddingItemToGroupIdx(null);
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select an item to add...</option>
                    {availableItems.map(item => (
                      <option key={item.id} value={item.id}>{item.label} ({item.type})</option>
                    ))}
                    {availableItems.length === 0 && <option value="" disabled>All items are already in use.</option>}
                  </select>
                  <button onClick={() => setAddingItemToGroupIdx(null)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setAddingItemToGroupIdx(gIdx)}
                  className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container-high/50 rounded-xl transition-colors border border-dashed border-surface-container-high"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {addingGroup ? (
        <div className="flex items-center gap-3 bg-surface-container/60 p-3 rounded-2xl border border-surface-container-high">
          <input 
            type="text" 
            placeholder="New Group Name" 
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="flex-1 h-10 px-4 rounded-xl bg-surface-container-high text-sm focus:outline-none focus:ring-2 focus:ring-stitch-primary"
            autoFocus
          />
          <button onClick={handleCreateGroup} className="h-10 px-4 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm hover:bg-primary-fixed-dim transition-colors">
            Add
          </button>
          <button onClick={() => setAddingGroup(false)} className="h-10 px-4 rounded-xl bg-surface-variant text-on-surface-variant text-sm font-medium hover:text-on-surface transition-colors">
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setAddingGroup(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-surface-container-high text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container-high/30 transition-all font-medium text-sm">
          <Plus className="w-4 h-4" /> Create New Group
        </button>
      )}
    </div>
  );
}
