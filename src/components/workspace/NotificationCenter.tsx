import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  X,
  UserPlus,
  MessageSquare,
  AtSign,
  Share2,
  Sparkles,
  ExternalLink,
  Clock
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { workspaceService } from '../../services/workspaceService';
import { NotificationType } from '../../types/workspace';
import { cn } from '../../utils/cn';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { notifications, unreadNotificationsCount } = useWorkspaceStore();

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    if (!user?.email) return;
    await workspaceService.markAllNotificationsAsRead(user.email);
  };

  const handleMarkRead = async (id: string) => {
    await workspaceService.markNotificationAsRead(id);
  };

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case 'invitation':
        return <UserPlus className="w-4 h-4 text-purple-400" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-emerald-400" />;
      case 'shared_asset':
        return <Share2 className="w-4 h-4 text-cyan-400" />;
      case 'completed_generation':
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#121216] border-l border-white/10 shadow-2xl flex flex-col justify-between"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
                  Notifications
                  {unreadNotificationsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full">
                      {unreadNotificationsCount} New
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">Real-time invitations, mentions, & updates</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 p-6 overflow-y-auto space-y-3 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold text-slate-300">You're all caught up!</p>
                <p className="text-xs text-slate-500 mt-1">New team invitations and mentions will appear here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={cn(
                    'p-4 rounded-xl border transition-all cursor-pointer relative group',
                    n.read
                      ? 'bg-white/[0.02] border-white/5 opacity-70'
                      : 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0">
                      {getNotifIcon(n.type)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white truncate">{n.title}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-slate-500" /> {formatDate(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" /> Mark all as read
            </button>
            <span className="text-[11px] text-slate-500">{notifications.length} Total</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
