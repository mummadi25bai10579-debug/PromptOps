import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, History as HistoryIcon, ArrowRight, Wand2 } from 'lucide-react';

interface EmptyHistoryStateProps {
  hasFilters: boolean;
  onResetFilters?: () => void;
}

export const EmptyHistoryState: React.FC<EmptyHistoryStateProps> = ({ hasFilters, onResetFilters }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#111827]/30 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl flex flex-col items-center justify-center max-w-xl mx-auto my-12 shadow-2xl space-y-6">
      
      {/* Icon Circle */}
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
          <HistoryIcon className="w-10 h-10" />
        </div>
        <div className="absolute -top-1 -right-1 p-1.5 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full text-white shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h3 className="text-xl font-display font-bold text-white tracking-tight">
          {hasFilters ? 'No matching prompts found' : 'No prompts generated yet.'}
        </h3>
        <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
          {hasFilters
            ? 'Try adjusting your search terms, date ranges, or filters to view your saved prompt history.'
            : 'Start generating text, images, audio, or video prompts to automatically build your prompt history vault.'}
        </p>
      </div>

      {/* CTA Button */}
      {hasFilters && onResetFilters ? (
        <button
          onClick={onResetFilters}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-semibold transition-all"
        >
          Reset All Filters
        </button>
      ) : (
        <button
          onClick={() => navigate('/generate')}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold shadow-xl shadow-indigo-500/25 transition-all group"
        >
          <Wand2 className="w-4 h-4 text-indigo-200" />
          <span>Generate First Prompt</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

    </div>
  );
};
