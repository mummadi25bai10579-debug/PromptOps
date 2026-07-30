import React from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Folder, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useGenerations } from '../../hooks/useGenerations';

export const WorkspaceSearch: React.FC = () => {
  const { searchQuery, setSearchQuery, members, setActiveTab } = useWorkspaceStore();
  const { generations } = useGenerations();

  if (!searchQuery) return null;

  const q = searchQuery.toLowerCase();

  const matchingMembers = members.filter(
    (m) =>
      m.email.toLowerCase().includes(q) ||
      (m.displayName && m.displayName.toLowerCase().includes(q))
  );

  const matchingAssets = generations.filter(
    (g) => g.prompt.toLowerCase().includes(q) || g.model.toLowerCase().includes(q)
  );

  return (
    <div className="bg-[#09090B]/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl p-6 mb-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
          <Search className="w-4 h-4" /> Instant Search Results for "{searchQuery}"
        </h3>
        <button
          onClick={() => setSearchQuery('')}
          className="text-xs text-slate-400 hover:text-white"
        >
          Close Results
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Members Matching */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" /> Members ({matchingMembers.length})
          </h4>
          {matchingMembers.length === 0 ? (
            <p className="text-xs text-slate-500">No members found.</p>
          ) : (
            matchingMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  setActiveTab('members');
                  setSearchQuery('');
                }}
                className="p-2 bg-black/40 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="overflow-hidden">
                  <span className="text-xs font-semibold text-white block truncate">
                    {m.displayName || m.email}
                  </span>
                  <span className="text-[10px] text-slate-400">{m.email}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-indigo-400">{m.role}</span>
              </div>
            ))
          )}
        </div>

        {/* Assets & Prompts Matching */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Assets & Prompts ({matchingAssets.length})
          </h4>
          {matchingAssets.length === 0 ? (
            <p className="text-xs text-slate-500">No assets found.</p>
          ) : (
            matchingAssets.slice(0, 3).map((a) => (
              <div
                key={a.id}
                onClick={() => {
                  setActiveTab('sharing');
                  setSearchQuery('');
                }}
                className="p-2 bg-black/40 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs text-slate-200 truncate font-mono">{a.prompt}</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
