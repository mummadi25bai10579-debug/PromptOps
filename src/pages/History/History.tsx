import React, { useState } from 'react';
import { usePromptHistory } from '../../hooks/usePromptHistory';
import { SearchAndFilter } from '../../components/history/SearchAndFilter';
import { PromptCard } from '../../components/history/PromptCard';
import { PromptDetailDrawer } from '../../components/history/PromptDetailDrawer';
import { BulkActionsBar } from '../../components/history/BulkActionsBar';
import { SharePromptModal } from '../../components/history/SharePromptModal';
import { PromptHistorySkeleton } from '../../components/history/PromptHistorySkeleton';
import { EmptyHistoryState } from '../../components/history/EmptyHistoryState';
import { ErrorHistoryState } from '../../components/history/ErrorHistoryState';
import { PromptHistoryItem } from '../../types';
import { 
  History as HistoryIcon, 
  Sparkles, 
  Heart, 
  Clock, 
  Cpu, 
  Wand2, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const History: React.FC = () => {
  const navigate = useNavigate();

  const {
    prompts,
    filteredPrompts,
    displayedPrompts,
    loading,
    error,
    hasMore,
    loadMore,
    typeFilter,
    setTypeFilter,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    onlyFavorites,
    setOnlyFavorites,
    selectedIds,
    toggleSelectId,
    toggleSelectAll,
    clearSelection,
    handleFavoriteToggle,
    handleDelete,
    handleDuplicate,
    handleCopyPrompt,
    handleReusePrompt,
    handleGenerateAgain,
    handleBulkDelete,
    handleBulkFavorite,
    handleBulkExport,
    resetFilters,
  } = usePromptHistory();

  // Selected Item state for Drawer and Share Modal
  const [selectedDetailItem, setSelectedDetailItem] = useState<PromptHistoryItem | null>(null);
  const [shareItem, setShareItem] = useState<PromptHistoryItem | null>(null);

  // Compute summary stats
  const totalPromptsCount = prompts.length;
  const favoritePromptsCount = prompts.filter((p) => p.favorite).length;
  const uniqueModelsCount = new Set(prompts.map((p) => p.model)).size;

  const hasActiveFilters = 
    typeFilter !== 'All' || 
    dateFilter !== 'All' || 
    searchQuery.trim() !== '' || 
    onlyFavorites || 
    customStartDate !== '' || 
    customEndDate !== '';

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto w-full">
      
      {/* Top Hero / Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center gap-1.5">
              <HistoryIcon className="w-3 h-3" /> Prompt Vault
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Prompt History
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl leading-relaxed">
            Every prompt used across Text, Image, Audio, and Video models. Search, iterate, export, and reuse your best generations.
          </p>
        </div>

        {/* Top CTA */}
        <button
          onClick={() => navigate('/generate')}
          className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold shadow-xl shadow-indigo-500/20 transition-all shrink-0 group self-start md:self-auto"
        >
          <Wand2 className="w-4 h-4 text-indigo-200" />
          <span>New Prompt Generation</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Prompts</span>
            <span className="text-xl font-bold font-mono text-white">{totalPromptsCount}</span>
          </div>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3">
          <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Starred Favorites</span>
            <span className="text-xl font-bold font-mono text-white">{favoritePromptsCount}</span>
          </div>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">AI Models</span>
            <span className="text-xl font-bold font-mono text-white">{uniqueModelsCount}</span>
          </div>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Avg Speed</span>
            <span className="text-xl font-bold font-mono text-emerald-300">1.8s</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onlyFavorites={onlyFavorites}
        onFavoritesToggle={() => setOnlyFavorites(!onlyFavorites)}
        onExport={handleBulkExport}
        onResetFilters={resetFilters}
        totalResultsCount={filteredPrompts.length}
      />

      {/* Main Content Area */}
      {loading ? (
        <PromptHistorySkeleton count={6} />
      ) : error ? (
        <ErrorHistoryState error={error} />
      ) : filteredPrompts.length === 0 ? (
        <EmptyHistoryState hasFilters={hasActiveFilters} onResetFilters={resetFilters} />
      ) : (
        <div className="space-y-6">
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedPrompts.map((item) => (
              <PromptCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onSelectToggle={(id, e) => {
                  e.stopPropagation();
                  toggleSelectId(id);
                }}
                onCardClick={(clicked) => setSelectedDetailItem(clicked)}
                onFavoriteToggle={(itemToFav, e) => {
                  e.stopPropagation();
                  handleFavoriteToggle(itemToFav);
                }}
                onCopyPrompt={(promptText, e) => {
                  e.stopPropagation();
                  handleCopyPrompt(promptText);
                }}
                onReusePrompt={(reuseItem, e) => {
                  e.stopPropagation();
                  handleReusePrompt(reuseItem);
                }}
                onDuplicate={(dupItem, e) => {
                  e.stopPropagation();
                  handleDuplicate(dupItem);
                }}
                onDelete={(delId, e) => {
                  e.stopPropagation();
                  handleDelete(delId);
                }}
                onShare={(shareItm, e) => {
                  e.stopPropagation();
                  setShareItem(shareItm);
                }}
              />
            ))}
          </div>

          {/* Load More Pagination */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-[#111827]/80 hover:bg-[#111827] border border-white/10 hover:border-indigo-500/50 rounded-2xl text-xs font-bold text-slate-200 hover:text-white backdrop-blur-xl shadow-xl transition-all flex items-center gap-2 group"
              >
                <span>Load More Prompts ({filteredPrompts.length - displayedPrompts.length} remaining)</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-indigo-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        totalFilteredCount={filteredPrompts.length}
        onSelectAllToggle={toggleSelectAll}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkFavorite={handleBulkFavorite}
        onBulkExport={handleBulkExport}
      />

      {/* Detail Slide-over Panel Drawer */}
      <PromptDetailDrawer
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onFavoriteToggle={handleFavoriteToggle}
        onCopyPrompt={handleCopyPrompt}
        onReusePrompt={handleReusePrompt}
        onGenerateAgain={handleGenerateAgain}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onShare={(itemToShare) => setShareItem(itemToShare)}
      />

      {/* Share Prompt Modal */}
      <SharePromptModal
        item={shareItem}
        onClose={() => setShareItem(null)}
      />

    </div>
  );
};
