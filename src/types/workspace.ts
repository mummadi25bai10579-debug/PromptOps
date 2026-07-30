export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail: string;
  avatarUrl?: string;
  createdAt: any;
  updatedAt: any;
  memberCount?: number;
  assetCount?: number;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: WorkspaceRole;
  status: 'online' | 'offline';
  joinedAt: any;
  lastActive: any;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterId: string;
  inviterName: string;
  email: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

export interface Comment {
  id: string;
  workspaceId: string;
  assetId: string;
  assetTitle?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  content: string;
  mentions?: string[]; // Array of emails or user IDs mentioned
  parentId?: string | null; // For nested replies
  createdAt: any;
  updatedAt?: any;
  isEdited?: boolean;
}

export type ActivityAction =
  | 'generated_asset'
  | 'deleted_asset'
  | 'edited_prompt'
  | 'downloaded_asset'
  | 'member_joined'
  | 'member_left'
  | 'role_changed'
  | 'workspace_created'
  | 'shared_project'
  | 'comment_added';

export interface ActivityLogItem {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorAvatar?: string;
  action: ActivityAction;
  details: string;
  targetType?: 'asset' | 'prompt' | 'member' | 'workspace' | 'folder';
  targetId?: string;
  timestamp: any;
}

export type NotificationType =
  | 'invitation'
  | 'comment'
  | 'mention'
  | 'shared_asset'
  | 'completed_generation';

export interface NotificationItem {
  id: string;
  workspaceId: string;
  recipientEmail: string;
  recipientUserId?: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  assetId?: string;
  read: boolean;
  createdAt: any;
}

export interface SharedFolder {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  assetIds: string[];
  createdBy: string;
  createdAt: any;
  updatedAt?: any;
}

export interface RolePermissions {
  canManageWorkspace: boolean;
  canManageMembers: boolean;
  canManageAssets: boolean;
  canGenerateContent: boolean;
  canEditPrompts: boolean;
  canComment: boolean;
  isReadOnly: boolean;
}

export const getRolePermissions = (role: WorkspaceRole): RolePermissions => {
  switch (role) {
    case 'owner':
      return {
        canManageWorkspace: true,
        canManageMembers: true,
        canManageAssets: true,
        canGenerateContent: true,
        canEditPrompts: true,
        canComment: true,
        isReadOnly: false,
      };
    case 'admin':
      return {
        canManageWorkspace: false,
        canManageMembers: true,
        canManageAssets: true,
        canGenerateContent: true,
        canEditPrompts: true,
        canComment: true,
        isReadOnly: false,
      };
    case 'editor':
      return {
        canManageWorkspace: false,
        canManageMembers: false,
        canManageAssets: false,
        canGenerateContent: true,
        canEditPrompts: true,
        canComment: true,
        isReadOnly: false,
      };
    case 'viewer':
    default:
      return {
        canManageWorkspace: false,
        canManageMembers: false,
        canManageAssets: false,
        canGenerateContent: false,
        canEditPrompts: false,
        canComment: true,
        isReadOnly: true,
      };
  }
};
