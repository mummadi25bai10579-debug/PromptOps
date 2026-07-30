import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Sparkles,
  Trash2,
  Edit,
  Download,
  UserPlus,
  UserMinus,
  ShieldAlert,
  Building2,
  Folder,
  MessageSquare,
  Clock,
  Filter
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { workspaceService } from '../../services/workspaceService';
import { ActivityLogItem, ActivityAction } from '../../types/workspace';
import { cn } from '../../utils/cn';

export const ActivityFeed: React.FC = () => {
  const { currentWorkspace, searchQuery } = useWorkspaceStore();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    if (!currentWorkspace) return;
    const unsub = workspaceService.subscribeToActivityLogs(currentWorkspace.id, setLogs, 100);
    return () => unsub();
  }, [currentWorkspace]);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filterAction === 'all' || log.action === filterAction;
    const matchesSearch =
      !searchQuery ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActionIcon = (action: ActivityAction) => {
    switch (action) {
      case 'generated_asset':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'deleted_asset':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      case 'edited_prompt':
        return <Edit className="w-4 h-4 text-indigo-400" />;
      case 'downloaded_asset':
        return <Download className="w-4 h-4 text-cyan-400" />;
      case 'member_joined':
        return <UserPlus className="w-4 h-4 text-purple-400" />;
      case 'member_left':
        return <UserMinus className="w-4 h-4 text-amber-400" />;
      case 'role_changed':
        return <ShieldAlert className="w-4 h-4 text-blue-400" />;
      case 'workspace_created':
        return <Building2 className="w-4 h-4 text-purple-400" />;
      case 'shared_project':
        return <Folder className="w-4 h-4 text-indigo-400" />;
      case 'comment_added':
      default:
        return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Filter Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-[#09090B]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Workspace Activity Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of team actions, prompt edits, member changes, and asset creations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-transparent text-xs text-slate-200 py-1.5 pr-3 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#121216]">All Activity Types</option>
            <option value="generated_asset" className="bg-[#121216]">Generated Assets</option>
            <option value="deleted_asset" className="bg-[#121216]">Deleted Assets</option>
            <option value="edited_prompt" className="bg-[#121216]">Edited Prompts</option>
            <option value="downloaded_asset" className="bg-[#121216]">Downloaded Assets</option>
            <option value="member_joined" className="bg-[#121216]">Member Joined</option>
            <option value="role_changed" className="bg-[#121216]">Role Changed</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-[#09090B]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 relative">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No activity records found matching filters.</p>
          </div>
        ) : (
          <div className="relative border-l border-white/10 ml-4 space-y-6">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative pl-6 group">
                {/* Timeline Icon Node */}
                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-[#121216] border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  {getActionIcon(log.action)}
                </div>

                <div className="bg-white/5 border border-white/5 group-hover:border-white/10 rounded-xl p-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{log.actorName}</span>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {log.action.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> {formatDate(log.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans mt-1">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
