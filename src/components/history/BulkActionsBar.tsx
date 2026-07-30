import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Heart, 
  Download, 
  X, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  ChevronUp
} from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  onSelectAllToggle: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkFavorite: () => void;
  onBulkExport: (format: 'json' | 'csv' | 'txt') => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  totalFilteredCount,
  onSelectAllToggle,
  onClearSelection,
  onBulkDelete,
  onBulkFavorite,
  onBulkExport,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const isAllSelected = selectedCount > 0 && selectedCount === totalFilteredCount;

  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#09090B]/90 border border-indigo-500/30 rounded-2xl p-3 sm:px-6 sm:py-3.5 backdrop-blur-2xl shadow-2xl flex items-center gap-3 sm:gap-6 text-xs text-white ring-1 ring-indigo-500/20 max-w-[95vw]"
      >
        {/* Selection Count & Select All */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAllToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-semibold transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
          </button>

          <span className="font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-xl font-bold">
            {selectedCount} Selected
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Favorite */}
          <button
            onClick={onBulkFavorite}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 rounded-xl font-semibold transition-colors"
            title="Star Selected Prompts"
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Favorite</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-600/20"
              title="Bulk Export"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
              <ChevronUp className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isExportMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setIsExportMenuOpen(false)} 
                />
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#09090B] border border-white/15 rounded-xl shadow-2xl z-30 p-1.5 space-y-1">
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                    Export {selectedCount} Selected
                  </span>
                  <button
                    onClick={() => {
                      onBulkExport('json');
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <FileJson className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      onBulkExport('csv');
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      onBulkExport('txt');
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Plain Text</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={onBulkDelete}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-xl font-semibold transition-colors"
            title="Delete Selected Prompts"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        {/* Clear Selection X */}
        <button
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-2"
          title="Clear Selection"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
