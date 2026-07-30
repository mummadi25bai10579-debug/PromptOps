import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, ChevronDown, ChevronUp, Copy, Check, Trash2, 
  Info, CheckCircle2, AlertTriangle, AlertCircle
} from 'lucide-react';
import { WorkflowLogItem } from '../../types/workflow';

interface ExecutionLogPanelProps {
  logs: WorkflowLogItem[];
  onClearLogs: () => void;
}

export const ExecutionLogPanel: React.FC<ExecutionLogPanelProps> = ({ logs, onClearLogs }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const filteredLogs = logs.filter(item => filter === 'all' || item.level === filter);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.nodeTitle ? l.nodeTitle + ': ' : ''}${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-[#090d16]/95 border-t border-white/5 transition-all duration-300 flex flex-col backdrop-blur-2xl z-10 ${
      isExpanded ? 'h-52' : 'h-10'
    }`}>
      {/* Console Bar Header */}
      <div className="h-10 px-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#090d16]/95 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Execution Logs</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
              {logs.length}
            </span>
          </button>

          {isExpanded && (
            <div className="flex items-center gap-1">
              {(['all', 'info', 'success', 'warning', 'error'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono capitalize transition-colors ${
                    filter === lvl ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isExpanded && (
            <>
              <button
                onClick={handleCopyLogs}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                title="Copy logs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClearLogs}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Log Output Stream */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5 no-scrollbar bg-[#030712]/90">
          {filteredLogs.length === 0 ? (
            <p className="text-slate-500 italic text-center py-4">No execution logs recorded yet.</p>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                
                {log.level === 'info' && <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />}
                {log.level === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                {log.level === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                {log.level === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}

                <div className="flex-1 truncate">
                  {log.nodeTitle && (
                    <span className="text-indigo-300 font-semibold mr-1.5">
                      [{log.nodeTitle}]
                    </span>
                  )}
                  <span className={
                    log.level === 'error' ? 'text-rose-300 font-semibold' :
                    log.level === 'success' ? 'text-emerald-300' :
                    log.level === 'warning' ? 'text-amber-300' : 'text-slate-300'
                  }>
                    {log.message}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
