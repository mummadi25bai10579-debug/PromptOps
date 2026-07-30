import React, { useState } from 'react';
import { PromptHistoryItem } from '../../types';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from '../../utils/format';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Heart, 
  Trash2, 
  Share2, 
  CopyPlus, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FileCode, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText,
  Square,
  CheckSquare,
  ExternalLink
} from 'lucide-react';

interface PromptCardProps {
  item: PromptHistoryItem;
  isSelected: boolean;
  onSelectToggle: (id: string, e: React.MouseEvent) => void;
  onCardClick: (item: PromptHistoryItem) => void;
  onFavoriteToggle: (item: PromptHistoryItem, e: React.MouseEvent) => void;
  onCopyPrompt: (promptText: string, e: React.MouseEvent) => void;
  onReusePrompt: (item: PromptHistoryItem, e: React.MouseEvent) => void;
  onDuplicate: (item: PromptHistoryItem, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onShare: (item: PromptHistoryItem, e: React.MouseEvent) => void;
}

export const getTypeColorAndIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'image':
      return { icon: ImageIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300' };
    case 'video':
      return { icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20 text-purple-300' };
    case 'audio':
      return { icon: Music, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' };
    case 'text':
      return { icon: FileCode, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-300' };
    default:
      return { icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' };
  }
};

export const formatDuration = (duration: string | number | undefined) => {
  if (!duration) return '1.2s';
  if (typeof duration === 'number') {
    return duration > 100 ? `${(duration / 1000).toFixed(1)}s` : `${duration}s`;
  }
  return String(duration);
};

export const PromptCard: React.FC<PromptCardProps> = ({
  item,
  isSelected,
  onSelectToggle,
  onCardClick,
  onFavoriteToggle,
  onCopyPrompt,
  onReusePrompt,
  onDuplicate,
  onDelete,
  onShare,
}) => {
  const [copied, setCopied] = useState(false);
  const typeMeta = getTypeColorAndIcon(item.type);
  const TypeIcon = typeMeta.icon;

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyPrompt(item.prompt, e);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exactDateStr = item.createdAt?.toMillis 
    ? new Date(item.createdAt.toMillis()).toLocaleString() 
    : item.createdAt instanceof Date 
      ? item.createdAt.toLocaleString() 
      : 'Recently generated';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onCardClick(item)}
      className={`group relative bg-[#111827]/60 hover:bg-[#111827]/90 border rounded-2xl p-5 backdrop-blur-xl shadow-xl transition-all cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/50'
          : item.favorite
            ? 'border-pink-500/30 bg-pink-500/[0.02]'
            : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          
          <div className="flex items-center gap-2 min-w-0">
            {/* Checkbox */}
            <button
              onClick={(e) => onSelectToggle(item.id, e)}
              className="text-slate-400 hover:text-white transition-colors shrink-0 p-0.5"
              aria-label={isSelected ? 'Deselect prompt' : 'Select prompt'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
              )}
            </button>

            {/* Type Badge */}
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 shrink-0 ${typeMeta.bg}`}>
              <TypeIcon className="w-3 h-3" />
              {item.type}
            </span>

            {/* Model Badge */}
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300 truncate max-w-[120px]">
              {item.model || 'Gemini 1.5 Pro'}
            </span>
          </div>

          {/* Status & Favorite */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status indicator */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                item.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : item.status === 'failed'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {item.status === 'completed' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : item.status === 'failed' ? (
                <XCircle className="w-3 h-3" />
              ) : (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              {item.status || 'completed'}
            </span>

            {/* Favorite Star Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle(item, e);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                item.favorite 
                  ? 'text-pink-400 bg-pink-500/20' 
                  : 'text-slate-500 hover:text-white hover:bg-white/10'
              }`}
              title={item.favorite ? 'Unstar prompt' : 'Star prompt'}
            >
              <Heart className={`w-3.5 h-3.5 ${item.favorite ? 'fill-current' : ''}`} />
            </button>
          </div>

        </div>

        {/* Prompt Content */}
        <p 
          className="text-sm font-sans text-slate-100 font-medium leading-relaxed line-clamp-3 mb-4 group-hover:text-white transition-colors"
          title={item.prompt}
        >
          {item.prompt}
        </p>

        {/* Negative Prompt summary snippet if present */}
        {item.negativePrompt && (
          <div className="mb-3 px-3 py-1.5 bg-black/40 border border-white/5 rounded-xl text-[11px] text-slate-400 font-mono truncate">
            <span className="text-slate-500 font-bold mr-1">Negative:</span>
            {item.negativePrompt}
          </div>
        )}
      </div>

      {/* Card Footer: Metadata & Quick Action Icons */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs text-slate-400">
        
        {/* Time & Duration */}
        <div className="flex items-center gap-2 min-w-0 font-mono text-[11px]">
          <span title={exactDateStr} className="text-slate-400 truncate">
            {formatDistanceToNow(item.createdAt)}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-indigo-400" />
            {formatDuration(item.duration)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopyClick}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Copy Prompt"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onReusePrompt(item, e);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Reuse Prompt in Generator"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(item, e);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Duplicate Prompt"
          >
            <CopyPlus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(item, e);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Share Prompt"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id, e);
            }}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete Prompt"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </motion.div>
  );
};
