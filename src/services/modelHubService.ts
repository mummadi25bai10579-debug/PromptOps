import { 
  collection, doc, setDoc, updateDoc, getDoc, getDocs, 
  query, where, orderBy, limit, onSnapshot, serverTimestamp, Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export interface ConfiguredModel {
  id: string;
  name: string;
  provider: string;
  type: string;
  badge: string;
  configured: boolean;
  description: string;
}

export interface TaskRouteResult {
  selectedModel: string;
  reason: string;
  taskType: 'text' | 'image' | 'video' | 'audio';
  contentType: string;
  complexity: string;
  costRequirement: string;
  estimatedCost: string;
  estimatedLatency: string;
}

export interface ModelExecutionDoc {
  id: string;
  userId: string;
  projectId?: string;
  workflowId?: string;
  agentId?: string;
  businessId?: string;
  prompt: string;
  taskType: 'text' | 'image' | 'video' | 'audio';
  contentType?: string;
  complexity?: string;
  selectedModel: string;
  reason?: string;
  status: 'Executing' | 'Completed' | 'Failed';
  output?: string;
  outputType?: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  latencyMs?: number;
  cost?: string;
  error?: string;
  createdAt: string;
}

export interface ModelComparisonResult {
  model: string;
  success: boolean;
  output: string;
  outputType: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  latencyMs: number;
  cost: string;
  error?: string;
}

export interface ModelComparisonDoc {
  id: string;
  userId: string;
  projectId?: string;
  prompt: string;
  models: string[];
  results: ModelComparisonResult[];
  createdAt: string;
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

export const modelHubService = {
  /**
   * Fetch currently configured models from backend
   */
  async getConfiguredModels(): Promise<ConfiguredModel[]> {
    try {
      const res = await fetch('/api/models/configured');
      if (res.ok) {
        const data = await res.json();
        return data.models || [];
      }
    } catch (e) {
      console.warn('Failed to fetch configured models:', e);
    }
    // Default configured models
    return [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', type: 'Multimodal', badge: 'Best Reasoning', configured: true, description: 'Highest capability multimodal reasoning & context.' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', type: 'Multimodal', badge: 'Fastest', configured: true, description: 'Ultra-fast low latency multimodal inference.' },
      { id: 'flux.1', name: 'Flux.1', provider: 'Black Forest Labs', type: 'Image', badge: 'Best Image', configured: true, description: 'Next-gen photorealistic image generation.' },
      { id: 'pollinations-flux', name: 'Pollinations AI', provider: 'Pollinations', type: 'Image', badge: 'High Quality', configured: true, description: 'Fast serverless image generation.' },
      { id: 'ltx-video', name: 'LTX Video', provider: 'Lightricks', type: 'Video', badge: 'Best Video', configured: true, description: 'Cinematic video synthesis engine.' },
      { id: 'elevenlabs', name: 'Neural Speech TTS', provider: 'PromptOps', type: 'Audio', badge: 'Natural Voice', configured: true, description: 'Ultra-realistic text-to-speech audio.' }
    ];
  },

  /**
   * Analyze prompt and route to best model
   */
  async routeTask(prompt: string): Promise<TaskRouteResult> {
    const res = await fetch('/api/models/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to route prompt');
    }
    return res.json();
  },

  /**
   * Execute model task and save full execution metrics to Firestore, Assets & Activity Feed
   */
  async executeModelTask(params: {
    prompt: string;
    model: string;
    taskType?: 'text' | 'image' | 'video' | 'audio';
    reason?: string;
    projectId?: string;
    workflowId?: string;
    agentId?: string;
    businessId?: string;
    userId: string;
  }): Promise<ModelExecutionDoc> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const initialDoc: ModelExecutionDoc = {
      id: executionId,
      userId: params.userId,
      projectId: params.projectId || '',
      workflowId: params.workflowId || '',
      agentId: params.agentId || '',
      businessId: params.businessId || '',
      prompt: params.prompt,
      taskType: params.taskType || 'text',
      selectedModel: params.model,
      reason: params.reason || '',
      status: 'Executing',
      createdAt: now
    };

    // Save initial record in Firestore
    try {
      await setDoc(doc(db, 'modelExecutions', executionId), cleanUndefined(initialDoc));
    } catch (e) {
      console.warn('Firestore initial setDoc failed:', e);
    }

    // Log Activity Start
    if (params.projectId) {
      this.logActivity(params.projectId, 'Task Routed', `Routed task to model ${params.model}`);
    }

    try {
      const res = await fetch('/api/models/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: params.model,
          prompt: params.prompt,
          taskType: params.taskType,
          projectId: params.projectId,
          workflowId: params.workflowId,
          agentId: params.agentId,
          businessId: params.businessId,
          userId: params.userId
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.details || 'Execution failed');
      }

      const result = await res.json();

      const updatedDoc: Partial<ModelExecutionDoc> = {
        status: 'Completed',
        output: result.output || '',
        outputType: result.outputType || 'text',
        mediaUrl: result.mediaUrl || '',
        latencyMs: result.latencyMs || 1000,
        cost: result.cost || '$0.001'
      };

      await updateDoc(doc(db, 'modelExecutions', executionId), cleanUndefined(updatedDoc));

      // Save generated asset to Firestore `generatedAssets` collection
      if (result.output || result.mediaUrl) {
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const assetDoc = {
          id: assetId,
          projectId: params.projectId || '',
          businessId: params.businessId || '',
          workflowId: params.workflowId || '',
          agentId: params.agentId || '',
          userId: params.userId,
          title: `Generated Output (${params.model})`,
          type: result.outputType || 'document',
          source: 'Model Router',
          url: result.mediaUrl || '',
          content: result.output || '',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'generatedAssets', assetId), cleanUndefined(assetDoc));
      }

      // Log Activity Completion
      if (params.projectId) {
        this.logActivity(
          params.projectId, 
          'Generation Completed', 
          `Model ${params.model} completed execution in ${(result.latencyMs / 1000).toFixed(1)}s (${result.cost})`
        );
      }

      return {
        ...initialDoc,
        ...updatedDoc
      } as ModelExecutionDoc;

    } catch (err: any) {
      console.error('Model execution error:', err);
      const failedDoc: Partial<ModelExecutionDoc> = {
        status: 'Failed',
        error: err.message || 'Execution error'
      };
      await updateDoc(doc(db, 'modelExecutions', executionId), cleanUndefined(failedDoc)).catch(() => {});

      if (params.projectId) {
        this.logActivity(params.projectId, 'Generation Failed', `Model ${params.model} execution failed: ${err.message}`);
      }

      throw err;
    }
  },

  /**
   * Run comparison across multiple models
   */
  async compareModels(params: {
    prompt: string;
    models: string[];
    projectId?: string;
    userId: string;
  }): Promise<ModelComparisonDoc> {
    const comparisonId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await fetch('/api/models/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: params.prompt,
        models: params.models,
        projectId: params.projectId,
        userId: params.userId
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to compare models');
    }

    const data = await res.json();
    const comparisonDoc: ModelComparisonDoc = {
      id: comparisonId,
      userId: params.userId,
      projectId: params.projectId || '',
      prompt: params.prompt,
      models: params.models,
      results: data.results || [],
      createdAt: new Date().toISOString()
    };

    // Save comparison to Firestore
    try {
      await setDoc(doc(db, 'modelComparisons', comparisonId), cleanUndefined(comparisonDoc));
    } catch (e) {
      console.warn('Failed to save comparison to Firestore:', e);
    }

    // Save individual execution logs for each result in Firestore
    for (const resItem of comparisonDoc.results) {
      if (resItem.success) {
        const execId = `exec_comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const execDoc: ModelExecutionDoc = {
          id: execId,
          userId: params.userId,
          projectId: params.projectId || '',
          prompt: params.prompt,
          taskType: resItem.outputType || 'text',
          selectedModel: resItem.model,
          reason: 'Model Comparison Run',
          status: 'Completed',
          output: resItem.output,
          outputType: resItem.outputType,
          mediaUrl: resItem.mediaUrl,
          latencyMs: resItem.latencyMs,
          cost: resItem.cost,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'modelExecutions', execId), cleanUndefined(execDoc)).catch(() => {});
      }
    }

    return comparisonDoc;
  },

  /**
   * Subscribe to real-time model executions from Firestore
   */
  subscribeExecutions(userId: string | undefined, callback: (docs: ModelExecutionDoc[]) => void): Unsubscribe {
    const colRef = collection(db, 'modelExecutions');
    let q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    if (userId) {
      q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(50));
    }

    return onSnapshot(q, (snapshot) => {
      const list: ModelExecutionDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ModelExecutionDoc);
      });
      callback(list);
    }, (error) => {
      console.warn('modelExecutions subscription error:', error);
      callback([]);
    });
  },

  /**
   * Helper to log activity to Firestore
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
      console.warn('Activity log error:', e);
    }
  }
};
