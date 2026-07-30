import React from 'react';
import { LayoutGrid, Sparkles, Plus, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onUploadClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  hasFilters = false, 
  onClearFilters,
  onUploadClick 
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 border border-white/5 rounded-3xl bg-[#111827]/40 backdrop-blur-2xl text-center shadow-2xl relative overflow-hidden my-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />
      
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-xl relative group">
        <LayoutGrid className="w-10 h-10 text-indigo-400 transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-ping opacity-75" />
      </div>

      <h3 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">
        {hasFilters ? 'No matching assets found' : 'No assets generated yet'}
      </h3>
      <p className="text-slate-400 max-w-md text-sm mb-8 leading-relaxed">
        {hasFilters 
          ? 'Try adjusting your search query, clearing filters, or choosing a different media category.'
          : 'Start creating images, videos, audio, documents, and prompts with PromptOps AI or upload your assets directly to Backblaze B2.'
        }
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasFilters ? (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-sm font-medium transition-all shadow-lg"
          >
            <SearchX className="w-4 h-4" /> Reset All Filters
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate('/generate')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              <Sparkles className="w-4 h-4" /> Generate New Asset
            </button>
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white rounded-xl text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" /> Upload Custom Asset
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
