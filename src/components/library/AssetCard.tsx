import React, { useState } from 'react';
import { AssetDocument } from '../../types';
import { motion } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  FileCode, 
  Play, 
  Download, 
  Trash2, 
  Heart, 
  Copy, 
  Share2, 
  MoreVertical, 
  CheckSquare, 
  Square, 
  CopyPlus, 
  Edit3, 
  Maximize2 
} from 'lucide-react';

interface AssetCardProps {
  asset: AssetDocument;
  isSelected: boolean;
  onSelectToggle: (id: string, e: React.MouseEvent) => void;
  onPreviewClick: (asset: AssetDocument) => void;
  onFavoriteToggle: (asset: AssetDocument, e: React.MouseEvent) => void;
  onDownload: (url: string, filename: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onCopyPrompt: (prompt: string, e: React.MouseEvent) => void;
  onRename: (asset: AssetDocument, e: React.MouseEvent) => void;
  onDuplicate: (asset: AssetDocument, e: React.MouseEvent) => void;
  onShare: (asset: AssetDocument, e: React.MouseEvent) => void;
  hasActiveSelection: boolean;
}

export const formatBytes = (bytes: number = 0, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const getTypeColorAndIcon = (type: string) => {
  switch (type) {
    case 'image':
      return {
        bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        badgeBg: 'bg-cyan-500/20 text-cyan-300',
        icon: ImageIcon,
        label: 'Image'
      };
    case 'video':
      return {
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        badgeBg: 'bg-purple-500/20 text-purple-300',
        icon: Video,
        label: 'Video'
      };
    case 'audio':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        badgeBg: 'bg-emerald-500/20 text-emerald-300',
        icon: Music,
        label: 'Audio'
      };
    case 'document':
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        badgeBg: 'bg-amber-500/20 text-amber-300',
        icon: FileText,
        label: 'Document'
      };
    case 'text':
    default:
      return {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        badgeBg: 'bg-rose-500/20 text-rose-300',
        icon: FileCode,
        label: 'Text'
      };
  }
};

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  isSelected,
  onSelectToggle,
  onPreviewClick,
  onFavoriteToggle,
  onDownload,
  onDelete,
  onCopyPrompt,
  onRename,
  onDuplicate,
  onShare,
  hasActiveSelection,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const typeInfo = getTypeColorAndIcon(asset.type);
  const TypeIcon = typeInfo.icon;
  const mediaUrl = asset.fileUrl || asset.resultUrl || asset.b2Url;
  const displayFileName = asset.fileName || `${asset.type}-${asset.id.slice(0, 6)}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="relative group rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 bg-[#111827]/80 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col justify-between"
    >
      {/* Selection Border Glow */}
      <div 
        className={`absolute inset-0 rounded-2xl pointer-events-none border-2 transition-all duration-300 ${
          isSelected 
            ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] z-20' 
            : 'border-transparent'
        }`} 
      />

      {/* Card Content Top Media */}
      <div 
        className="relative cursor-pointer overflow-hidden bg-black/40 min-h-[180px] max-h-[260px] flex items-center justify-center"
        onClick={(e) => {
          if (hasActiveSelection) {
            onSelectToggle(asset.id, e);
          } else {
            onPreviewClick(asset);
          }
        }}
      >
        {asset.type === 'image' && mediaUrl ? (
          <img 
            src={mediaUrl} 
            alt={asset.prompt || displayFileName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy" 
          />
        ) : asset.type === 'video' && mediaUrl ? (
          <div className="w-full aspect-[16/10] bg-black relative flex items-center justify-center overflow-hidden">
            <video 
              src={mediaUrl} 
              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" 
              muted 
              playsInline
              loop
            />
            <div className="absolute w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-2xl">
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </div>
            {asset.duration && (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-white border border-white/10">
                {asset.duration}
              </span>
            )}
          </div>
        ) : asset.type === 'audio' ? (
          <div className="w-full h-40 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-black p-4 text-emerald-400">
            <Music className="w-10 h-10 mb-2 animate-pulse" />
            <span className="text-xs font-mono text-emerald-300 font-semibold truncate max-w-full">Audio Asset</span>
          </div>
        ) : asset.type === 'document' ? (
          <div className="w-full h-40 flex flex-col items-center justify-center bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-black p-4 text-amber-400">
            <FileText className="w-10 h-10 mb-2" />
            <span className="text-xs font-mono text-amber-300 font-semibold truncate max-w-full">Document File</span>
          </div>
        ) : (
          <div className="w-full h-40 p-4 bg-gradient-to-br from-slate-900 to-black flex flex-col justify-between border-b border-white/5 text-slate-300 font-mono text-xs overflow-hidden">
            <div className="line-clamp-4 leading-relaxed opacity-80">
              {asset.generatedText || asset.prompt || 'Text generation output...'}
            </div>
            <span className="text-[10px] text-rose-400 uppercase tracking-widest font-bold">Text Generation</span>
          </div>
        )}

        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top Badges & Selection Toggle */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10 pointer-events-auto">
          {/* Asset Type & Model Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md border ${typeInfo.bg}`}>
              <TypeIcon className="w-3 h-3" />
              {typeInfo.label}
            </span>
            {asset.model && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 truncate max-w-[120px]">
                {asset.model}
              </span>
            )}
          </div>

          {/* Selection Checkbox & Favorite */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => onFavoriteToggle(asset, e)}
              className={`p-1.5 rounded-xl backdrop-blur-md border transition-all ${
                asset.favorite 
                  ? 'bg-pink-500/20 border-pink-500/40 text-pink-400' 
                  : 'bg-black/40 border-white/15 text-slate-400 hover:text-white hover:bg-black/60 opacity-0 group-hover:opacity-100'
              }`}
              title={asset.favorite ? 'Unfavorite' : 'Favorite'}
            >
              <Heart className={`w-3.5 h-3.5 ${asset.favorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={(e) => onSelectToggle(asset.id, e)}
              className={`p-1.5 rounded-xl backdrop-blur-md border transition-all ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-black/40 border-white/15 text-slate-400 hover:text-white hover:bg-black/60 opacity-0 group-hover:opacity-100'
              }`}
              title="Select Asset"
            >
              {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Quick Hover Action Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10 pointer-events-auto">
          <button
            onClick={() => onPreviewClick(asset)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/70 hover:bg-indigo-600 text-white text-xs font-medium backdrop-blur-md border border-white/10 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Preview
          </button>

          <div className="flex items-center gap-1">
            {mediaUrl && (
              <button
                onClick={(e) => onDownload(mediaUrl, displayFileName, e)}
                className="p-1.5 rounded-xl bg-black/70 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-colors"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => onCopyPrompt(asset.prompt, e)}
              className="p-1.5 rounded-xl bg-black/70 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-colors"
              title="Copy Prompt"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            
            {/* Context Menu Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1.5 rounded-xl bg-black/70 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-colors"
                title="More Actions"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div 
                  className="absolute right-0 bottom-full mb-2 w-44 bg-[#09090B] border border-white/10 rounded-xl shadow-2xl p-1 z-30 space-y-1 backdrop-blur-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => { setMenuOpen(false); onRename(asset, e); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Rename
                  </button>
                  <button
                    onClick={(e) => { setMenuOpen(false); onDuplicate(asset, e); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <CopyPlus className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button
                    onClick={(e) => { setMenuOpen(false); onShare(asset, e); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <button
                    onClick={(e) => { setMenuOpen(false); onDelete(asset.id, e); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info Section */}
      <div className="p-4 bg-[#111827] flex-1 flex flex-col justify-between gap-3 border-t border-white/5">
        <div>
          <h4 className="text-sm font-semibold text-slate-200 truncate font-mono mb-1" title={displayFileName}>
            {displayFileName}
          </h4>
          <p className="text-xs text-slate-400 line-clamp-2 leading-snug">
            {asset.prompt || 'No prompt provided'}
          </p>
        </div>

        {/* Tags if present */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/5 text-slate-400 border border-white/5">
                #{tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-[9px] text-slate-500 font-mono self-center">
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Metadata Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-500 font-medium">
          <span>{formatDate(asset.createdAt)}</span>
          <span>{formatBytes(asset.fileSize)}</span>
        </div>
      </div>
    </motion.div>
  );
};
