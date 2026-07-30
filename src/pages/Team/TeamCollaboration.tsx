import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Share2,
  MessageSquare,
  Activity,
  BarChart2,
  Sparkles,
  Building2,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWorkspaceStore, WorkspaceTab } from '../../store/useWorkspaceStore';
import { workspaceService } from '../../services/workspaceService';
import { WorkspaceHeader } from '../../components/workspace/WorkspaceHeader';
import { WorkspaceModal } from '../../components/workspace/WorkspaceModal';
import { TeamManagement } from '../../components/workspace/TeamManagement';
import { ProjectSharing } from '../../components/workspace/ProjectSharing';
import { CommentSystem } from '../../components/workspace/CommentSystem';
import { ActivityFeed } from '../../components/workspace/ActivityFeed';
import { NotificationCenter } from '../../components/workspace/NotificationCenter';
import { WorkspaceSearch } from '../../components/workspace/WorkspaceSearch';
import { Analytics } from '../Analytics/Analytics';
import { cn } from '../../utils/cn';

export const TeamCollaboration: React.FC = () => {
  const { user } = useAuthStore();
  const {
    currentWorkspace,
    workspaces,
    setWorkspaces,
    setMembers,
    setUserRole,
    setNotifications,
    activeTab,
    setActiveTab,
    setCurrentWorkspace,
    members
  } = useWorkspaceStore();

  const [modalType, setModalType] = useState<'create' | 'rename' | 'delete' | null>(null);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // 1. Subscribe to user's workspaces
  useEffect(() => {
    if (!user || !user.email) return;
    const unsubWorkspaces = workspaceService.subscribeToUserWorkspaces(
      user.id,
      user.email,
      (wsList) => {
        setWorkspaces(wsList);

        // Auto create default workspace if user has none
        if (wsList.length === 0) {
          workspaceService.createWorkspace(
            user.id,
            user.email || 'user@promptops.ai',
            user.displayName || 'User',
            user.photoURL || '',
            'Main PromptOps Team Workspace',
            'Default workspace for team AI asset generation'
          );
        }
      }
    );

    const unsubNotifications = workspaceService.subscribeToUserNotifications(
      user.email,
      setNotifications
    );

    return () => {
      unsubWorkspaces();
      unsubNotifications();
    };
  }, [user]);

  // 2. Subscribe to current workspace members & role
  useEffect(() => {
    if (!currentWorkspace || !user) return;

    const unsubMembers = workspaceService.subscribeToWorkspaceMembers(
      currentWorkspace.id,
      (memberList) => {
        setMembers(memberList);
        const myMember = memberList.find((m) => m.userId === user.id || m.email === user.email);
        setUserRole(myMember ? myMember.role : 'viewer');
      }
    );

    // Set user online status
    workspaceService.updateMemberPresence(currentWorkspace.id, user.id, 'online');

    return () => {
      unsubMembers();
      workspaceService.updateMemberPresence(currentWorkspace.id, user.id, 'offline');
    };
  }, [currentWorkspace, user]);

  const tabs: { id: WorkspaceTab; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'members', name: 'Team Members', icon: Users },
    { id: 'sharing', name: 'Project & Asset Sharing', icon: Share2 },
    { id: 'comments', name: 'Discussions & Comments', icon: MessageSquare },
    { id: 'activity', name: 'Activity Feed', icon: Activity },
    { id: 'analytics', name: 'Workspace Analytics', icon: BarChart2 },
  ];

  return (
    <div className="flex flex-col gap-6 h-full w-full pb-12">
      {/* Top Page Title */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">
          Team Collaboration & Workspaces
        </h1>
        <p className="text-slate-400 text-sm">
          Collaborate on AI prompts, manage team roles, review activity feeds, and share assets in real time.
        </p>
      </div>

      {/* Header with Switcher, Search, Notifications */}
      <WorkspaceHeader
        onOpenCreateModal={() => setModalType('create')}
        onOpenRenameModal={() => setModalType('rename')}
        onOpenDeleteModal={() => setModalType('delete')}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
      />

      {/* Instant Search Results Overlay */}
      <WorkspaceSearch />

      {/* Main Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-xs transition-all duration-300 relative cursor-pointer whitespace-nowrap',
                isActive
                  ? 'text-white bg-indigo-500/20 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-400' : 'text-slate-500')} />
              <span>{tab.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeWorkspaceTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="flex-1">
        {activeTab === 'members' && <TeamManagement />}
        {activeTab === 'sharing' && <ProjectSharing />}
        {activeTab === 'comments' && <CommentSystem />}
        {activeTab === 'activity' && <ActivityFeed />}
        {activeTab === 'analytics' && <Analytics />}
      </div>

      {/* Workspace Modals */}
      <WorkspaceModal type={modalType} onClose={() => setModalType(null)} />

      {/* Realtime Notification Center Drawer */}
      <NotificationCenter
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
      />
    </div>
  );
};
