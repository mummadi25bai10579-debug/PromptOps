import React from 'react';
import { GenerationJob } from '../../types';
import { Sparkles, Sliders, CheckCircle2, Clock, Cpu, Hash, Layers, Monitor, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SettingsDiffTableProps {
  jobs: GenerationJob[];
  labels?: string[];
}

export const SettingsDiffTable: React.FC<SettingsDiffTableProps> = ({ jobs, labels = ['Version A', 'Version B', 'Version C', 'Version D'] }) => {
  if (!jobs || jobs.length === 0) return null;

  // Key setting fields to compare
  const fields = [
    { key: 'model', label: 'AI Model', icon: Cpu },
    { key: 'provider', label: 'Provider', icon: Sparkles },
    { key: 'type', label: 'Asset Type', icon: Layers },
    { key: 'status', label: 'Job Status', icon: CheckCircle2 },
    { key: 'temperature', label: 'Temperature', getValue: (j: GenerationJob) => j.settings?.temperature ?? j.parameters?.temperature ?? 'Default' },
    { key: 'topP', label: 'Top P', getValue: (j: GenerationJob) => j.settings?.topP ?? j.parameters?.topP ?? 'Default' },
    { key: 'guidanceScale', label: 'Guidance Scale', getValue: (j: GenerationJob) => j.settings?.guidanceScale ?? j.parameters?.guidanceScale ?? 'N/A' },
    { key: 'steps', label: 'Sampling Steps', getValue: (j: GenerationJob) => j.settings?.steps ?? j.parameters?.steps ?? 'N/A' },
    { key: 'seed', label: 'Seed', getValue: (j: GenerationJob) => j.seed ?? j.settings?.seed ?? j.parameters?.seed ?? 'Random' },
    { key: 'resolution', label: 'Resolution', getValue: (j: GenerationJob) => j.resolution ?? j.settings?.resolution ?? j.parameters?.resolution ?? 'N/A' },
    { key: 'aspectRatio', label: 'Aspect Ratio', getValue: (j: GenerationJob) => j.settings?.aspectRatio ?? j.parameters?.aspectRatio ?? 'N/A' },
    { key: 'duration', label: 'Duration / FPS', getValue: (j: GenerationJob) => j.duration ? `${j.duration}s (${j.fps || 24}fps)` : 'N/A' },
    { key: 'tokens', label: 'Token Usage', getValue: (j: GenerationJob) => j.tokens ? `${j.tokens.totalTokens || (j.tokens.promptTokens || 0) + (j.tokens.completionTokens || 0)} tokens` : 'N/A' },
    { key: 'createdAt', label: 'Generated At', getValue: (j: GenerationJob) => j.createdAt?.toDate ? j.createdAt.toDate().toLocaleString() : (j.createdAt ? new Date(j.createdAt).toLocaleString() : 'N/A'), icon: Clock },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
      <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-white text-base">Generation Settings & Metadata Comparison</h3>
        </div>
        <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
          Highlighted rows indicate parameter differences
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-black/40 text-slate-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-6 font-medium w-48">Parameter</th>
              {jobs.map((job, idx) => (
                <th key={job.id || idx} className="py-3 px-6 font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    {labels[idx] || `Version ${idx + 1}`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {fields.map((field) => {
              const values = jobs.map((job) =>
                field.getValue ? field.getValue(job) : (job as any)[field.key] ?? 'N/A'
              );

              // Check if all non-empty values differ
              const stringified = values.map(v => String(v));
              const isDifferent = new Set(stringified).size > 1;

              return (
                <tr
                  key={field.key}
                  className={cn(
                    "transition-colors hover:bg-white/[0.03]",
                    isDifferent ? "bg-amber-500/[0.04]" : ""
                  )}
                >
                  <td className="py-3.5 px-6 font-medium text-slate-400 flex items-center gap-2">
                    {field.icon && <field.icon className="w-4 h-4 text-slate-500" />}
                    <span>{field.label}</span>
                    {isDifferent && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ml-auto">
                        Diff
                      </span>
                    )}
                  </td>
                  {values.map((val, idx) => (
                    <td
                      key={idx}
                      className={cn(
                        "py-3.5 px-6 font-mono text-xs",
                        isDifferent ? "text-amber-200 font-semibold" : "text-slate-300"
                      )}
                    >
                      {String(val)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
