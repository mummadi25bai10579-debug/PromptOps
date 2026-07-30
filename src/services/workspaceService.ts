import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  Comment,
  ActivityLogItem,
  ActivityAction,
  NotificationItem,
  SharedFolder
} from '../types/workspace';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Workspace Service Error: ', JSON.stringify(errInfo));
}

export const workspaceService = {
  // ==========================================
  // WORKSPACES
  // ==========================================

  async createWorkspace(
    userId: string,
    userEmail: string,
    displayName: string,
    photoURL: string,
    name: string,
    description: string = ''
  ): Promise<string> {
    const path = 'workspaces';
    try {
      const workspaceRef = await addDoc(collection(db, path), {
        name,
        description,
        ownerId: userId,
        ownerEmail: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add Owner as first workspace member
      const memberDocId = `${workspaceRef.id}_${userId}`;
      await setDoc(doc(db, 'workspaceMembers', memberDocId), {
        workspaceId: workspaceRef.id,
        userId,
        email: userEmail,
        displayName: displayName || userEmail.split('@')[0],
        photoURL: photoURL || '',
        role: 'owner',
        status: 'online',
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });

      // Log activity
      await this.logActivity(workspaceRef.id, 'workspace_created', `Created workspace "${name}"`, {
        id: userId,
        name: displayName || userEmail,
        email: userEmail,
        avatar: photoURL
      });

      return workspaceRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async renameWorkspace(workspaceId: string, newName: string, actor: { id: string; name: string; email: string }) {
    const path = `workspaces/${workspaceId}`;
    try {
      await updateDoc(doc(db, 'workspaces', workspaceId), {
        name: newName,
        updatedAt: serverTimestamp(),
      });

      await this.logActivity(workspaceId, 'edited_prompt', `Renamed workspace to "${newName}"`, actor);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async deleteWorkspace(workspaceId: string) {
    const path = `workspaces/${workspaceId}`;
    try {
      await deleteDoc(doc(db, 'workspaces', workspaceId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },

  subscribeToUserWorkspaces(
    userId: string,
    userEmail: string,
    callback: (workspaces: Workspace[]) => void
  ) {
    const path = 'workspaceMembers';
    const q = query(collection(db, path), where('email', '==', userEmail));

    return onSnapshot(
      q,
      async (snapshot) => {
        try {
          const workspaceIds = snapshot.docs.map((d) => d.data().workspaceId);
          if (workspaceIds.length === 0) {
            callback([]);
            return;
          }

          const workspaceList: Workspace[] = [];
          for (const wsId of workspaceIds) {
            const wsDoc = await getDoc(doc(db, 'workspaces', wsId));
            if (wsDoc.exists()) {
              workspaceList.push({ id: wsDoc.id, ...wsDoc.data() } as Workspace);
            }
          }
          callback(workspaceList);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'workspaces');
          callback([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  // ==========================================
  // MEMBERS & TEAM MANAGEMENT
  // ==========================================

  subscribeToWorkspaceMembers(
    workspaceId: string,
    callback: (members: WorkspaceMember[]) => void
  ) {
    const path = 'workspaceMembers';
    const q = query(collection(db, path), where('workspaceId', '==', workspaceId));

    return onSnapshot(
      q,
      (snapshot) => {
        const members: WorkspaceMember[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as WorkspaceMember)
        );
        callback(members);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async inviteMemberByEmail(
    workspaceId: string,
    workspaceName: string,
    email: string,
    role: WorkspaceRole,
    inviter: { id: string; name: string; email: string; avatar?: string }
  ) {
    const path = 'workspaceMembers';
    try {
      const existingQuery = query(
        collection(db, path),
        where('workspaceId', '==', workspaceId),
        where('email', '==', email)
      );
      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        throw new Error(`User with email "${email}" is already a member of this workspace.`);
      }

      const tempUserId = `user_${Date.now()}`;
      const memberDocId = `${workspaceId}_${tempUserId}`;

      await setDoc(doc(db, path, memberDocId), {
        workspaceId,
        userId: tempUserId,
        email,
        displayName: email.split('@')[0],
        photoURL: '',
        role,
        status: 'offline',
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });

      // Send real-time notification to invited email
      await this.sendNotification({
        workspaceId,
        recipientEmail: email,
        actorId: inviter.id,
        actorName: inviter.name,
        actorAvatar: inviter.avatar || '',
        type: 'invitation',
        title: 'New Workspace Invitation',
        message: `${inviter.name} invited you to join workspace "${workspaceName}" as ${role.toUpperCase()}.`,
        link: `/team?workspaceId=${workspaceId}`,
      });

      // Log activity
      await this.logActivity(
        workspaceId,
        'member_joined',
        `Invited ${email} as ${role}`,
        inviter,
        'member',
        tempUserId
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    memberEmail: string,
    newRole: WorkspaceRole,
    actor: { id: string; name: string; email: string }
  ) {
    const path = `workspaceMembers/${memberId}`;
    try {
      await updateDoc(doc(db, 'workspaceMembers', memberId), {
        role: newRole,
        lastActive: serverTimestamp(),
      });

      // Send notification to member
      await this.sendNotification({
        workspaceId,
        recipientEmail: memberEmail,
        actorId: actor.id,
        actorName: actor.name,
        type: 'invitation',
        title: 'Role Updated',
        message: `Your role in workspace was updated to ${newRole.toUpperCase()}.`,
      });

      await this.logActivity(
        workspaceId,
        'role_changed',
        `Changed role of ${memberEmail} to ${newRole}`,
        actor,
        'member',
        memberId
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async removeMember(
    workspaceId: string,
    memberId: string,
    memberEmail: string,
    actor: { id: string; name: string; email: string }
  ) {
    const path = `workspaceMembers/${memberId}`;
    try {
      await deleteDoc(doc(db, 'workspaceMembers', memberId));

      await this.logActivity(
        workspaceId,
        'member_left',
        `Removed ${memberEmail} from workspace`,
        actor,
        'member',
        memberId
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },

  async updateMemberPresence(workspaceId: string, userId: string, status: 'online' | 'offline') {
    const memberDocId = `${workspaceId}_${userId}`;
    const path = `workspaceMembers/${memberDocId}`;
    try {
      await updateDoc(doc(db, 'workspaceMembers', memberDocId), {
        status,
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      // Ignore missing presence update silent errors
    }
  },

  // ==========================================
  // COMMENTS SYSTEM
  // ==========================================

  subscribeToAssetComments(
    workspaceId: string,
    assetId: string,
    callback: (comments: Comment[]) => void
  ) {
    const path = 'comments';
    const q = query(
      collection(db, path),
      where('workspaceId', '==', workspaceId),
      where('assetId', '==', assetId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const comments: Comment[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Comment)
        );
        // Sort client side to handle items without client timestamp safely
        comments.sort((a, b) => {
          const tA = a.createdAt?.seconds || Date.now() / 1000;
          const tB = b.createdAt?.seconds || Date.now() / 1000;
          return tA - tB;
        });
        callback(comments);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  subscribeToWorkspaceComments(
    workspaceId: string,
    callback: (comments: Comment[]) => void
  ) {
    const path = 'comments';
    const q = query(collection(db, path), where('workspaceId', '==', workspaceId));

    return onSnapshot(
      q,
      (snapshot) => {
        const comments: Comment[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Comment)
        );
        comments.sort((a, b) => {
          const tA = a.createdAt?.seconds || Date.now() / 1000;
          const tB = b.createdAt?.seconds || Date.now() / 1000;
          return tB - tA;
        });
        callback(comments);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async addComment(
    workspaceId: string,
    assetId: string,
    assetTitle: string,
    content: string,
    author: { id: string; name: string; email: string; avatar?: string },
    parentId?: string | null
  ) {
    const path = 'comments';
    try {
      // Detect @mentions in content
      const mentionMatches = content.match(/@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
      const mentions = mentionMatches ? mentionMatches.map((m) => m.replace('@', '')) : [];

      const docRef = await addDoc(collection(db, path), {
        workspaceId,
        assetId,
        assetTitle: assetTitle || 'AI Asset',
        authorId: author.id,
        authorName: author.name,
        authorEmail: author.email,
        authorAvatar: author.avatar || '',
        content,
        mentions,
        parentId: parentId || null,
        createdAt: serverTimestamp(),
      });

      // Dispatch notifications for mentioned users
      for (const email of mentions) {
        await this.sendNotification({
          workspaceId,
          recipientEmail: email,
          actorId: author.id,
          actorName: author.name,
          actorAvatar: author.avatar,
          type: 'mention',
          title: 'You were mentioned',
          message: `${author.name} mentioned you in a comment on "${assetTitle}"`,
          assetId,
        });
      }

      await this.logActivity(
        workspaceId,
        'comment_added',
        `Commented on "${assetTitle}": ${content.slice(0, 50)}...`,
        author,
        'asset',
        assetId
      );

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async editComment(commentId: string, newContent: string) {
    const path = `comments/${commentId}`;
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        content: newContent,
        updatedAt: serverTimestamp(),
        isEdited: true,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async deleteComment(commentId: string) {
    const path = `comments/${commentId}`;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },

  // ==========================================
  // ACTIVITY FEED
  // ==========================================

  subscribeToActivityLogs(
    workspaceId: string,
    callback: (logs: ActivityLogItem[]) => void,
    limitCount: number = 50
  ) {
    const path = 'activityLogs';
    const q = query(
      collection(db, path),
      where('workspaceId', '==', workspaceId),
      limit(limitCount)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const logs: ActivityLogItem[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ActivityLogItem)
        );
        logs.sort((a, b) => {
          const tA = a.timestamp?.seconds || Date.now() / 1000;
          const tB = b.timestamp?.seconds || Date.now() / 1000;
          return tB - tA;
        });
        callback(logs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async logActivity(
    workspaceId: string,
    action: ActivityAction,
    details: string,
    actor: { id: string; name: string; email: string; avatar?: string },
    targetType?: 'asset' | 'prompt' | 'member' | 'workspace' | 'folder',
    targetId?: string
  ) {
    const path = 'activityLogs';
    try {
      await addDoc(collection(db, path), {
        workspaceId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorAvatar: actor.avatar || '',
        action,
        details,
        targetType: targetType || 'workspace',
        targetId: targetId || '',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  subscribeToUserNotifications(
    userEmail: string,
    callback: (notifications: NotificationItem[]) => void
  ) {
    const path = 'notifications';
    const q = query(collection(db, path), where('recipientEmail', '==', userEmail));

    return onSnapshot(
      q,
      (snapshot) => {
        const notifs: NotificationItem[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as NotificationItem)
        );
        notifs.sort((a, b) => {
          const tA = a.createdAt?.seconds || Date.now() / 1000;
          const tB = b.createdAt?.seconds || Date.now() / 1000;
          return tB - tA;
        });
        callback(notifs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async sendNotification(item: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) {
    const path = 'notifications';
    try {
      await addDoc(collection(db, path), {
        ...item,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async markNotificationAsRead(notificationId: string) {
    const path = `notifications/${notificationId}`;
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async markAllNotificationsAsRead(userEmail: string) {
    const path = 'notifications';
    try {
      const q = query(
        collection(db, path),
        where('recipientEmail', '==', userEmail),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, 'notifications', docSnap.id), { read: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // ==========================================
  // SHARED FOLDERS & PROJECTS
  // ==========================================

  subscribeToWorkspaceFolders(
    workspaceId: string,
    callback: (folders: SharedFolder[]) => void
  ) {
    const path = 'sharedFolders';
    const q = query(collection(db, path), where('workspaceId', '==', workspaceId));

    return onSnapshot(
      q,
      (snapshot) => {
        const folders: SharedFolder[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as SharedFolder)
        );
        callback(folders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async createFolder(
    workspaceId: string,
    name: string,
    description: string,
    actor: { id: string; name: string; email: string }
  ) {
    const path = 'sharedFolders';
    try {
      const docRef = await addDoc(collection(db, path), {
        workspaceId,
        name,
        description,
        assetIds: [],
        createdBy: actor.name,
        createdAt: serverTimestamp(),
      });

      await this.logActivity(
        workspaceId,
        'shared_project',
        `Created shared project folder "${name}"`,
        actor,
        'folder',
        docRef.id
      );

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async addAssetToFolder(workspaceId: string, folderId: string, assetId: string) {
    const path = `sharedFolders/${folderId}`;
    try {
      const folderDoc = await getDoc(doc(db, 'sharedFolders', folderId));
      if (folderDoc.exists()) {
        const currentAssets: string[] = folderDoc.data().assetIds || [];
        if (!currentAssets.includes(assetId)) {
          await updateDoc(doc(db, 'sharedFolders', folderId), {
            assetIds: [...currentAssets, assetId],
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
};
