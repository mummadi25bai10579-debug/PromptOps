import React, { useState } from 'react';
import { PromptHistoryItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, Code, Link2 } from 'lucide-react';

interface SharePromptModalProps {
  item: PromptHistoryItem | null;
  onClose: () => void;
}

export const SharePromptModal: React.FC<SharePromptModalProps> = ({ item, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!item) return null;

  const shareableUrl = `${window.location.origin}/history?promptId=${item.id}`;
  const jsonSnippet = JSON.stringify(
    {
      prompt: item.prompt,
      model: item.model,
      settings: item.settings || item.parameters || {},
    },
    null,
    2
  );

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#09090B] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white">Share Prompt</h3>
                <p className="text-xs text-slate-400">Share or copy prompt code snippet</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Preview */}
          <div className="p-4 bg-black/50 border border-white/5 rounded-2xl text-xs text-slate-200 font-sans italic line-clamp-3">
            "{item.prompt}"
          </div>

          {/* Direct Share Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" /> Direct Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(shareableUrl, 'link')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-lg shadow-indigo-600/20"
              >
                {copiedType === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'link' ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* JSON Config Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-purple-400" /> Config JSON
              </label>
              <button
                onClick={() => copyToClipboard(jsonSnippet, 'json')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                {copiedType === 'json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'json' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="bg-black/60 border border-white/10 rounded-2xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40 custom-scrollbar">
              {jsonSnippet}
            </pre>
          </div>

          {/* Footer Close */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
