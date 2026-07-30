import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Mic, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { WorkflowNodeData } from '../../../types/workflow';

export const AudioGenNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const status = nodeData.status || 'idle';
  const voice = nodeData.params?.audioVoice || 'Female';
  const language = nodeData.params?.audioLanguage || 'English';
  const audioUrl = nodeData.output?.audioUrl;

  return (
    <div className={`relative w-72 rounded-2xl bg-[#0f172a]/90 backdrop-blur-xl border transition-all duration-300 shadow-2xl ${
      selected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 
      status === 'running' ? 'border-amber-500/80 shadow-amber-500/20 ring-1 ring-amber-500/50' :
      status === 'success' ? 'border-emerald-500/60' :
      status === 'error' ? 'border-rose-500 shadow-rose-500/20' : 'border-white/10 hover:border-white/20'
    }`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />

      <div className="relative flex items-center justify-between p-3.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-100 tracking-wide">{nodeData.title || 'Audio Generation'}</h4>
            <p className="text-[10px] text-amber-300/80 font-mono">Gemini Speech TTS</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {status === 'running' && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          {status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold ${
            status === 'running' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
            status === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
            status === 'error' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-slate-800 text-slate-400 border border-white/5'
          }`}>
            {status}
          </span>
        </div>
      </div>

      <div className="relative p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-300 font-mono">Voice: {voice}</span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">{language}</span>
        </div>

        {audioUrl ? (
          <div className="p-2 bg-[#030712]/60 rounded-xl border border-amber-500/20">
            <audio src={audioUrl} controls className="w-full h-8" />
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 bg-[#030712]/50 border border-white/5 rounded-xl text-slate-500 text-[11px] italic">
            Audio stream preview
          </div>
        )}

        {nodeData.executionTimeMs !== undefined && (
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>Duration</span>
            <span className="text-amber-300">{(nodeData.executionTimeMs / 1000).toFixed(2)}s</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />
    </div>
  );
};
