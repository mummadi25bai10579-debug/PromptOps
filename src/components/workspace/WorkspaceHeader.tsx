import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Plus,
  Users,
  Bell,
  Search,
  Sparkles,
  ShieldCheck,
  Building2,
  Trash2,
  Edit2,
  Check
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Workspace } from '../../types/workspace';
import { cn } from '../../utils/cn';

interface WorkspaceHeaderProps {
  onOpenCreateModal: () => void;
  onOpenRenameModal: () => void;
  onOpenDeleteModal: () => void;
  onOpenNotifications: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  onOpenCreateModal,
  onOpenRenameModal,
  onOpenDeleteModal,
  onOpenNotifications,
}) => {
  const { user } = useAuthStore();
  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    members,
    userRole,
    unreadNotificationsCount,
    searchQuery,
    setSearchQuery,
    permissions
  } = useWorkspaceStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const onlineMembers = members.filter((m) => m.status === 'online');

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#09090B]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      {/* Workspace Switcher */}
      <div className="flex items-center gap-4 relative">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 shrink-0">
              {currentWorkspace?.name ? currentWorkspace.name[0].toUpperCase() : <Building2 className="w-5 h-5" />}
            </div>
            <div className="text-left overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-white tracking-tight text-base truncate max-w-[180px]">
                  {currentWorkspace?.name || 'Select Workspace'}
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-slate-400 transition-transform duration-300',
                    dropdownOpen ? 'rotate-180' : ''
                  )}
                />
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Role: <span className="text-indigo-300 uppercase font-bold text-[10px] tracking-wider">{userRole || 'Viewer'}</span>
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute left-0 top-full mt-2 w-72 bg-[#121216] border border-white/10 rounded-xl shadow-2xl z-40 p-2 overflow-hidden"
                >
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 mb-1">
                    Workspaces ({workspaces.length})
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          setCurrentWorkspace(ws);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer',
                          currentWorkspace?.id === ws.id
                            ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center font-bold text-xs shrink-0">
                            {ws.name[0].toUpperCase()}
                          </div>
                          <span className="truncate">{ws.name}</span>
                        </div>
                        {currentWorkspace?.id === ws.id && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/5 mt-1 space-y-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenCreateModal();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Create New Workspace
                    </button>

                    {permissions.canManageWorkspace && currentWorkspace && (
                      <>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenRenameModal();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Rename Current Workspace
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenDeleteModal();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Workspace
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Center Search bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members, assets, prompts, & activity..."
          className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right Controls: Presence Avatars + Notifications */}
      <div className="flex items-center gap-3">
        {/* Active Online Members Avatars */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex -space-x-2 overflow-hidden">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                title={`${m.displayName || m.email} (${m.status})`}
                className="relative w-7 h-7 rounded-full border-2 border-[#09090B] bg-slate-800 flex items-center justify-center text-xs font-semibold text-white overflow-hidden shrink-0"
              >
                {m.photoURL ? (
                  <img src={m.photoURL || undefined} alt={m.displayName} className="w-full h-full object-cover" />
                ) : (
                  (m.displayName || m.email)[0].toUpperCase()
                )}
                {m.status === 'online' && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-black animate-pulse" />
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-medium ml-1">
            <span className="text-emerald-400 font-bold">{onlineMembers.length}</span> online
          </span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#09090B] shadow-lg animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
