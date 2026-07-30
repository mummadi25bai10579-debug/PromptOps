import React, { useState } from 'react';
import { DateFilterType, SortOptionType } from '../../hooks/usePromptHistory';
import { 
  Search, 
  X, 
  Calendar, 
  ArrowUpDown, 
  Heart, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  dateFilter: DateFilterType;
  onDateFilterChange: (df: DateFilterType) => void;
  customStartDate: string;
  onCustomStartDateChange: (date: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (date: string) => void;
  sortOrder: SortOptionType;
  onSortOrderChange: (so: SortOptionType) => void;
  onlyFavorites: boolean;
  onFavoritesToggle: () => void;
  onExport: (format: 'json' | 'csv' | 'txt') => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const typeOptions = [
  { id: 'All', label: 'All Types' },
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Image' },
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Video' },
];

export const dateOptions: { id: DateFilterType; label: string }[] = [
  { id: 'All', label: 'All Time' },
  { id: 'Today', label: 'Today' },
  { id: '7Days', label: 'Last 7 Days' },
  { id: '30Days', label: 'Last 30 Days' },
  { id: 'Custom', label: 'Custom Range' },
];

export const sortOptions: { id: SortOptionType; label: string }[] = [
  { id: 'Newest', label: 'Newest First' },
  { id: 'Oldest', label: 'Oldest First' },
  { id: 'Model', label: 'AI Model A-Z' },
  { id: 'PromptLength', label: 'Prompt Length' },
];

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  dateFilter,
  onDateFilterChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  sortOrder,
  onSortOrderChange,
  onlyFavorites,
  onFavoritesToggle,
  onExport,
  onResetFilters,
  totalResultsCount,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const hasActiveFilters = 
    typeFilter !== 'All' || 
    dateFilter !== 'All' || 
    searchQuery.trim() !== '' || 
    onlyFavorites || 
    customStartDate !== '' || 
    customEndDate !== '';

  return (
    <div className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Top Search & Primary Action Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 group min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search prompts by text, model, tags, parameters..."
            className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-sans transition-all"
            aria-label="Search prompt history"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls: Favorites Toggle, Sort, Export Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Favorites Star Toggle */}
          <button
            onClick={onFavoritesToggle}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              onlyFavorites
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-lg shadow-pink-500/10'
                : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
            title="Toggle Favorites Only"
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current text-pink-400' : 'text-slate-400'}`} />
            <span>Favorites</span>
          </button>

          {/* Date Filter Dropdown */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value as DateFilterType)}
              className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer hover:bg-white/5 transition-colors appearance-none"
              aria-label="Filter by Date"
            >
              {dateOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[#09090B] text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value as SortOptionType)}
              className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer hover:bg-white/5 transition-colors appearance-none"
              aria-label="Sort Order"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[#09090B] text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold transition-all"
              title="Export Prompt History"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isExportMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setIsExportMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 bg-[#09090B] border border-white/15 rounded-xl shadow-2xl z-30 p-1.5 space-y-1">
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                    Export Format
                  </span>
                  <button
                    onClick={() => {
                      onExport('json');
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <FileJson className="w-3.5 h-3.5 text-amber-400" />
                    <span>JSON Format</span>
                  </button>
                  <button
                    onClick={() => {
                      onExport('csv');
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CSV Spreadsheet</span>
                  </button>
                  <button
                    onClick={() => {
                      onExport('txt');
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Plain Text (.txt)</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

      </div>

      {/* Custom Date Range Picker inputs when DateFilter === 'Custom' */}
      {dateFilter === 'Custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-black/40 border border-white/10 rounded-xl text-xs">
          <span className="text-slate-400 font-semibold">Custom Date Range:</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">From</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomStartDateChange(e.target.value)}
              className="bg-[#111827] border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">To</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              className="bg-[#111827] border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      )}

      {/* Bottom Type Filter Pills & Clear Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
        
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-1">
            Type:
          </span>
          {typeOptions.map((opt) => {
            const isActive = typeFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onTypeFilterChange(opt.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 capitalize ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-black/30 border border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="font-mono">
            <strong className="text-white">{totalResultsCount}</strong> {totalResultsCount === 1 ? 'prompt' : 'prompts'} found
          </span>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
