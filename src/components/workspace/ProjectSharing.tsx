import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  FolderPlus,
  Folder,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  History,
  Activity,
  Plus,
  ExternalLink,
  Lock,
  Globe,
  Loader2,
  X
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useGenerations } from '../../hooks/useGenerations';
import { workspaceService } from '../../services/workspaceService';
import { useAuthStore } from '../../store/useAuthStore';
import { SharedFolder } from '../../types/workspace';
import { cn } from '../../utils/cn';

export const ProjectSharing: React.FC = () => {
  const { user } = useAuthStore();
  const { currentWorkspace, permissions, searchQuery } = useWorkspaceStore();
  const { generations } = useGenerations();

  const [activeSubTab, setActiveSubTab] = useState<'folders' | 'assets' | 'prompts'>('folders');
  const [folders, setFolders] = useState<SharedFolder[]>([]);
  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Subscribe to shared folders
  useEffect(() => {
    if (!currentWorkspace) return;
    const unsub = workspaceService.subscribeToWorkspaceFolders(currentWorkspace.id, setFolders);
    return () => unsub();
  }, [currentWorkspace]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !user || !folderName.trim()) return;

    setLoading(true);
    try {
      await workspaceService.createFolder(currentWorkspace.id, folderName.trim(), folderDesc.trim(), {
        id: user.id,
        name: user.displayName || user.email || 'User',
        email: user.email || '',
      });
      setFolderName('');
      setFolderDesc('');
      setCreateFolderModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareLink = (id: string, title: string) => {
    const url = `${window.location.origin}/team?workspaceId=${currentWorkspace?.id}&assetId=${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssets = generations.filter((g) =>
    g.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Bar with Sub-tabs and Create Folder Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-[#09090B]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            Shared Projects & Assets
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Organize team assets into shared folders, collaborate on prompt engineering, & export assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveSubTab('folders')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activeSubTab === 'folders' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              )}
            >
              Folders ({folders.length})
            </button>
            <button
              onClick={() => setActiveSubTab('assets')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activeSubTab === 'assets' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              )}
            >
              Assets ({generations.length})
            </button>
            <button
              onClick={() => setActiveSubTab('prompts')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activeSubTab === 'prompts' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              )}
            >
              Prompt History
            </button>
          </div>

          {permissions.canManageAssets && (
            <button
              onClick={() => setCreateFolderModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" /> New Folder
            </button>
          )}
        </div>
      </div>

      {/* Sub Tab View: Folders */}
      {activeSubTab === 'folders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFolders.length === 0 ? (
            <div className="col-span-full text-center py-12 p-6 bg-[#09090B]/60 border border-dashed border-white/10 rounded-2xl">
              <Folder className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No shared folders created yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Create a folder to organize team assets and prompts.
              </p>
            </div>
          ) : (
            filteredFolders.map((folder) => (
              <div
                key={folder.id}
                className="p-5 bg-[#09090B]/60 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-indigo-500/50 transition-all group shadow-xl relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Folder className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleCopyShareLink(folder.id, folder.name)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Share Folder Link"
                  >
                    {copiedId === folder.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight mb-1 group-hover:text-indigo-300 transition-colors">
                  {folder.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 h-8">
                  {folder.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-white/5">
                  <span>{folder.assetIds?.length || 0} Assets</span>
                  <span>By {folder.createdBy}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sub Tab View: Shared Assets Grid */}
      {activeSubTab === 'assets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full text-center py-12 p-6 bg-[#09090B]/60 border border-dashed border-white/10 rounded-2xl">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No generated assets found.</p>
              <p className="text-xs text-slate-500 mt-1">Generate image, video, audio, or text assets in the Workspace tab.</p>
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-[#09090B]/60 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all shadow-xl group flex flex-col"
              >
                {/* Media Preview */}
                <div className="aspect-video bg-black/40 relative overflow-hidden flex items-center justify-center">
                  {asset.type === 'image' && (asset.resultUrl || asset.fileUrl || asset.b2Url) && (
                    <img src={asset.resultUrl || asset.fileUrl || asset.b2Url || undefined} alt={asset.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  {asset.type === 'video' && (asset.resultUrl || asset.fileUrl || asset.b2Url) && (
                    <video src={asset.resultUrl || asset.fileUrl || asset.b2Url || undefined} className="w-full h-full object-cover" />
                  )}
                  {asset.type === 'audio' && (
                    <div className="p-4 text-center">
                      <Music className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      {(asset.resultUrl || asset.fileUrl || asset.b2Url) ? (
                        <audio controls src={asset.resultUrl || asset.fileUrl || asset.b2Url || undefined} className="w-full h-8" />
                      ) : null}
                    </div>
                  )}
                  {asset.type === 'text' && (
                    <div className="p-4 text-xs text-slate-300 line-clamp-4 font-mono">
                      {asset.generatedText || asset.prompt}
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={() => handleCopyShareLink(asset.id, asset.prompt)}
                      className="p-1.5 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-lg text-white transition-colors cursor-pointer"
                      title="Copy Share Link"
                    >
                      {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                      {asset.model || asset.type}
                    </span>
                    <p className="text-xs text-slate-200 line-clamp-2 font-medium">
                      {asset.prompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-3 border-t border-white/5">
                    <span className="capitalize">{asset.type}</span>
                    <span>Shared in Workspace</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sub Tab View: Shared Prompt History */}
      {activeSubTab === 'prompts' && (
        <div className="bg-[#09090B]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" /> Shared Prompt Library
          </h3>

          <div className="space-y-3">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {gen.model}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{gen.type}</span>
                  </div>
                  <p className="text-sm font-mono text-slate-200">{gen.prompt}</p>
                </div>

                <button
                  onClick={() => handleCopyShareLink(gen.id, gen.prompt)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white rounded-lg border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedId === gen.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      <AnimatePresence>
        {createFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121216] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setCreateFolderModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white tracking-tight">Create Shared Folder</h3>
                  <p className="text-xs text-slate-400">Organize assets and prompts for team collaboration.</p>
                </div>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="e.g. Q3 Ad Campaign Visuals"
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={folderDesc}
                    onChange={(e) => setFolderDesc(e.target.value)}
                    placeholder="Folder goals or content details..."
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setCreateFolderModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Folder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
