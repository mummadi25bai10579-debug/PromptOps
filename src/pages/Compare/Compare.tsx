import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { GenerationJob, Comparison } from '../../types';
import { Scale, Plus, History as HistoryIcon, Search, Image as ImageIcon, Video, Music, FileText, Trophy, Sparkles } from 'lucide-react';
import { useComparisons } from '../../hooks/useComparisons';
import { AssetSelectorModal } from '../../components/compare/AssetSelectorModal';
import { ComparisonView } from './ComparisonView';

export const Compare = () => {
  const { user } = useAuthStore();
  const { comparisons, loading: compsLoading } = useComparisons();

  const [activeComparison, setActiveComparison] = useState<Comparison | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // States for selecting two versions
  const [selectedAssetA, setSelectedAssetA] = useState<GenerationJob | null>(null);
  const [selectedAssetB, setSelectedAssetB] = useState<GenerationJob | null>(null);

  const handleStartComparison = async () => {
    if (!user || !selectedAssetA || !selectedAssetB) return;

    const compData = {
      userId: user.id,
      assetAId: selectedAssetA.id,
      assetBId: selectedAssetB.id,
      winnerId: null,
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'comparisons'), compData);

      const newComp: Comparison = {
        id: docRef.id,
        userId: user.id,
        assetAId: selectedAssetA.id,
        assetBId: selectedAssetB.id,
        assetA: selectedAssetA,
        assetB: selectedAssetB,
        winnerId: null,
        createdAt: new Date(),
      };

      setActiveComparison(newComp);
      setIsCreatingNew(false);
      setSelectedAssetA(null);
      setSelectedAssetB(null);
    } catch (e) {
      console.error('Failed to create comparison', e);
    }
  };

  if (activeComparison) {
    return (
      <ComparisonView
        comparison={activeComparison}
        onBack={() => setActiveComparison(null)}
        onUpdate={(updated) => setActiveComparison(updated)}
      />
    );
  }

  if (isCreatingNew) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#09090B] overflow-hidden">
        <header className="px-8 flex-shrink-0 pt-8 pb-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-1 flex items-center gap-3">
                <Scale className="w-8 h-8 text-indigo-400" />
                New Version Comparison Session
              </h1>
              <p className="text-slate-400 text-sm">
                Select any two AI outputs (Images, Videos, Audio, or Text) to compare prompts, parameters, and side-by-side quality.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingNew(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-semibold border border-white/10 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6 p-8">
          {/* Version A Selector */}
          <div className="flex-1 flex flex-col min-h-0 bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden relative">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10 text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Version A</span>
              {selectedAssetA && <span className="text-slate-400 font-mono text-[10px]">{selectedAssetA.model}</span>}
            </div>
            <AssetSelectorModal
              selectedAsset={selectedAssetA}
              onSelect={setSelectedAssetA}
              excludeId={selectedAssetB?.id}
              title="Select Version A"
            />
          </div>

          <div className="flex-none flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl">
              <Scale className="w-6 h-6" />
            </div>
          </div>

          {/* Version B Selector */}
          <div className="flex-1 flex flex-col min-h-0 bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden relative">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Version B</span>
              {selectedAssetB && <span className="text-slate-400 font-mono text-[10px]">{selectedAssetB.model}</span>}
            </div>
            <AssetSelectorModal
              selectedAsset={selectedAssetB}
              onSelect={setSelectedAssetB}
              excludeId={selectedAssetA?.id}
              title="Select Version B"
            />
          </div>
        </div>

        <div className="p-6 flex-shrink-0 flex justify-end bg-black/60 border-t border-white/10 backdrop-blur-xl">
          <button
            onClick={handleStartComparison}
            disabled={!selectedAssetA || !selectedAssetB}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Scale className="w-5 h-5" />
            Launch Comparison Studio
          </button>
        </div>
      </div>
    );
  }

  const filteredComparisons = comparisons.filter((comp) => {
    if (!searchFilter) return true;
    const pA = comp.assetA?.prompt?.toLowerCase() || '';
    const pB = comp.assetB?.prompt?.toLowerCase() || '';
    const mA = comp.assetA?.model?.toLowerCase() || '';
    const mB = comp.assetB?.model?.toLowerCase() || '';
    const query = searchFilter.toLowerCase();
    return pA.includes(query) || pB.includes(query) || mA.includes(query) || mB.includes(query);
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#09090B]">
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight flex items-center gap-3">
              Version Comparison Studio
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Compare multiple versions of AI-generated prompts, images, videos, audio, and text outputs side by side. Highlight setting differences and pick winning outputs.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            New Comparison
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search comparisons by prompt or model..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-indigo-400" />
            Saved Comparisons ({filteredComparisons.length})
          </h2>

          {compsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
              ))}
            </div>
          ) : filteredComparisons.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-3xl border-dashed">
              <Scale className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No comparison sessions found</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                Start comparing different generated versions to pick the highest quality outputs.
              </p>
              <button
                onClick={() => setIsCreatingNew(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-semibold text-xs cursor-pointer"
              >
                Create First Comparison
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredComparisons.map((comp) => {
                  const type = comp.assetA?.type || comp.assetB?.type || 'image';
                  return (
                    <motion.div
                      key={comp.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setActiveComparison(comp)}
                      className="group bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] hover:border-indigo-500/40 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Media Thumbnails Preview Row */}
                      <div className="flex gap-2 mb-4 h-32">
                        {/* Asset A */}
                        <div className="flex-1 rounded-xl overflow-hidden bg-black/60 relative border border-white/5 flex items-center justify-center">
                          {(comp.assetA?.resultUrl || comp.assetA?.fileUrl || comp.assetA?.b2Url) ? (
                            comp.assetA.type === 'video' ? (
                              <video src={comp.assetA.resultUrl || comp.assetA.fileUrl || comp.assetA.b2Url || undefined} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={comp.assetA.resultUrl || comp.assetA.fileUrl || comp.assetA.b2Url || undefined} className="w-full h-full object-cover" alt="Asset A" />
                            )
                          ) : comp.assetA?.type === 'audio' ? (
                            <Music className="w-8 h-8 text-emerald-400" />
                          ) : (
                            <FileText className="w-8 h-8 text-indigo-400" />
                          )}

                          {comp.winnerId === comp.assetAId && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded flex items-center gap-1 shadow-md">
                              <Trophy className="w-2.5 h-2.5" /> WINNER
                            </div>
                          )}
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-[9px] font-bold text-emerald-400 rounded">
                            Ver A
                          </span>
                        </div>

                        {/* Asset B */}
                        <div className="flex-1 rounded-xl overflow-hidden bg-black/60 relative border border-white/5 flex items-center justify-center">
                          {(comp.assetB?.resultUrl || comp.assetB?.fileUrl || comp.assetB?.b2Url) ? (
                            comp.assetB.type === 'video' ? (
                              <video src={comp.assetB.resultUrl || comp.assetB.fileUrl || comp.assetB.b2Url || undefined} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={comp.assetB.resultUrl || comp.assetB.fileUrl || comp.assetB.b2Url || undefined} className="w-full h-full object-cover" alt="Asset B" />
                            )
                          ) : comp.assetB?.type === 'audio' ? (
                            <Music className="w-8 h-8 text-indigo-400" />
                          ) : (
                            <FileText className="w-8 h-8 text-indigo-400" />
                          )}

                          {comp.winnerId === comp.assetBId && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded flex items-center gap-1 shadow-md">
                              <Trophy className="w-2.5 h-2.5" /> WINNER
                            </div>
                          )}
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-[9px] font-bold text-indigo-400 rounded">
                            Ver B
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-300 font-medium line-clamp-2 mb-2">
                          {comp.assetA?.prompt || comp.assetB?.prompt || 'Comparison Session'}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-2">
                          <span className="capitalize text-indigo-300 font-semibold">{type} Comparison</span>
                          <span>
                            {comp.createdAt?.toDate
                              ? comp.createdAt.toDate().toLocaleDateString()
                              : new Date(comp.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
