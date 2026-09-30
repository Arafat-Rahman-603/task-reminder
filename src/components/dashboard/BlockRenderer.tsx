"use client";

import { useState } from "react";
import { Settings, BarChart2, Hash, AlignLeft, LayoutList, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BlockRenderer({ block, fields, records, isEditing, onUpdate }: any) {
  const [showConfig, setShowConfig] = useState(false);

  // Stats calculation
  const calculateStat = () => {
    if (!block.config?.fieldId) return records.length;
    const field = fields.find((f: any) => f._id === block.config.fieldId);
    if (!field) return 0;

    const values = records.map((r: any) => Number(r.fieldValues?.[field._id] || r.data?.[field._id])).filter((v: number) => !isNaN(v));
    
    if (values.length === 0) return 0;
    const sum = values.reduce((a: number, b: number) => a + b, 0);

    switch (block.config?.calculation) {
      case 'sum': return sum;
      case 'avg': return (sum / values.length).toFixed(1);
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      default: return records.length;
    }
  };

  const renderContent = () => {
    switch (block.type) {
      case 'stat':
      case 'counter':
        return (
          <div className="flex flex-col items-center justify-center p-6 bg-surface-container/60 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-container-high h-full text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-stitch-primary mb-3">
              <Hash className="w-5 h-5" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-on-surface">{calculateStat()}</span>
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mt-1">{block.title || "Total Records"}</span>
          </div>
        );

      case 'progress':
        const completedCount = block.config?.fieldId 
          ? records.filter((r: any) => (r.fieldValues?.[block.config.fieldId] || r.data?.[block.config.fieldId]) === (block.config?.completedValue || 'Completed')).length
          : 0;
        const totalCount = records.length;
        const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        return (
          <div className="flex flex-col justify-center p-5 bg-surface-container/60 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-container-high h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-on-surface">{block.title || "Progress"}</span>
              <span className="text-sm font-bold text-stitch-primary">{pct}%</span>
            </div>
            <div className="h-2.5 w-full bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-stitch-primary transition-all duration-1000" style={{ width: `${pct}%` }}></div>
            </div>
            <span className="text-[10px] text-on-surface-variant mt-2 font-medium">{completedCount} of {totalCount} total</span>
          </div>
        );

      case 'status_summary':
        const statusCounts: Record<string, number> = {};
        if (block.config?.fieldId) {
          records.forEach((r: any) => {
            const val = r.fieldValues?.[block.config.fieldId] || r.data?.[block.config.fieldId] || 'Unassigned';
            statusCounts[val] = (statusCounts[val] || 0) + 1;
          });
        }
        return (
          <div className="p-5 bg-surface-container/60 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-container-high h-full flex flex-col">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-stitch-primary" /> {block.title || "Status Summary"}
            </h3>
            <div className="flex-1 space-y-2">
              {Object.keys(statusCounts).length === 0 ? (
                <div className="text-xs text-on-surface-variant">Configure a select field to show summary.</div>
              ) : (
                Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center text-xs">
                    <span className="text-on-surface truncate pr-2">{status}</span>
                    <span className="font-bold text-stitch-primary bg-primary/10 px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="p-5 bg-surface-container/40 rounded-2xl border border-transparent h-full flex flex-col justify-center">
            {block.title && <h3 className="text-sm font-bold text-on-surface mb-1">{block.title}</h3>}
            <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{block.config?.text || "Add your text description here."}</p>
          </div>
        );

      case 'record_list':
      case 'recent':
        return (
          <div className="p-5 bg-surface-container/60 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-container-high h-full flex flex-col">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <LayoutList className="w-4 h-4 text-stitch-primary" /> {block.title || "Recent Records"}
            </h3>
            <div className="space-y-2 flex-1">
              {records.slice(0, block.config?.limit || 5).map((r: any) => (
                <div key={r._id} className="text-xs text-on-surface p-2 rounded-lg bg-surface-container-high truncate">
                  {r.title || (fields[0] ? r.data?.[fields[0]._id] : null) || "Untitled"}
                </div>
              ))}
              {records.length === 0 && <div className="text-xs text-on-surface-variant py-2">No records found.</div>}
            </div>
          </div>
        );

      case 'record_table':
        return (
          <div className="p-5 bg-surface-container/60 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-container-high h-full flex flex-col overflow-x-auto">
            <h3 className="text-sm font-bold text-on-surface mb-3">{block.title || "Data Table"}</h3>
            <table className="w-full text-left text-xs">
              <thead className="text-on-surface-variant border-b border-surface-container-high">
                <tr>
                  <th className="py-2 px-2 font-semibold">{fields[0] ? fields[0].name : "Title"}</th>
                  {fields.slice(1, 3).map((f: any) => (
                    <th key={f._id} className="py-2 px-2 font-semibold truncate">{f.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {records.slice(0, block.config?.limit || 5).map((r: any) => (
                  <tr key={r._id} className="hover:bg-surface-container-high/50">
                    <td className="py-2 px-2 font-medium truncate">{r.title || (fields[0] ? r.data?.[fields[0]._id] : null) || "Untitled"}</td>
                    {fields.slice(1, 3).map((f: any) => (
                      <td key={f._id} className="py-2 px-2 text-on-surface-variant truncate">
                        {r.fieldValues?.[f._id] || r.data?.[f._id] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'chart':
        // Pseudo bar chart
        const chartData = records.slice(0, 5).map((r: any) => {
          const rawVal = block.config?.fieldId ? (r.fieldValues?.[block.config.fieldId] || r.data?.[block.config.fieldId]) : null;
          const val = block.config?.fieldId ? Number(rawVal) : 1;
          const label = r.title || (fields[0] ? r.data?.[fields[0]._id] : null) || 'Item';
          return { label, value: isNaN(val) ? 0 : val };
        });
        const maxVal = Math.max(...chartData.map((d: { value: number }) => d.value), 1);
        
        return (
          <div className="p-5 bg-surface-container/60 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-container-high h-full flex flex-col">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-stitch-primary" /> {block.title || "Chart"}
            </h3>
            <div className="flex-1 flex items-end justify-between gap-2 mt-4 pt-2 border-l border-b border-surface-variant/50 relative">
              {chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant">No data</div>
              ) : (
                chartData.map((d: { label: string, value: number }, i: number) => {
                  const h = Math.max((d.value / maxVal) * 100, 5);
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="w-full max-w-[40px] bg-stitch-primary rounded-t-sm transition-all relative" style={{ height: `${h}%` }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-surface-container-high px-1.5 py-0.5 rounded transition-opacity pointer-events-none">
                          {d.value}
                        </div>
                      </div>
                      <span className="text-[9px] text-on-surface-variant truncate w-full text-center mt-1">{d.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 bg-surface-container-high rounded-2xl flex flex-col items-center justify-center text-center border border-dashed border-surface-variant h-full">
            <BarChart2 className="w-6 h-6 text-on-surface-variant mb-2 opacity-50" />
            <span className="text-xs text-on-surface-variant">Block type <strong>{block.type}</strong> rendering not fully implemented yet.</span>
          </div>
        );
    }
  };

  return (
    <div className="h-full relative group">
      {isEditing && (
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="absolute top-2 left-2 z-10 w-6 h-6 rounded bg-surface-variant/80 text-on-surface-variant flex items-center justify-center hover:text-stitch-primary hover:bg-surface-variant"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      )}

      {renderContent()}

      {isEditing && showConfig && (
        <div className="absolute top-10 left-2 sm:-left-2 z-50 w-[280px] bg-surface-container-high/95 backdrop-blur-xl rounded-xl p-4 border border-surface-variant flex flex-col gap-3 shadow-2xl">
          <div className="flex justify-between items-center pb-2 border-b border-surface-variant/50 sticky top-0">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Configure {block.type}</span>
            <button onClick={() => setShowConfig(false)} className="text-xs font-medium text-stitch-primary hover:text-primary-fixed-dim">Close</button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-semibold text-on-surface-variant">Title</label>
            <input 
              type="text" 
              value={block.title || ""} 
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full bg-surface-variant border border-transparent focus:border-stitch-primary rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none"
              placeholder="Block Title"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-semibold text-on-surface-variant">Width</label>
            <select 
              value={block.width || 'full'}
              onChange={(e) => onUpdate({ width: e.target.value })}
              className="w-full bg-surface-variant border border-transparent focus:border-stitch-primary rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none"
            >
              <option value="compact">Compact (1 Col)</option>
              <option value="half">Half (2 Col Desktop, 1 Mobile)</option>
              <option value="full">Full Width</option>
            </select>
          </div>

          {['stat', 'counter', 'chart', 'status_summary', 'progress'].includes(block.type) && (
            <div className="space-y-1 mt-2">
              <label className="text-[10px] uppercase font-semibold text-on-surface-variant">Data Source Field</label>
              <select
                value={block.config?.fieldId || ''}
                onChange={(e) => onUpdate({ config: { ...block.config, fieldId: e.target.value } })}
                className="w-full bg-surface-variant border-none rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none"
              >
                <option value="">-- None (Count Total) --</option>
                {fields.map((f: any) => (
                  <option key={f._id} value={f._id}>{f.name} ({f.type})</option>
                ))}
              </select>
            </div>
          )}

          {['stat', 'counter'].includes(block.type) && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-on-surface-variant">Calculation</label>
              <select 
                value={block.config?.calculation || 'count'}
                onChange={(e) => onUpdate({ config: { ...block.config, calculation: e.target.value } })}
                className="w-full bg-surface-variant border-none rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none"
              >
                <option value="count">Count (Total)</option>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
            </div>
          )}

          {block.type === 'progress' && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-on-surface-variant">Completed Value Match</label>
              <input 
                type="text" 
                value={block.config?.completedValue || ""} 
                onChange={(e) => onUpdate({ config: { ...block.config, completedValue: e.target.value } })}
                className="w-full bg-surface-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none"
                placeholder="e.g. Completed"
              />
            </div>
          )}

          {['record_list', 'recent', 'record_table'].includes(block.type) && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-on-surface-variant">Item Limit</label>
              <input 
                type="number" 
                value={block.config?.limit || 5} 
                onChange={(e) => onUpdate({ config: { ...block.config, limit: parseInt(e.target.value) || 5 } })}
                className="w-full bg-surface-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none"
                min="1" max="50"
              />
            </div>
          )}

          {block.type === 'text' && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-on-surface-variant">Content</label>
              <textarea 
                value={block.config?.text || ""} 
                onChange={(e) => onUpdate({ config: { ...block.config, text: e.target.value } })}
                className="w-full h-24 bg-surface-variant border border-transparent focus:border-stitch-primary rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none resize-none"
                placeholder="Enter text..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
