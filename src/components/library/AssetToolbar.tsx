import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  CheckSquare, 
  Square, 
  Download, 
  Heart, 
  Trash2, 
  SlidersHorizontal, 
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';

interface AssetToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortOrder: string;
  onSortOrderChange: (order: string) => void;
  selectedCount: number;
  totalFilteredCount: number;
  onSelectAllToggle: () => void;
  onBulkDownload: () => void;
  onBulkFavorite: () => void;
  onBulkDelete: () => void;
  onRefresh: () => void;
  onMobileSidebarToggle?: () => void;
}

export const sortOptions = [
  { id: 'Newest', label: 'Newest First' },
  { id: 'Oldest', label: 'Oldest First' },
  { id: 'A-Z', label: 'Name A-Z' },
  { id: 'Z-A', label: 'Name Z-A' },
  { id: 'Largest', label: 'File Size (Largest)' },
  { id: 'Smallest', label: 'File Size (Smallest)' },
];

export const AssetToolbar: React.FC<AssetToolbarProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOrder,
  onSortOrderChange,
  selectedCount,
  totalFilteredCount,
  onSelectAllToggle,
  onBulkDownload,
  onBulkFavorite,
  onBulkDelete,
  onRefresh,
  onMobileSidebarToggle
}) => {
  const isAllSelected = selectedCount > 0 && selectedCount === totalFilteredCount;

  return (
    <div className="flex flex-col gap-4 bg-[#111827]/70 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-2xl z-10 sticky top-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left Search & Mobile Toggle */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          {onMobileSidebarToggle && (
            <button
              onClick={onMobileSidebarToggle}
              className="lg:hidden p-2.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-white"
              title="Open Categories"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          <div className="relative flex-1 group">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search assets by name, prompt, model, tags..."
              className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 rounded-xl pl-10 pr-9 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Sort + View Switch + Refresh */}
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[#09090B] text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Refresh Asset Vault"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Select All & Bulk Actions Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <button
          onClick={onSelectAllToggle}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-slate-300 transition-colors"
        >
          {isAllSelected ? (
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Square className="w-3.5 h-3.5" />
          )}
          <span>{selectedCount > 0 ? `${selectedCount} Selected` : 'Select All'}</span>
        </button>

        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={onBulkDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-medium transition-colors shadow"
                title="Download Selected"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download ({selectedCount})</span>
              </button>

              <button
                onClick={onBulkFavorite}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 rounded-xl text-xs font-medium transition-colors"
                title="Favorite Selected"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Star</span>
              </button>

              <button
                onClick={onBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-xl text-xs font-medium transition-colors"
                title="Delete Selected"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
