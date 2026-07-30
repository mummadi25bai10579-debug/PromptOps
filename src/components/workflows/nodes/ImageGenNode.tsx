import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Image, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { WorkflowNodeData } from '../../../types/workflow';

export const ImageGenNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const status = nodeData.status || 'idle';
  const aspect = nodeData.params?.imageAspect || '1:1';
  const provider = nodeData.params?.imageProvider || 'pollinations';
  const imageUrl = nodeData.output?.imageUrl;

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
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
            <Image className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-100 tracking-wide">{nodeData.title || 'Image Generation'}</h4>
            <p className="text-[10px] text-blue-300/80 font-mono">FLUX / {provider}</p>
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
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-300 font-mono">Aspect: {aspect}</span>
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">{provider}</span>
        </div>

        {imageUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-blue-500/20 aspect-video group bg-black/50">
            <img src={imageUrl} alt="Generated result" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 bg-[#030712]/50 border border-white/5 rounded-xl text-slate-500 text-[11px] italic">
            Image preview will appear here
          </div>
        )}

        {nodeData.executionTimeMs !== undefined && (
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>Duration</span>
            <span className="text-blue-300">{(nodeData.executionTimeMs / 1000).toFixed(2)}s</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />
    </div>
  );
};
