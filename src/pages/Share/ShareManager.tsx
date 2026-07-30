import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, Link, Globe, Lock, Users, Eye, Download, 
  Settings2, Copy, BarChart3, Trash2, ExternalLink, Calendar,
  MoreVertical, FileImage, FileVideo, ShieldAlert,
  Search, Filter
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

export const ShareManager = () => {
  const { user } = useAuthStore();
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrivacy, setFilterPrivacy] = useState('all');

  useEffect(() => {
    async function fetchShares() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'shares'), where('userId', '==', user.id));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(docSnap => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            assetName: d.assetName || d.title || 'Untitled Asset',
            type: d.type || 'image',
            privacy: d.privacy || 'public',
            views: d.views || 0,
            downloads: d.downloads || 0,
            date: d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000).toLocaleDateString() : 'Recent',
            expires: d.expires || 'Never',
            url: d.url || `/share/${docSnap.id}`
          };
        });
        setShares(list);
      } catch (err) {
        console.error("Error fetching shares:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchShares();
  }, [user]);

  const totalViews = shares.reduce((acc, s) => acc + (s.views || 0), 0);
  const totalDownloads = shares.reduce((acc, s) => acc + (s.downloads || 0), 0);
  const activePublicCount = shares.filter(s => s.privacy === 'public').length;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(window.location.origin + text);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Share Links & Showcase</h1>
        <p className="text-slate-400 text-sm">Manage public links, privacy settings, and track engagement across your shared assets.</p>
      </header>

      <div className="flex gap-6 mb-6">
        <div className="flex-1 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Views</div>
              <div className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Downloads</div>
              <div className="text-2xl font-bold text-white">{totalDownloads.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Active Public Links</div>
              <div className="text-2xl font-bold text-white">{activePublicCount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#111827]/40 border border-white/5 rounded-[24px] shadow-xl overflow-hidden flex flex-col relative backdrop-blur-md">
        
        <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search shared assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#09090B] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#09090B] border border-white/10 rounded-lg p-1">
              {['all', 'public', 'team', 'password'].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPrivacy(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                    filterPrivacy === p ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#111827] border-b border-white/10 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Privacy</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {shares.filter(s => 
                (filterPrivacy === 'all' || s.privacy === filterPrivacy) &&
                s.assetName.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(share => (
                <tr key={share.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#09090B] border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                        {share.type === 'image' && <FileImage className="w-5 h-5" />}
                        {share.type === 'video' && <FileVideo className="w-5 h-5" />}
                        {share.type === 'workflow' && <Settings2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{share.assetName}</div>
                        <a href={share.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-0.5">
                          {share.url} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      share.privacy === 'public' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      share.privacy === 'team' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                      "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    )}>
                      {share.privacy === 'public' && <Globe className="w-3 h-3" />}
                      {share.privacy === 'team' && <Users className="w-3 h-3" />}
                      {share.privacy === 'password' && <Lock className="w-3 h-3" />}
                      {share.privacy}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-slate-500" /> {share.views.toLocaleString()} views</div>
                      <div className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-500" /> {share.downloads.toLocaleString()} downloads</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {share.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <div className="flex items-center gap-1.5">
                      {share.expires !== 'Never' ? <Calendar className="w-4 h-4 text-slate-500" /> : <Globe className="w-4 h-4 text-slate-500 opacity-50" />}
                      {share.expires}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyToClipboard(share.url)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete Share Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
