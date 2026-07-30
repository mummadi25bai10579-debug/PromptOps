import React from 'react';
import { AssetDocument } from '../../types';
import { formatBytes } from './AssetCard';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  FileCode, 
  Heart, 
  Tag as TagIcon, 
  Database, 
  Plus, 
  Sparkles, 
  X 
} from 'lucide-react';

interface AssetSidebarProps {
  activeCategory: string;
  onCategorySelect: (category: string) => void;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  allTags: string[];
  assets: AssetDocument[];
  onUploadClick: () => void;
  onGenerateClick: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const AssetSidebar: React.FC<AssetSidebarProps> = ({
  activeCategory,
  onCategorySelect,
  selectedTag,
  onTagSelect,
  allTags,
  assets,
  onUploadClick,
  onGenerateClick,
  isMobileOpen = false,
  onMobileClose
}) => {

  // Calculate counts per category
  const counts = React.useMemo(() => {
    let images = 0, videos = 0, audio = 0, documents = 0, text = 0, favorites = 0, totalSize = 0;
    assets.forEach(a => {
      if (a.fileSize) totalSize += a.fileSize;
      if (a.favorite) favorites++;
      if (a.type === 'image') images++;
      else if (a.type === 'video') videos++;
      else if (a.type === 'audio') audio++;
      else if (a.type === 'document') documents++;
      else if (a.type === 'text') text++;
    });
    return {
      all: assets.length,
      images,
      videos,
      audio,
      documents,
      text,
      favorites,
      totalSize
    };
  }, [assets]);

  const categories = [
    { id: 'All', label: 'All Assets', icon: LayoutGrid, count: counts.all, color: 'text-indigo-400' },
    { id: 'Images', label: 'Images', icon: ImageIcon, count: counts.images, color: 'text-cyan-400' },
    { id: 'Videos', label: 'Videos', icon: Video, count: counts.videos, color: 'text-purple-400' },
    { id: 'Audio', label: 'Audio', icon: Music, count: counts.audio, color: 'text-emerald-400' },
    { id: 'Documents', label: 'Documents', icon: FileText, count: counts.documents, color: 'text-amber-400' },
    { id: 'Text', label: 'Text Generations', icon: FileCode, count: counts.text, color: 'text-rose-400' },
    { id: 'Favorites', label: 'Starred Favorites', icon: Heart, count: counts.favorites, color: 'text-pink-400' },
  ];

  // Storage calculation percentage of 10GB default
  const MAX_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10GB
  const storagePercentage = Math.min(100, Math.max(2, (counts.totalSize / MAX_STORAGE_BYTES) * 100));

  const content = (
    <div className="flex flex-col h-full justify-between p-4 space-y-6">
      
      <div className="space-y-6">
        {/* Mobile Header Close */}
        {isMobileOpen && (
          <div className="flex items-center justify-between pb-2 border-b border-white/10 lg:hidden">
            <span className="text-sm font-bold text-white uppercase tracking-wider">Asset Navigator</span>
            <button onClick={onMobileClose} className="p-1.5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onGenerateClick();
              if (onMobileClose) onMobileClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Sparkles className="w-4 h-4" /> Generate Asset
          </button>

          <button
            onClick={() => {
              onUploadClick();
              if (onMobileClose) onMobileClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Upload to B2
          </button>
        </div>

        {/* Categories Navigation */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 block">
            Media Library
          </span>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id && !selectedTag;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onCategorySelect(cat.id);
                  onTagSelect(null);
                  if (onMobileClose) onMobileClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${cat.color}`} />
                  <span>{cat.label}</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/40 text-slate-400 border border-white/5">
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tags Section */}
        {allTags.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-white/5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><TagIcon className="w-3 h-3 text-indigo-400" /> Tags</span>
              {selectedTag && (
                <button 
                  onClick={() => onTagSelect(null)} 
                  className="text-[10px] text-indigo-400 hover:underline capitalize"
                >
                  Clear
                </button>
              )}
            </span>

            <div className="flex flex-wrap gap-1.5 px-2 max-h-36 overflow-y-auto custom-scrollbar pt-1">
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      onTagSelect(isSelected ? null : tag);
                      if (onMobileClose) onMobileClose();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Storage Breakdown Widget Bottom */}
      <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" /> B2 Storage
          </span>
          <span className="font-mono text-white font-medium">{formatBytes(counts.totalSize)}</span>
        </div>

        {/* Storage Bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${storagePercentage}%` }}
          />
        </div>

        <p className="text-[10px] text-slate-500">
          Backblaze B2 S3 bucket storage active. Unlimited Cloud asset hosting.
        </p>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 bg-[#09090B]/60 border-r border-white/5 sticky top-0 h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar shrink-0 rounded-2xl">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onMobileClose} />
          <div className="relative w-72 bg-[#09090B] h-full shadow-2xl border-r border-white/10 z-10 overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
