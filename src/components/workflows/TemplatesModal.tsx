import React from 'react';
import { X, BookOpen, Sparkles, Youtube, Share2, Mic, Video, FileText, ArrowRight } from 'lucide-react';
import { WORKFLOW_TEMPLATES } from '../../data/workflowTemplates';
import { WorkflowTemplate } from '../../types/workflow';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Youtube,
  Share2,
  Sparkles,
  Mic,
  Video,
  FileText
};

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-[#090d16] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Workflow Templates
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select a pre-built multi-step AI pipeline to instantly load onto the canvas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 no-scrollbar">
          {WORKFLOW_TEMPLATES.map((tmpl) => {
            const Icon = ICON_MAP[tmpl.iconName] || Sparkles;
            return (
              <div
                key={tmpl.id}
                onClick={() => {
                  onSelectTemplate(tmpl);
                  onClose();
                }}
                className="group p-5 rounded-2xl bg-[#111827]/60 hover:bg-[#1a2336] border border-white/5 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5">
                      {tmpl.category}
                    </span>
                  </div>

                  <h4 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
                    {tmpl.name}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {tmpl.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                  <span>{tmpl.nodes.length} Nodes chained</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
