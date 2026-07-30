import React, { useState } from 'react';
import { PromptHistoryItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { getTypeColorAndIcon, formatDuration } from './PromptCard';
import { 
  X, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Heart, 
  Trash2, 
  Share2, 
  CopyPlus, 
  RefreshCw, 
  Clock, 
  Cpu, 
  Sliders, 
  Zap, 
  ExternalLink, 
  Music, 
  FileText, 
  Code,
  Tag as TagIcon
} from 'lucide-react';

interface PromptDetailDrawerProps {
  item: PromptHistoryItem | null;
  onClose: () => void;
  onFavoriteToggle: (item: PromptHistoryItem) => void;
  onCopyPrompt: (promptText: string) => void;
  onReusePrompt: (item: PromptHistoryItem) => void;
  onGenerateAgain: (item: PromptHistoryItem) => void;
  onDuplicate: (item: PromptHistoryItem) => void;
  onDelete: (id: string) => void;
  onShare: (item: PromptHistoryItem) => void;
}

export const PromptDetailDrawer: React.FC<PromptDetailDrawerProps> = ({
  item,
  onClose,
  onFavoriteToggle,
  onCopyPrompt,
  onReusePrompt,
  onGenerateAgain,
  onDuplicate,
  onDelete,
  onShare,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!item) return null;

  const typeMeta = getTypeColorAndIcon(item.type);
  const TypeIcon = typeMeta.icon;
  const mediaUrl = item.fileUrl || item.resultUrl || item.b2Url;

  const exactDateStr = item.createdAt?.toMillis 
    ? new Date(item.createdAt.toMillis()).toLocaleString() 
    : item.createdAt instanceof Date 
      ? item.createdAt.toLocaleString() 
      : 'Recently generated';

  const handleCopy = (text: string) => {
    onCopyPrompt(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const settingsObj = item.settings || item.parameters || {};

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-full max-w-2xl bg-[#09090B] border-l border-white/10 h-full flex flex-col shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#111827]/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${typeMeta.bg}`}>
                <TypeIcon className="w-3.5 h-3.5" />
                {item.type}
              </span>
              <div>
                <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
                  Prompt Details
                  {item.favorite && <Heart className="w-4 h-4 text-pink-400 fill-current" />}
                </h2>
                <p className="text-xs text-slate-400 font-mono">{exactDateStr}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-black/40 hover:bg-white/10 border border-white/10 rounded-full transition-colors"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
            
            {/* Primary Action Button Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onGenerateAgain(item)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Generate Again
              </button>

              <button
                onClick={() => onReusePrompt(item)}
                className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Reuse in Workspace"
              >
                <RotateCcw className="w-4 h-4 text-indigo-400" /> Reuse Prompt
              </button>

              <button
                onClick={() => onFavoriteToggle(item)}
                className={`p-2.5 border rounded-xl transition-colors ${
                  item.favorite
                    ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
                title="Star Prompt"
              >
                <Heart className={`w-4 h-4 ${item.favorite ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => onDuplicate(item)}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-colors"
                title="Duplicate Prompt"
              >
                <CopyPlus className="w-4 h-4" />
              </button>

              <button
                onClick={() => onShare(item)}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-colors"
                title="Share Prompt"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Linked Asset Preview if available */}
            {mediaUrl || item.generatedText ? (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Linked Generated Output</span>
                  {mediaUrl && (
                    <a 
                      href={mediaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-indigo-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      Open Media <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </span>

                <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center justify-center overflow-hidden">
                  {item.type === 'image' && mediaUrl ? (
                    <img src={mediaUrl} alt={item.prompt} className="max-h-64 object-contain rounded-xl shadow-2xl" />
                  ) : item.type === 'video' && mediaUrl ? (
                    <video src={mediaUrl} controls className="max-h-64 rounded-xl w-full" />
                  ) : item.type === 'audio' && mediaUrl ? (
                    <div className="w-full p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-center">
                      <Music className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                      <audio src={mediaUrl} controls className="w-full mt-2" />
                    </div>
                  ) : item.generatedText ? (
                    <div className="w-full max-h-52 overflow-y-auto font-mono text-xs text-slate-200 bg-white/5 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                      {item.generatedText}
                    </div>
                  ) : (
                    <div className="p-4 text-slate-400 text-xs font-mono text-center">
                      Output stored on B2 Cloud Bucket: <span className="text-white">{item.fileName || item.id}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Full Prompt Display Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Prompt</span>
                <button
                  onClick={() => handleCopy(item.prompt)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPrompt ? 'Copied' : 'Copy Prompt'}
                </button>
              </div>

              <div className="bg-black/60 border border-white/10 rounded-2xl p-4 text-slate-100 font-sans text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {item.prompt}
              </div>
            </div>

            {/* Negative Prompt Block if exists */}
            {item.negativePrompt && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Negative Prompt</span>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                  {item.negativePrompt}
                </div>
              </div>
            )}

            {/* AI Model & Generation Specs Grid */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" /> AI Engine Specs
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">AI Model</span>
                  <span className="font-semibold text-white font-mono">{item.model || 'Gemini 1.5 Pro'}</span>
                </div>

                <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Provider</span>
                  <span className="font-semibold text-slate-200">{item.provider || 'PromptOps AI'}</span>
                </div>

                <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Duration</span>
                  <span className="font-semibold text-indigo-300 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDuration(item.duration)}
                  </span>
                </div>

                {item.resolution && (
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Resolution</span>
                    <span className="font-semibold text-slate-200 font-mono">{item.resolution}</span>
                  </div>
                )}

                {item.seed !== undefined && (
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Seed</span>
                    <span className="font-semibold text-slate-200 font-mono">{String(item.seed)}</span>
                  </div>
                )}

                <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Execution Status</span>
                  <span className={`font-semibold capitalize ${
                    item.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {item.status || 'completed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Token Usage Block if present */}
            {item.tokens && (item.tokens.promptTokens || item.tokens.totalTokens) && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Token Usage
                </span>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Prompt Tokens</span>
                    <span className="font-mono text-base font-bold text-amber-300">{item.tokens.promptTokens || 0}</span>
                  </div>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Completion</span>
                    <span className="font-mono text-base font-bold text-amber-300">{item.tokens.completionTokens || 0}</span>
                  </div>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Total Tokens</span>
                    <span className="font-mono text-base font-bold text-amber-300">{item.tokens.totalTokens || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Generation Settings JSON / Key-Value Parameters */}
            {Object.keys(settingsObj).length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" /> Generation Settings
                </span>

                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto custom-scrollbar">
                  {Object.entries(settingsObj).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                      <span className="text-slate-500 font-semibold">{key}:</span>
                      <span className="text-indigo-300">{JSON.stringify(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags section */}
            {item.tags && item.tags.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TagIcon className="w-3 h-3 text-indigo-400" /> Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Drawer Footer Delete */}
          <div className="p-6 border-t border-white/10 bg-[#111827]/80 sticky bottom-0">
            <button
              onClick={() => {
                onDelete(item.id);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-semibold text-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Prompt Permanently
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
