import { 
  collection, doc, setDoc, updateDoc, getDoc, getDocs, 
  query, where, orderBy, limit, onSnapshot, serverTimestamp, Unsubscribe, deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { projectManagementService } from './projectManagementService';
import { workflowFirestoreService } from './workflowFirestoreService';

export interface AgentTaskDoc {
  id: string;
  agentRunId: string;
  projectId: string;
  userId: string;
  name: string;
  type: string; // 'Research' | 'Content' | 'Prompt Engineering' | 'Image Generation' | 'Video Generation' | 'Audio Generation' | 'Analytics' | 'Document'
  description: string;
  requiredModel?: string;
  dependsOn: string[];
  status: 'pending' | 'running' | 'success' | 'failed';
  selectedModel?: string;
  reason?: string;
  latencyMs?: number;
  cost?: string;
  result?: {
    output?: string;
    outputType?: 'text' | 'image' | 'video' | 'audio';
    mediaUrl?: string;
    assetUrl?: string;
    logs?: string[];
  };
  createdAt: string;
  updatedAt?: string;
}

export interface AgentRunDoc {
  id: string;
  userId: string;
  projectId: string;
  workflowId?: string;
  businessId?: string;
  goal: string;
  summary?: string;
  status: 'Planning' | 'Running' | 'Completed' | 'Failed';
  plan?: {
    summary: string;
    tasks: any[];
    requiredAssets: string[];
    requiredWorkflows: string[];
    requiredAgents: string[];
    estimatedTime: string;
    costEstimate: string;
  };
  totalTasks: number;
  completedTasks: number;
  runningWorkflowsCount: number;
  generatedAssetsCount: number;
  selectedModels: string[];
  totalCost: string;
  executionTimeMs: number;
  createdAt: string;
  updatedAt: string;
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

export const agentService = {
  /**
   * Create new Agent Run in Firestore + Create/Link Project & Workflows + Generate Plan
   */
  async createAgentRun(params: {
    userId: string;
    goal: string;
    projectId?: string;
  }): Promise<{ runDoc: AgentRunDoc; tasks: AgentTaskDoc[] }> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // 1. Generate Real Plan from Backend Gemini Endpoint
    const res = await fetch('/api/agent/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: params.goal })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || err.details || 'Failed to generate agent plan');
    }

    const planData = await res.json();

    // 2. Ensure linked Project in Firestore
    let projectId = params.projectId || '';
    if (!projectId) {
      projectId = await projectManagementService.createProject({
        name: `Agent: ${params.goal.substring(0, 30)}...`,
        description: `Autonomously orchestrated agent run for: "${params.goal}"`
      });
    }

    // 3. Ensure linked Workflow in Firestore
    const workflowId = `wf_agent_${Date.now()}`;
    const workflowTitle = planData.requiredWorkflows?.[0] || `Autonomous Execution Workflow`;
    await workflowFirestoreService.saveWorkflow({
      id: workflowId,
      name: workflowTitle,
      description: `Autonomous execution workflow for goal: "${params.goal.substring(0, 40)}"`,
      nodes: (planData.tasks || []).map((t: any, idx: number) => ({
        id: t.id || `node_${idx}`,
        type: t.type || 'model',
        title: t.name,
        status: 'idle',
        config: { description: t.description, requiredModel: t.requiredModel }
      })),
      edges: [],
      category: 'Agent',
      createdAt: now,
      updatedAt: now,
      userId: params.userId
    });

    // 4. Create Task Docs
    const rawTasks = planData.tasks || [];
    const tasks: AgentTaskDoc[] = rawTasks.map((t: any, idx: number) => ({
      id: t.id || `task_${Date.now()}_${idx}`,
      agentRunId: runId,
      projectId,
      userId: params.userId,
      name: t.name || `Execution Step ${idx + 1}`,
      type: t.type || 'Content',
      description: t.description || '',
      requiredModel: t.requiredModel || '',
      dependsOn: t.dependsOn || [],
      status: 'pending' as const,
      createdAt: now
    }));

    // 5. Build Agent Run Doc
    const runDoc: AgentRunDoc = {
      id: runId,
      userId: params.userId,
      projectId,
      workflowId,
      goal: params.goal,
      summary: planData.summary || `Autonomous plan for "${params.goal}"`,
      status: 'Planning',
      plan: {
        summary: planData.summary || '',
        tasks: rawTasks,
        requiredAssets: planData.requiredAssets || [],
        requiredWorkflows: planData.requiredWorkflows || [workflowTitle],
        requiredAgents: planData.requiredAgents || [],
        estimatedTime: planData.estimatedTime || '2 mins',
        costEstimate: planData.costEstimate || '$0.02'
      },
      totalTasks: tasks.length,
      completedTasks: 0,
      runningWorkflowsCount: 1,
      generatedAssetsCount: 0,
      selectedModels: [],
      totalCost: '$0.0000',
      executionTimeMs: 0,
      createdAt: now,
      updatedAt: now
    };

    // 6. Save to Firestore `agentRuns` and `agentTasks`
    await setDoc(doc(db, 'agentRuns', runId), cleanUndefined(runDoc));

    for (const tDoc of tasks) {
      await setDoc(doc(db, 'agentTasks', tDoc.id), cleanUndefined(tDoc));
    }

    // 7. Log Activity Streams
    this.logActivity(projectId, 'Agent Run Initialized', `Created autonomous execution run for goal: "${params.goal.substring(0, 50)}"`);
    this.logActivity(projectId, 'Workflow Created', `Initialized workflow pipeline "${workflowTitle}"`);

    return { runDoc, tasks };
  },

  /**
   * Execute task using real Model Hub and update Firestore state
   */
  async executeTask(params: {
    runId: string;
    task: AgentTaskDoc;
    goal: string;
    context: Record<string, any>;
    userId: string;
    projectId: string;
  }): Promise<AgentTaskDoc> {
    const startTime = Date.now();
    const taskDocRef = doc(db, 'agentTasks', params.task.id);
    const runDocRef = doc(db, 'agentRuns', params.runId);

    // Update task status to running
    await updateDoc(taskDocRef, {
      status: 'running',
      updatedAt: new Date().toISOString()
    }).catch(() => {});

    // Update agent run status to Running
    await updateDoc(runDocRef, {
      status: 'Running',
      updatedAt: new Date().toISOString()
    }).catch(() => {});

    this.logActivity(params.projectId, 'Task Executing', `Started execution for task: "${params.task.name}"`);

    try {
      const res = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: params.task,
          goal: params.goal,
          context: params.context
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.details || 'Task execution failed');
      }

      const execResult = await res.json();
      const elapsedMs = Date.now() - startTime;

      const updatedTask: AgentTaskDoc = {
        ...params.task,
        status: 'success',
        selectedModel: execResult.selectedModel || params.task.requiredModel || 'gemini-2.5-flash',
        latencyMs: execResult.latencyMs || elapsedMs,
        cost: execResult.cost || '$0.0010',
        result: {
          output: execResult.output,
          outputType: execResult.outputType || 'text',
          mediaUrl: execResult.mediaUrl || execResult.assetUrl || '',
          assetUrl: execResult.mediaUrl || execResult.assetUrl || '',
          logs: execResult.logs || []
        },
        updatedAt: new Date().toISOString()
      };

      // Save task result to Firestore `agentTasks`
      await setDoc(taskDocRef, cleanUndefined(updatedTask), { merge: true });

      // Save generated asset to Firestore `generatedAssets` if mediaUrl or rich output
      if (execResult.output || execResult.mediaUrl) {
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'generatedAssets', assetId), cleanUndefined({
          id: assetId,
          projectId: params.projectId,
          agentRunId: params.runId,
          userId: params.userId,
          title: params.task.name,
          type: execResult.outputType || 'document',
          source: 'AI Agent Mode',
          url: execResult.mediaUrl || execResult.assetUrl || '',
          content: execResult.output || '',
          createdAt: new Date().toISOString()
        }));
        this.logActivity(params.projectId, 'Asset Generated', `Created deliverable asset for task: "${params.task.name}"`);
      }

      // Log Task Completion
      this.logActivity(
        params.projectId, 
        'Task Completed', 
        `Completed task "${params.task.name}" using model ${updatedTask.selectedModel} (${(elapsedMs / 1000).toFixed(1)}s)`
      );

      return updatedTask;
    } catch (err: any) {
      console.error('Task execution error:', err);

      const failedTask: AgentTaskDoc = {
        ...params.task,
        status: 'failed',
        result: {
          output: `Execution Error: ${err.message}`,
          logs: [`[Error] ${err.message}`]
        },
        updatedAt: new Date().toISOString()
      };

      await setDoc(taskDocRef, cleanUndefined(failedTask), { merge: true }).catch(() => {});
      this.logActivity(params.projectId, 'Task Failed', `Task "${params.task.name}" failed: ${err.message}`);

      throw err;
    }
  },

  /**
   * Finalize Run when all tasks finish
   */
  async finalizeRun(params: {
    runId: string;
    projectId: string;
    completedCount: number;
    totalTasks: number;
    tasks: AgentTaskDoc[];
  }) {
    const runDocRef = doc(db, 'agentRuns', params.runId);

    // Calculate total cost and models used
    const modelsSet = new Set<string>();
    let totalCostVal = 0;
    let totalTimeMs = 0;

    params.tasks.forEach(t => {
      if (t.selectedModel) modelsSet.add(t.selectedModel);
      if (t.latencyMs) totalTimeMs += t.latencyMs;
      if (t.cost) {
        const num = parseFloat(t.cost.replace('$', '')) || 0;
        totalCostVal += num;
      }
    });

    const isAllCompleted = params.completedCount >= params.totalTasks;

    const updates = {
      status: isAllCompleted ? 'Completed' : 'Failed',
      completedTasks: params.completedCount,
      generatedAssetsCount: params.tasks.filter(t => t.result?.output || t.result?.mediaUrl).length,
      selectedModels: Array.from(modelsSet),
      totalCost: `$${totalCostVal.toFixed(4)}`,
      executionTimeMs: totalTimeMs,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(runDocRef, updates).catch(() => {});

    if (isAllCompleted) {
      this.logActivity(params.projectId, 'Agent Run Completed', `Goal execution completed successfully across ${params.totalTasks} tasks (${updates.totalCost})`);
    } else {
      this.logActivity(params.projectId, 'Agent Run Halted', `Agent run halted due to task failure.`);
    }
  },

  /**
   * Subscribe to real-time Agent Runs
   */
  subscribeAgentRuns(userId: string | undefined, callback: (runs: AgentRunDoc[]) => void): Unsubscribe {
    const colRef = collection(db, 'agentRuns');
    let q = query(colRef, orderBy('createdAt', 'desc'), limit(30));
    if (userId) {
      q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(30));
    }

    return onSnapshot(q, (snapshot) => {
      const list: AgentRunDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AgentRunDoc);
      });
      callback(list);
    }, (err) => {
      console.warn('subscribeAgentRuns error:', err);
      callback([]);
    });
  },

  /**
   * Subscribe to real-time Agent Tasks for a run
   */
  subscribeAgentTasks(agentRunId: string, callback: (tasks: AgentTaskDoc[]) => void): Unsubscribe {
    if (!agentRunId) {
      callback([]);
      return () => {};
    }

    const colRef = collection(db, 'agentTasks');
    const q = query(colRef, where('agentRunId', '==', agentRunId), orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const list: AgentTaskDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AgentTaskDoc);
      });
      callback(list);
    }, (err) => {
      console.warn('subscribeAgentTasks error:', err);
      callback([]);
    });
  },

  /**
   * Helper to write to activityLogs
   */
  async logActivity(projectId: string, action: string, description: string) {
    if (!projectId) return;
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'activityLogs', logId), cleanUndefined({
        id: logId,
        projectId,
        action,
        description,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Activity log write error:', e);
    }
  },

  /**
   * Delete an agent run and its tasks
   */
  async deleteAgentRun(runId: string) {
    try {
      await deleteDoc(doc(db, 'agentRuns', runId));
      const taskQuery = query(collection(db, 'agentTasks'), where('agentRunId', '==', runId));
      const taskSnaps = await getDocs(taskQuery);
      for (const tSnap of taskSnaps.docs) {
        await deleteDoc(doc(db, 'agentTasks', tSnap.id));
      }
    } catch (e) {
      console.warn('Delete agent run error:', e);
    }
  }
};
