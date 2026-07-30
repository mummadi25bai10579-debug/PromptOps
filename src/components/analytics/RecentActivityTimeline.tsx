import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Download,
  Trash2,
  Heart,
  Copy,
  Check,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { ActivityLogItem } from '../../types/analytics';
import { cn } from '../../utils/cn';

interface RecentActivityTimelineProps {
  activityLogs: ActivityLogItem[];
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({ activityLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadge = (action: string, status: string) => {
    if (status === 'failed') {
      return (
        <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold rounded-full flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Failed
        </span>
      );
    }
    switch (action) {
      case 'downloaded':
        return (
          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Download className="w-3 h-3" /> Downloaded
          </span>
        );
      case 'favorited':
        return (
          <span className="px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Heart className="w-3 h-3 fill-pink-400/20" /> Favorited
          </span>
        );
      case 'deleted':
        return (
          <span className="px-2 py-0.5 bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Deleted
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Generated
          </span>
        );
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-amber-400" />;
    }
  };

  const filteredLogs = activityLogs.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.promptSnippet.toLowerCase().includes(query) ||
      item.model.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-6"
    >
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-display font-bold text-white">Recent Activity Timeline</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Realtime log of AI generations, downloads, and events</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search prompt or model..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-3 relative">
        <div className="absolute left-6 top-3 bottom-3 w-px bg-white/10" />

        {paginatedLogs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">No activity logs found.</div>
        ) : (
          paginatedLogs.map((log) => (
            <div
              key={log.id}
              className="relative pl-12 pr-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Node Bullet Icon */}
              <div className="absolute left-4 top-4 -translate-x-1/2 w-6 h-6 rounded-full bg-[#111827] border border-white/20 flex items-center justify-center shadow-md">
                {getAssetIcon(log.assetType)}
              </div>

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-white">{log.title}</span>
                  {getActionBadge(log.action, log.status)}
                  <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                    {log.model}
                  </span>
                </div>

                <p className="text-xs text-slate-300 truncate max-w-xl">"{log.promptSnippet}"</p>
              </div>

              {/* Timestamp & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-xs text-slate-400">
                <span className="font-mono text-[11px] text-slate-500">
                  {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyPrompt(log.promptSnippet, log.id)}
                    title="Copy Prompt"
                    className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {log.resultUrl && (
                    <a
                      href={log.resultUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="View Asset"
                      className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
