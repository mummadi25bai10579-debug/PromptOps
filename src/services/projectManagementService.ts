import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';

export interface ProjectDoc {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerEmail: string;
  status: 'active' | 'planning' | 'completed' | 'on_hold';
  progress: number;
  businessId?: string;
  workflowIds?: string[];
  agentTaskIds?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface ProjectTaskDoc {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Completed' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignee: string;
  assignedType: 'user' | 'agent';
  agentName?: string;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
}

export interface ProjectWorkflowDoc {
  id: string;
  projectId: string;
  businessId?: string;
  name: string;
  type: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed';
  createdAt: any;
}

export interface ProjectWorkflowRunDoc {
  id: string;
  projectId: string;
  workflowId: string;
  workflowName: string;
  status: 'Running' | 'Completed' | 'Failed';
  logs: string[];
  startedAt: any;
  completedAt?: any;
}

export interface ProjectAgentTaskDoc {
  id: string;
  projectId: string;
  businessId?: string;
  agentName: 'Research Agent' | 'Marketing Agent' | 'Content Agent' | 'Analytics Agent';
  taskName: string;
  description: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed';
  resultSummary?: string;
  updatedAt: any;
}

export interface ProjectAssetDoc {
  id: string;
  projectId: string;
  businessId?: string;
  title: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'brand_logo' | 'chart' | 'strategy' | 'copy';
  source: 'Backblaze B2' | 'Firestore' | 'AI Studio';
  url?: string;
  summary: string;
  content?: string;
  createdAt: any;
}

export interface ProjectActivityDoc {
  id: string;
  projectId: string;
  action: string;
  details: string;
  actor: string;
  timestamp: any;
}

export interface WorkspaceDashboardStats {
  activeProjects: number;
  completedProjects: number;
  totalProjects: number;
  tasksDue: number;
  totalTasks: number;
  workflowRuns: number;
  agentRuns: number;
  assetsGenerated: number;
}

function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned as T;
}

export const projectManagementService = {
  /**
   * Subscribe to all projects owned by or visible to the user
   */
  subscribeProjects(callback: (projects: ProjectDoc[]) => void): Unsubscribe {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest-user';

    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const results: ProjectDoc[] = [];
      snapshot.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...docSnap.data() } as ProjectDoc);
      });

      // Sort desc by createdAt
      results.sort((a, b) => {
        const timeA = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      callback(results);
    }, (error) => {
      console.warn('Error subscribing to projects:', error);
      callback([]);
    });
  },

  /**
   * Subscribe to single project detail
   */
  subscribeProjectDetail(projectId: string, callback: (project: ProjectDoc | null) => void): Unsubscribe {
    const docRef = doc(db, 'projects', projectId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as ProjectDoc);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('Error subscribing to project detail:', error);
      callback(null);
    });
  },

  /**
   * Subscribe to project tasks from `projectTasks` collection
   */
  subscribeProjectTasks(projectId: string, callback: (tasks: ProjectTaskDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'projectTasks'),
      where('projectId', '==', projectId)
    );

    return onSnapshot(q, (snapshot) => {
      const tasks: ProjectTaskDoc[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...docSnap.data() } as ProjectTaskDoc);
      });

      tasks.sort((a, b) => {
        const timeA = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      callback(tasks);
    }, (error) => {
      console.warn('Error subscribing to project tasks:', error);
      callback([]);
    });
  },

  /**
   * Subscribe to project workflows from `workflows` collection
   */
  subscribeProjectWorkflows(projectId: string, callback: (workflows: ProjectWorkflowDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'workflows'),
      where('projectId', '==', projectId)
    );

    return onSnapshot(q, (snapshot) => {
      const list: ProjectWorkflowDoc[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ProjectWorkflowDoc);
      });
      callback(list);
    }, (error) => {
      console.warn('Error subscribing to project workflows:', error);
      callback([]);
    });
  },

  /**
   * Subscribe to workflow runs from `workflowRuns` collection
   */
  subscribeProjectWorkflowRuns(projectId: string, callback: (runs: ProjectWorkflowRunDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'workflowRuns'),
      where('projectId', '==', projectId)
    );

    return onSnapshot(q, (snapshot) => {
      const runs: ProjectWorkflowRunDoc[] = [];
      snapshot.forEach((docSnap) => {
        runs.push({ id: docSnap.id, ...docSnap.data() } as ProjectWorkflowRunDoc);
      });
      runs.sort((a, b) => {
        const timeA = new Date(a.startedAt?.seconds ? a.startedAt.seconds * 1000 : a.startedAt || 0).getTime();
        const timeB = new Date(b.startedAt?.seconds ? b.startedAt.seconds * 1000 : b.startedAt || 0).getTime();
        return timeB - timeA;
      });
      callback(runs);
    }, (error) => {
      console.warn('Error subscribing to workflow runs:', error);
      callback([]);
    });
  },

  /**
   * Subscribe to agent tasks from `agentTasks` collection
   */
  subscribeProjectAgentTasks(projectId: string, callback: (agentTasks: ProjectAgentTaskDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'agentTasks'),
      where('projectId', '==', projectId)
    );

    return onSnapshot(q, (snapshot) => {
      const tasks: ProjectAgentTaskDoc[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...docSnap.data() } as ProjectAgentTaskDoc);
      });
      callback(tasks);
    }, (error) => {
      console.warn('Error subscribing to agent tasks:', error);
      callback([]);
    });
  },

  /**
   * Subscribe to assets from `generatedAssets` collection
   */
  subscribeProjectAssets(projectId: string, callback: (assets: ProjectAssetDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'generatedAssets'),
      where('projectId', '==', projectId)
    );

    return onSnapshot(q, (snapshot) => {
      const assets: ProjectAssetDoc[] = [];
      snapshot.forEach((docSnap) => {
        assets.push({ id: docSnap.id, ...docSnap.data() } as ProjectAssetDoc);
      });
      assets.sort((a, b) => {
        const timeA = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      callback(assets);
    }, (error) => {
      console.warn('Error subscribing to project assets:', error);
      callback([]);
    });
  },

  /**
   * Subscribe to activity logs for a project
   */
  subscribeProjectActivities(projectId: string, callback: (activities: ProjectActivityDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'activityLogs'),
      where('projectId', '==', projectId)
    );

    return onSnapshot(q, (snapshot) => {
      const activities: ProjectActivityDoc[] = [];
      snapshot.forEach((docSnap) => {
        activities.push({ id: docSnap.id, ...docSnap.data() } as ProjectActivityDoc);
      });
      activities.sort((a, b) => {
        const timeA = new Date(a.timestamp?.seconds ? a.timestamp.seconds * 1000 : a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp?.seconds ? b.timestamp.seconds * 1000 : b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      callback(activities);
    }, (error) => {
      console.warn('Error subscribing to project activities:', error);
      callback([]);
    });
  },

  /**
   * Subscribe to top dashboard statistics calculated across user's Firestore workspace
   */
  subscribeDashboardStats(callback: (stats: WorkspaceDashboardStats) => void): Unsubscribe {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest-user';

    const qProj = query(collection(db, 'projects'), where('ownerId', '==', userId));

    return onSnapshot(qProj, (snapshot) => {
      (async () => {
        try {
          const projects: ProjectDoc[] = [];
          snapshot.forEach(d => projects.push({ id: d.id, ...d.data() } as ProjectDoc));

          const activeProjects = projects.filter(p => p.status !== 'completed').length;
          const completedProjects = projects.filter(p => p.status === 'completed').length;
          const totalProjects = projects.length;

          let totalTasks = 0;
          let tasksDue = 0;
          let workflowRuns = 0;
          let agentRuns = 0;
          let assetsGenerated = 0;

          // Query sub-collections across user's projects
          if (projects.length > 0) {
            const projectIds = projects.map(p => p.id);
            
            // Tasks count
            try {
              const tasksSnap = await getDocs(collection(db, 'projectTasks'));
              tasksSnap.forEach(d => {
                const data = d.data();
                if (projectIds.includes(data.projectId)) {
                  totalTasks++;
                  if (data.status !== 'Completed') tasksDue++;
                }
              });
            } catch (e) {
              console.warn('Dashboard stats task query error:', e);
            }

            // Workflow runs count
            try {
              const wfSnap = await getDocs(collection(db, 'workflowRuns'));
              wfSnap.forEach(d => {
                if (projectIds.includes(d.data().projectId)) workflowRuns++;
              });
            } catch (e) {}

            // Agent tasks count
            try {
              const agentSnap = await getDocs(collection(db, 'agentTasks'));
              agentSnap.forEach(d => {
                if (projectIds.includes(d.data().projectId)) agentRuns++;
              });
            } catch (e) {}

            // Assets count
            try {
              const assetsSnap = await getDocs(collection(db, 'generatedAssets'));
              assetsSnap.forEach(d => {
                if (projectIds.includes(d.data().projectId)) assetsGenerated++;
              });
            } catch (e) {}
          }

          callback({
            activeProjects,
            completedProjects,
            totalProjects,
            tasksDue,
            totalTasks,
            workflowRuns,
            agentRuns,
            assetsGenerated
          });
        } catch (err) {
          console.warn('Dashboard stats calculation error:', err);
        }
      })();
    }, (error) => {
      console.warn('Dashboard stats error:', error);
      callback({
        activeProjects: 0,
        completedProjects: 0,
        totalProjects: 0,
        tasksDue: 0,
        totalTasks: 0,
        workflowRuns: 0,
        agentRuns: 0,
        assetsGenerated: 0
      });
    });
  },

  /**
   * Log activity in Firestore
   */
  async logActivity(projectId: string, action: string, details: string): Promise<void> {
    const user = auth.currentUser;
    const logId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const activityDoc: ProjectActivityDoc = {
      id: logId,
      projectId,
      action,
      details,
      actor: user?.displayName || user?.email || 'AI Project Manager',
      timestamp: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'activityLogs', logId), cleanUndefined(activityDoc));
    } catch (e) {
      console.warn('Failed to log project activity:', e);
    }
  },

  /**
   * Create a new Project in Firestore
   */
  async createProject(data: { name: string; description: string; businessId?: string }): Promise<string> {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest-user';
    const userEmail = user?.email || 'guest@promptops.ai';
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const projectDoc: ProjectDoc = {
      id: projectId,
      name: data.name,
      description: data.description,
      ownerId: userId,
      ownerEmail: userEmail,
      status: 'active',
      progress: 0,
      businessId: data.businessId || '',
      workflowIds: [],
      agentTaskIds: [],
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(db, 'projects', projectId), cleanUndefined(projectDoc));
    await this.logActivity(projectId, 'Project Created', `Created new project "${data.name}"`);

    // Create 3 default starter tasks
    const starterTasks = [
      {
        title: 'Project Kickoff & Requirements Analysis',
        description: 'Define core deliverables, timelines, and agent task assignments.',
        status: 'In Progress' as const,
        priority: 'High' as const,
        assignee: 'Research Agent',
        assignedType: 'agent' as const,
        agentName: 'Research Agent'
      },
      {
        title: 'Brand Identity & Visual Asset Generation',
        description: 'Generate color schemes, logo concepts, and UI components.',
        status: 'Todo' as const,
        priority: 'Medium' as const,
        assignee: 'Marketing Agent',
        assignedType: 'agent' as const,
        agentName: 'Marketing Agent'
      },
      {
        title: 'Content Strategy & Launch Copywriting',
        description: 'Draft launch announcements, user onboarding guides, and promotional copy.',
        status: 'Todo' as const,
        priority: 'Medium' as const,
        assignee: 'Content Agent',
        assignedType: 'agent' as const,
        agentName: 'Content Agent'
      }
    ];

    for (const st of starterTasks) {
      await this.createTask(projectId, st);
    }

    // Initialize standard workflow for this project
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const wfDoc: ProjectWorkflowDoc = {
      id: workflowId,
      projectId,
      businessId: data.businessId || '',
      name: `${data.name} Core Execution Pipeline`,
      type: 'Autonomous AI',
      status: 'Pending',
      createdAt: now
    };
    await setDoc(doc(db, 'workflows', workflowId), cleanUndefined(wfDoc));
    await updateDoc(doc(db, 'projects', projectId), { workflowIds: [workflowId] });

    return projectId;
  },

  /**
   * Update Project Status
   */
  async updateProjectStatus(projectId: string, status: ProjectDoc['status']): Promise<void> {
    await updateDoc(doc(db, 'projects', projectId), {
      status,
      updatedAt: new Date().toISOString()
    });
    await this.logActivity(projectId, 'Project Status Updated', `Status changed to ${status.toUpperCase()}`);
  },

  /**
   * Delete Project and associated items
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      const collections = ['projectTasks', 'workflows', 'workflowRuns', 'agentTasks', 'generatedAssets', 'activityLogs'];
      for (const col of collections) {
        const q = query(collection(db, col), where('projectId', '==', projectId));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await deleteDoc(doc(db, col, d.id)).catch(() => {});
        });
      }
    } catch (e) {
      console.warn('Failed to delete project:', e);
    }
  },

  /**
   * Recalculate Project Progress based on Tasks
   */
  async recalculateProjectProgress(projectId: string): Promise<number> {
    try {
      const q = query(collection(db, 'projectTasks'), where('projectId', '==', projectId));
      const snap = await getDocs(q);
      let total = 0;
      let completed = 0;
      snap.forEach((d) => {
        total++;
        if (d.data().status === 'Completed') completed++;
      });

      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      const status = progress === 100 ? 'completed' : 'active';

      await updateDoc(doc(db, 'projects', projectId), {
        progress,
        status,
        updatedAt: new Date().toISOString()
      });

      return progress;
    } catch (e) {
      console.warn('Failed to recalculate progress:', e);
      return 0;
    }
  },

  /**
   * Task Management
   */
  async createTask(
    projectId: string, 
    task: Omit<ProjectTaskDoc, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const taskDoc: ProjectTaskDoc = {
      id: taskId,
      projectId,
      ...task,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(db, 'projectTasks', taskId), cleanUndefined(taskDoc));
    await this.logActivity(projectId, 'Task Created', `Created task "${task.title}" assigned to ${task.assignee}`);
    await this.recalculateProjectProgress(projectId);

    return taskId;
  },

  async updateTaskStatus(projectId: string, taskId: string, newStatus: ProjectTaskDoc['status']): Promise<void> {
    const updates: any = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    if (newStatus === 'Completed') {
      updates.completedAt = new Date().toISOString();
    }

    await updateDoc(doc(db, 'projectTasks', taskId), cleanUndefined(updates));
    await this.logActivity(projectId, 'Task Updated', `Updated task status to ${newStatus}`);
    await this.recalculateProjectProgress(projectId);
  },

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'projectTasks', taskId));
    await this.logActivity(projectId, 'Task Deleted', `Removed task ${taskId}`);
    await this.recalculateProjectProgress(projectId);
  },

  /**
   * Execute Workflow Run
   */
  async triggerWorkflowRun(projectId: string, workflowId: string, workflowName: string): Promise<string> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const runDoc: ProjectWorkflowRunDoc = {
      id: runId,
      projectId,
      workflowId,
      workflowName,
      status: 'Running',
      logs: [
        `[${new Date().toLocaleTimeString()}] Workflow initialized...`,
        `[${new Date().toLocaleTimeString()}] Validating input schemas & model parameters...`,
        `[${new Date().toLocaleTimeString()}] Executing autonomous step 1...`
      ],
      startedAt: now
    };

    await setDoc(doc(db, 'workflowRuns', runId), cleanUndefined(runDoc));
    await updateDoc(doc(db, 'workflows', workflowId), { status: 'Running' });
    await this.logActivity(projectId, 'Workflow Started', `Started workflow "${workflowName}"`);

    // Simulate completion after execution
    setTimeout(async () => {
      await updateDoc(doc(db, 'workflowRuns', runId), {
        status: 'Completed',
        completedAt: new Date().toISOString(),
        logs: [
          ...runDoc.logs,
          `[${new Date().toLocaleTimeString()}] Autonomous step 1 complete.`,
          `[${new Date().toLocaleTimeString()}] Workflow output generated successfully.`,
          `[${new Date().toLocaleTimeString()}] Workflow completed with 0 errors.`
        ]
      });
      await updateDoc(doc(db, 'workflows', workflowId), { status: 'Completed' });
      await projectManagementService.logActivity(projectId, 'Workflow Completed', `Completed workflow "${workflowName}"`);
    }, 2500);

    return runId;
  },

  /**
   * Execute AI Agent Action
   */
  async triggerAgentExecution(
    projectId: string, 
    agentName: 'Research Agent' | 'Marketing Agent' | 'Content Agent' | 'Analytics Agent',
    taskDescription: string
  ): Promise<void> {
    const taskId = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const agentTaskDoc: ProjectAgentTaskDoc = {
      id: taskId,
      projectId,
      agentName,
      taskName: `${agentName} Action`,
      description: taskDescription,
      status: 'Running',
      updatedAt: now
    };

    await setDoc(doc(db, 'agentTasks', taskId), cleanUndefined(agentTaskDoc));
    await this.logActivity(projectId, 'Agent Started', `${agentName} launched task: "${taskDescription}"`);

    // Call Gemini backend or generate output doc
    setTimeout(async () => {
      const summaryText = `Executed ${agentName} analysis on: "${taskDescription}". Detailed deliverables stored in Project Assets.`;
      
      await updateDoc(doc(db, 'agentTasks', taskId), {
        status: 'Completed',
        resultSummary: summaryText,
        updatedAt: new Date().toISOString()
      });

      // Add corresponding Generated Asset
      const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const assetDoc: ProjectAssetDoc = {
        id: assetId,
        projectId,
        title: `${agentName} Output - ${taskDescription.substring(0, 30)}...`,
        type: agentName === 'Research Agent' ? 'document' :
              agentName === 'Marketing Agent' ? 'strategy' :
              agentName === 'Content Agent' ? 'copy' : 'chart',
        source: 'AI Studio',
        summary: summaryText,
        content: `Comprehensive ${agentName} report generated at ${new Date().toLocaleString()}.\n\nExecutive Summary:\nTarget goals achieved with 100% precision. Validated against market benchmarks and project constraints.`,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'generatedAssets', assetId), cleanUndefined(assetDoc));
      await projectManagementService.logActivity(projectId, 'Agent Completed', `${agentName} completed task and generated asset`);
      await projectManagementService.logActivity(projectId, 'Asset Generated', `Created ${assetDoc.type} asset "${assetDoc.title}"`);
    }, 3000);
  },

  /**
   * Add Custom Asset (Document, Video, Audio, Backblaze B2, etc)
   */
  async addProjectAsset(
    projectId: string, 
    asset: Omit<ProjectAssetDoc, 'id' | 'projectId' | 'createdAt'>
  ): Promise<string> {
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const assetDoc: ProjectAssetDoc = {
      id: assetId,
      projectId,
      ...asset,
      createdAt: now
    };

    await setDoc(doc(db, 'generatedAssets', assetId), cleanUndefined(assetDoc));
    await this.logActivity(projectId, 'Asset Generated', `Added asset "${asset.title}" (${asset.source})`);

    return assetId;
  }
};
