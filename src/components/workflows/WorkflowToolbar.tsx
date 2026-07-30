import React from 'react';
import { 
  Play, Pause, Square, Layout, History, BookOpen, Save, 
  Download, Upload, Trash2, Check, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { WorkflowExecutionMode } from '../../types/workflow';

interface WorkflowToolbarProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  executionMode: WorkflowExecutionMode;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onAutoLayout: () => void;
  onOpenTemplates: () => void;
  onOpenHistory: () => void;
  onSave: () => void;
  onClear: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving?: boolean;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  workflowName,
  onNameChange,
  executionMode,
  onRun,
  onPause,
  onResume,
  onCancel,
  onAutoLayout,
  onOpenTemplates,
  onOpenHistory,
  onSave,
  onClear,
  onExportJson,
  onImportJson,
  isSaving
}) => {
  return (
    <header className="h-16 bg-[#090d16]/95 border-b border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-2xl shrink-0 shadow-lg">
      {/* Left Title & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onNameChange(e.target.value)}
            className="text-base font-display font-bold text-white bg-transparent hover:bg-white/5 focus:bg-white/10 rounded-lg px-2.5 py-1 outline-none border border-transparent focus:border-indigo-500/50 transition-all max-w-xs"
            placeholder="Workflow Name..."
          />
        </div>

        {/* Execution Mode Badge */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold border flex items-center gap-1.5 ${
            executionMode === 'running' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
            executionMode === 'paused' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' :
            executionMode === 'completed' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
            executionMode === 'failed' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
            'bg-slate-800 text-slate-400 border-white/5'
          }`}>
            {executionMode === 'running' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
            {executionMode}
          </span>
        </div>
      </div>

      {/* Middle Execution Control Group */}
      <div className="flex items-center gap-2 bg-[#111827]/80 p-1.5 rounded-2xl border border-white/10 shadow-inner">
        {executionMode === 'running' ? (
          <>
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 border border-yellow-500/30 rounded-xl text-xs font-semibold transition-all shadow-md"
            >
              <Pause className="w-3.5 h-3.5 fill-current" /> Pause
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all shadow-md"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Cancel
            </button>
          </>
        ) : executionMode === 'paused' ? (
          <>
            <button
              onClick={onResume}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-500/25"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Resume
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Cancel
            </button>
          </>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Run Workflow
          </button>
        )}
      </div>

      {/* Right Action Group */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAutoLayout}
          className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          title="Auto Layout Nodes"
        >
          <Layout className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          Templates
        </button>

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium transition-all"
        >
          <History className="w-3.5 h-3.5 text-indigo-400" />
          History
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium transition-all"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <button
          onClick={onExportJson}
          className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          title="Export JSON"
        >
          <Download className="w-4 h-4" />
        </button>

        <label className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" title="Import JSON">
          <Upload className="w-4 h-4" />
          <input type="file" accept=".json" onChange={onImportJson} className="hidden" />
        </label>

        <button
          onClick={onClear}
          className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all"
          title="Clear Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
