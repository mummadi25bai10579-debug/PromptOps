import { create } from 'zustand';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  NotificationItem,
  getRolePermissions,
  RolePermissions
} from '../types/workspace';

export type WorkspaceTab = 'members' | 'sharing' | 'comments' | 'activity' | 'notifications' | 'analytics';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  userRole: WorkspaceRole | null;
  permissions: RolePermissions;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  activeTab: WorkspaceTab;
  searchQuery: string;

  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setMembers: (members: WorkspaceMember[]) => void;
  setUserRole: (role: WorkspaceRole | null) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setSearchQuery: (query: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspace: null,
  workspaces: [],
  members: [],
  userRole: null,
  permissions: getRolePermissions('viewer'),
  notifications: [],
  unreadNotificationsCount: 0,
  activeTab: 'members',
  searchQuery: '',

  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setWorkspaces: (workspaces) =>
    set((state) => ({
      workspaces,
      // Default to first workspace if none selected or current workspace was deleted
      currentWorkspace:
        state.currentWorkspace && workspaces.some((w) => w.id === state.currentWorkspace?.id)
          ? state.currentWorkspace
          : workspaces[0] || null,
    })),
  setMembers: (members) => set({ members }),
  setUserRole: (userRole) =>
    set({
      userRole,
      permissions: getRolePermissions(userRole || 'viewer'),
    }),
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadNotificationsCount: notifications.filter((n) => !n.read).length,
    }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
