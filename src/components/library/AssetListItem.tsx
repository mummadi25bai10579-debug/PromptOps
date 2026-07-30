import React, { useState } from 'react';
import { AssetDocument } from '../../types';
import { formatBytes, formatDate, getTypeColorAndIcon } from './AssetCard';
import { 
  Heart, 
  Download, 
  Copy, 
  Trash2, 
  MoreVertical, 
  CheckSquare, 
  Square, 
  Edit3, 
  CopyPlus, 
  Share2, 
  Maximize2 
} from 'lucide-react';

interface AssetListItemProps {
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
}

export const AssetListItem: React.FC<AssetListItemProps> = ({
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
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const typeInfo = getTypeColorAndIcon(asset.type);
  const TypeIcon = typeInfo.icon;
  const mediaUrl = asset.fileUrl || asset.resultUrl || asset.b2Url;
  const displayFileName = asset.fileName || `${asset.type}-${asset.id.slice(0, 6)}`;

  return (
    <div 
      className={`group flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer bg-[#111827]/60 backdrop-blur-md ${
        isSelected 
          ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
          : 'border-white/5 hover:border-white/20 hover:bg-[#111827]'
      }`}
      onClick={() => onPreviewClick(asset)}
    >
      {/* Left: Checkbox + Thumbnail + Filename & Prompt */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-4">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectToggle(asset.id, e);
          }}
          className={`p-1.5 rounded-lg border transition-colors ${
            isSelected 
              ? 'bg-indigo-600 border-indigo-500 text-white' 
              : 'border-white/10 text-slate-500 group-hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>

        {/* Small Media Thumbnail */}
        <div className="w-12 h-12 rounded-xl bg-black/60 overflow-hidden border border-white/10 flex items-center justify-center shrink-0">
          {asset.type === 'image' && mediaUrl ? (
            <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <TypeIcon className={`w-5 h-5 ${typeInfo.bg}`} />
          )}
        </div>

        {/* Title, Prompt, Tags */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white font-mono truncate max-w-xs sm:max-w-md">
              {displayFileName}
            </span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${typeInfo.bg}`}>
              {typeInfo.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-lg mt-0.5">
            {asset.prompt || 'No prompt specified'}
          </p>
        </div>
      </div>

      {/* Right: Model + File Size + Date + Actions */}
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        {asset.model && (
          <span className="hidden md:inline-block px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 text-slate-300 border border-white/5">
            {asset.model}
          </span>
        )}

        <span className="hidden sm:inline-block text-xs text-slate-400 font-mono w-20 text-right">
          {formatBytes(asset.fileSize)}
        </span>

        <span className="hidden lg:inline-block text-xs text-slate-500 font-medium w-32 text-right">
          {formatDate(asset.createdAt).split(',')[0]}
        </span>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle(asset, e);
          }}
          className={`p-2 rounded-xl border transition-colors ${
            asset.favorite 
              ? 'bg-pink-500/20 border-pink-500/40 text-pink-400' 
              : 'border-white/10 text-slate-500 hover:text-white hover:bg-white/5'
          }`}
          title={asset.favorite ? 'Unfavorite' : 'Favorite'}
        >
          <Heart className={`w-4 h-4 ${asset.favorite ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Download */}
        {mediaUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(mediaUrl, displayFileName, e);
            }}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors hidden sm:block"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Context Menu Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div 
              className="absolute right-0 top-full mt-2 w-44 bg-[#09090B] border border-white/10 rounded-xl shadow-2xl p-1 z-30 space-y-1 backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setMenuOpen(false); onPreviewClick(asset); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Open Preview
              </button>
              <button
                onClick={(e) => { setMenuOpen(false); onCopyPrompt(asset.prompt, e); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Prompt
              </button>
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
  );
};
