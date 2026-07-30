import React, { useState } from 'react';
import { X, History, CheckCircle2, AlertCircle, Clock, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import { WorkflowRun } from '../../types/workflow';

interface WorkflowHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  runs: WorkflowRun[];
  onReplayRun?: (run: WorkflowRun) => void;
}

export const WorkflowHistoryModal: React.FC<WorkflowHistoryModalProps> = ({
  isOpen,
  onClose,
  runs,
  onReplayRun
}) => {
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-[#090d16] border border-white/10 rounded-3xl max-w-5xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Workflow Execution History
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Historical runs, execution logs, generated media outputs, and status reports.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-4">
          {runs.length === 0 ? (
            <div className="py-20 text-center text-slate-500 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-base font-medium text-slate-300">No execution history found</p>
              <p className="text-xs">Run a workflow on the canvas to see real-time monitoring and historical logs here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                  className="p-4 rounded-2xl bg-[#111827]/60 hover:bg-[#1a2336] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {run.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {run.status === 'failed' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                      {run.status === 'cancelled' && <Clock className="w-5 h-5 text-amber-400" />}
                      <div>
                        <h4 className="text-sm font-semibold text-white">{run.workflowName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(run.startedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono text-xs">
                        <span className="text-slate-400 block text-[10px]">Duration</span>
                        <span className="text-indigo-300">{(run.executionTimeMs / 1000).toFixed(2)}s</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold ${
                        run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                        run.status === 'failed' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail Inspector */}
                  {selectedRun?.id === run.id && (
                    <div className="pt-3 border-t border-white/5 space-y-3 text-xs">
                      {/* Generated Assets Preview */}
                      {run.assetsGenerated && run.assetsGenerated.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">Generated Media Assets</span>
                          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                            {run.assetsGenerated.map((asset, idx) => (
                              <div key={idx} className="p-2 rounded-xl bg-[#030712] border border-white/10 shrink-0 max-w-xs">
                                {asset.type === 'image' && asset.url && (
                                  <img src={asset.url || undefined} alt="Output" className="w-32 h-20 object-cover rounded-lg" />
                                )}
                                {asset.type === 'video' && asset.url && (
                                  <video src={asset.url || undefined} className="w-32 h-20 object-cover rounded-lg" />
                                )}
                                {asset.type === 'audio' && asset.url && (
                                  <audio src={asset.url || undefined} controls className="w-40 h-8" />
                                )}
                                {asset.b2FileId && (
                                  <span className="text-[10px] text-emerald-400 font-mono block mt-1 truncate">
                                    B2: {asset.b2FileId}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Log snippet */}
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Execution Steps Log ({run.logs.length})</span>
                        <div className="bg-[#030712] rounded-xl p-3 max-h-36 overflow-y-auto font-mono text-[10px] space-y-1 text-slate-300">
                          {run.logs.map((log) => (
                            <div key={log.id} className="truncate">
                              <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
