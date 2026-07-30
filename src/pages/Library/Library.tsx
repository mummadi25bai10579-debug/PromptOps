import React, { useState } from 'react';
import { useAssets } from '../../hooks/useAssets';
import { AssetDocument } from '../../types';
import { AssetSidebar } from '../../components/library/AssetSidebar';
import { AssetToolbar } from '../../components/library/AssetToolbar';
import { AssetCard, formatBytes } from '../../components/library/AssetCard';
import { AssetListItem } from '../../components/library/AssetListItem';
import { AssetPreviewPanel } from '../../components/library/AssetPreviewPanel';
import { UploadAssetModal } from '../../components/library/UploadAssetModal';
import { ShareModal } from '../../components/library/ShareModal';
import { AssetSkeleton } from '../../components/library/AssetSkeleton';
import { EmptyState } from '../../components/library/EmptyState';
import { ErrorState } from '../../components/library/ErrorState';
import { backblazeService } from '../../services/backblazeService';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Database, Image as ImageIcon, Video, Music, FileText, Sparkles, FolderArchive } from 'lucide-react';

export const Library = () => {
  const navigate = useNavigate();
  const {
    assets,
    filteredAssets,
    loading,
    error,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    selectedTag,
    setSelectedTag,
    allTags,
    selectedIds,
    toggleSelectId,
    toggleSelectAll,
    clearSelection,
    handleFavoriteToggle,
    handleDeleteAsset,
    handleRenameAsset,
    handleDuplicateAsset,
    handleAddTag,
    handleRemoveTag,
    handleBulkDelete,
    handleBulkFavorite,
    handleBulkDownload,
  } = useAssets();

  // Local View States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewAsset, setPreviewAsset] = useState<AssetDocument | null>(null);
  const [shareAsset, setShareAsset] = useState<AssetDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Download Handler
  const onDownloadFile = (url: string, filename: string) => {
    backblazeService.downloadFile(url, filename);
  };

  // Copy Prompt Handler
  const onCopyPrompt = (prompt: string) => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
    }
  };

  // Calculate Quick Header Stats
  const headerStats = React.useMemo(() => {
    let totalSize = 0, images = 0, videos = 0, audio = 0, docs = 0;
    assets.forEach(a => {
      if (a.fileSize) totalSize += a.fileSize;
      if (a.type === 'image') images++;
      else if (a.type === 'video') videos++;
      else if (a.type === 'audio') audio++;
      else docs++;
    });
    return { total: assets.length, totalSize, images, videos, audio, docs };
  }, [assets]);

  return (
    <div className="flex flex-col gap-6 pb-12 min-h-screen">
      
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> PromptOps AI Vault
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Asset Library</h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Production-ready media management system integrated with Backblaze B2 storage and Firestore. Search, filter, inspect, and organize AI assets across pipelines.
          </p>
        </div>

        {/* Top Summary Stats Bar */}
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1">
          <div className="bg-[#111827]/60 border border-white/5 rounded-2xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-xl shadow-lg shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Assets</span>
              <span className="text-lg font-display font-bold text-white">{headerStats.total}</span>
            </div>
          </div>

          <div className="bg-[#111827]/60 border border-white/5 rounded-2xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-xl shadow-lg shrink-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">B2 Storage</span>
              <span className="text-lg font-display font-bold text-cyan-300">{formatBytes(headerStats.totalSize)}</span>
            </div>
          </div>

          <div className="bg-[#111827]/60 border border-white/5 rounded-2xl px-4 py-2.5 items-center gap-3 backdrop-blur-xl shadow-lg shrink-0 hidden sm:flex">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Videos</span>
              <span className="text-lg font-display font-bold text-purple-300">{headerStats.videos}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Layout: Sidebar + Asset Content Grid */}
      <div className="flex gap-6 items-start relative">
        
        {/* Left Categories Sidebar */}
        <AssetSidebar
          activeCategory={activeCategory}
          onCategorySelect={(cat) => setActiveCategory(cat)}
          selectedTag={selectedTag}
          onTagSelect={(tag) => setSelectedTag(tag)}
          allTags={allTags}
          assets={assets}
          onUploadClick={() => setIsUploadOpen(true)}
          onGenerateClick={() => navigate('/generate')}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Right Asset Main View Area */}
        <div className="flex-1 space-y-6 min-w-0">
          
          {/* Top Search & Filter Bar */}
          <AssetToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            selectedCount={selectedIds.size}
            totalFilteredCount={filteredAssets.length}
            onSelectAllToggle={toggleSelectAll}
            onBulkDownload={handleBulkDownload}
            onBulkFavorite={handleBulkFavorite}
            onBulkDelete={handleBulkDelete}
            onRefresh={() => {}}
            onMobileSidebarToggle={() => setIsMobileSidebarOpen(true)}
          />

          {/* Asset List or Grid or States */}
          {loading ? (
            <AssetSkeleton viewMode={viewMode} count={10} />
          ) : error ? (
            <ErrorState error={error} onRetry={() => window.location.reload()} />
          ) : filteredAssets.length === 0 ? (
            <EmptyState
              hasFilters={!!(searchQuery || selectedTag || activeCategory !== 'All')}
              onClearFilters={() => {
                setSearchQuery('');
                setSelectedTag(null);
                setActiveCategory('All');
              }}
              onUploadClick={() => setIsUploadOpen(true)}
            />
          ) : viewMode === 'list' ? (
            /* Linear / Vercel style List View */
            <div className="space-y-3">
              <AnimatePresence>
                {filteredAssets.map((asset) => (
                  <AssetListItem
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedIds.has(asset.id)}
                    onSelectToggle={(id, e) => {
                      e.stopPropagation();
                      toggleSelectId(id);
                    }}
                    onPreviewClick={(a) => setPreviewAsset(a)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onDownload={(url, filename, e) => {
                      e.stopPropagation();
                      onDownloadFile(url, filename);
                    }}
                    onDelete={(id, e) => {
                      e.stopPropagation();
                      handleDeleteAsset(id);
                    }}
                    onCopyPrompt={(prompt, e) => {
                      e.stopPropagation();
                      onCopyPrompt(prompt);
                    }}
                    onRename={(a, e) => {
                      e.stopPropagation();
                      setPreviewAsset(a);
                    }}
                    onDuplicate={(a, e) => {
                      e.stopPropagation();
                      handleDuplicateAsset(a);
                    }}
                    onShare={(a, e) => {
                      e.stopPropagation();
                      setShareAsset(a);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* Card Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              <AnimatePresence>
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedIds.has(asset.id)}
                    onSelectToggle={(id, e) => {
                      e.stopPropagation();
                      toggleSelectId(id);
                    }}
                    onPreviewClick={(a) => setPreviewAsset(a)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onDownload={(url, filename, e) => {
                      e.stopPropagation();
                      onDownloadFile(url, filename);
                    }}
                    onDelete={(id, e) => {
                      e.stopPropagation();
                      handleDeleteAsset(id);
                    }}
                    onCopyPrompt={(prompt, e) => {
                      e.stopPropagation();
                      onCopyPrompt(prompt);
                    }}
                    onRename={(a, e) => {
                      e.stopPropagation();
                      setPreviewAsset(a);
                    }}
                    onDuplicate={(a, e) => {
                      e.stopPropagation();
                      handleDuplicateAsset(a);
                    }}
                    onShare={(a, e) => {
                      e.stopPropagation();
                      setShareAsset(a);
                    }}
                    hasActiveSelection={selectedIds.size > 0}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

        </div>
      </div>

      {/* Asset Preview Drawer Panel */}
      <AssetPreviewPanel
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        onFavoriteToggle={async (a) => {
          await handleFavoriteToggle(a);
          setPreviewAsset({ ...a, favorite: !a.favorite });
        }}
        onDownload={onDownloadFile}
        onDelete={async (id) => {
          await handleDeleteAsset(id);
          setPreviewAsset(null);
        }}
        onCopyPrompt={onCopyPrompt}
        onRename={async (a, newName) => {
          await handleRenameAsset(a, newName);
          setPreviewAsset({ ...a, fileName: newName });
        }}
        onDuplicate={handleDuplicateAsset}
        onShare={(a) => setShareAsset(a)}
        onAddTag={async (id, tag) => {
          await handleAddTag(id, tag);
          if (previewAsset) {
            const current = previewAsset.tags || [];
            if (!current.includes(tag.toLowerCase())) {
              setPreviewAsset({ ...previewAsset, tags: [...current, tag.toLowerCase()] });
            }
          }
        }}
        onRemoveTag={async (id, tag) => {
          await handleRemoveTag(id, tag);
          if (previewAsset) {
            setPreviewAsset({
              ...previewAsset,
              tags: (previewAsset.tags || []).filter(t => t !== tag)
            });
          }
        }}
      />

      {/* Upload Asset Modal */}
      <UploadAssetModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {}}
      />

      {/* Share Link Modal */}
      <ShareModal
        asset={shareAsset}
        onClose={() => setShareAsset(null)}
      />

    </div>
  );
};
