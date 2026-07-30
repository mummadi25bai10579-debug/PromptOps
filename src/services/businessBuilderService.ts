import { db, auth } from '../firebase/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  Unsubscribe
} from 'firebase/firestore';

export interface BusinessDoc {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
  status: 'planning' | 'generating' | 'active' | 'completed' | 'failed';
  currentStage: string;
}

export interface BusinessPlanDoc {
  id: string;
  businessId: string;
  executiveSummary: string;
  targetAudience: string[];
  valueProposition: string;
  revenueModel: string[];
  competitorAnalysis: Array<{ name: string; strength: string; weakness: string }>;
  brandConcepts: {
    selectedName: string;
    names: Array<{ name: string; tagline: string; selected: boolean }>;
    colorPalette: Array<{ hex: string; label: string }>;
    logoConcept: string;
  };
  marketingStrategy: {
    phases: Array<{ phase: string; title: string; description: string }>;
    assets: Array<{ title: string; type: string; summary: string }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProjectDoc {
  id: string;
  businessId: string;
  name: string;
  description: string;
  status: string;
  workflowIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessWorkflowDoc {
  id: string;
  businessId: string;
  projectId: string;
  name: string;
  type: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed';
  createdAt: string;
}

export interface BusinessAgentTaskDoc {
  id: string;
  businessId: string;
  projectId: string;
  agentName: 'Research Agent' | 'Marketing Agent' | 'Brand Agent' | 'Content Agent' | 'Analytics Agent' | 'CEO Agent' | 'PM Agent';
  taskName: string;
  description: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed';
  resultSummary?: string;
  updatedAt: string;
}

export interface GeneratedAssetDoc {
  id: string;
  businessId: string;
  projectId: string;
  agentTaskId?: string;
  title: string;
  type: 'document' | 'brand_logo' | 'strategy' | 'copy' | 'chart' | 'json';
  summary: string;
  content?: string;
  url?: string;
  createdAt: string;
}

export interface ActivityLogDoc {
  id: string;
  businessId: string;
  action: string;
  details: string;
  actor: string;
  timestamp: string;
}

export interface BusinessAnalyticsDoc {
  id: string;
  businessId: string;
  assetsGenerated: number;
  completedTasks: number;
  totalTasks: number;
  runningWorkflows: number;
  agentRuns: number;
  projectProgress: number;
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

export const businessBuilderService = {
  /**
   * Listen to all user businesses in Firestore
   */
  subscribeBusinesses(callback: (businesses: BusinessDoc[]) => void): Unsubscribe {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest-user';

    const q = query(
      collection(db, 'businesses'),
      where('ownerId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const items: BusinessDoc[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as BusinessDoc);
      });
      // sort by createdAt desc
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    }, (error) => {
      console.warn('Firestore subscribeBusinesses error:', error);
      callback([]);
    });
  },

  /**
   * Listen to specific business plan
   */
  subscribeBusinessPlan(businessId: string, callback: (plan: BusinessPlanDoc | null) => void): Unsubscribe {
    const q = query(
      collection(db, 'businessPlans'),
      where('businessId', '==', businessId)
    );

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        callback({ id: docSnap.id, ...docSnap.data() } as BusinessPlanDoc);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('Firestore subscribeBusinessPlan error:', error);
      callback(null);
    });
  },

  /**
   * Listen to projects linked to a business
   */
  subscribeProjects(businessId: string, callback: (projects: BusinessProjectDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'projects'),
      where('businessId', '==', businessId)
    );

    return onSnapshot(q, (snapshot) => {
      const list: BusinessProjectDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as BusinessProjectDoc);
      });
      callback(list);
    }, (error) => {
      console.warn('Firestore subscribeProjects error:', error);
      callback([]);
    });
  },

  /**
   * Listen to workflows for a business
   */
  subscribeWorkflows(businessId: string, callback: (workflows: BusinessWorkflowDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'workflows'),
      where('businessId', '==', businessId)
    );

    return onSnapshot(q, (snapshot) => {
      const list: BusinessWorkflowDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as BusinessWorkflowDoc);
      });
      callback(list);
    }, (error) => {
      console.warn('Firestore subscribeWorkflows error:', error);
      callback([]);
    });
  },

  /**
   * Listen to agent tasks for a business
   */
  subscribeAgentTasks(businessId: string, callback: (tasks: BusinessAgentTaskDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'agentTasks'),
      where('businessId', '==', businessId)
    );

    return onSnapshot(q, (snapshot) => {
      const list: BusinessAgentTaskDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as BusinessAgentTaskDoc);
      });
      callback(list);
    }, (error) => {
      console.warn('Firestore subscribeAgentTasks error:', error);
      callback([]);
    });
  },

  /**
   * Listen to generated assets for a business
   */
  subscribeGeneratedAssets(businessId: string, callback: (assets: GeneratedAssetDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'generatedAssets'),
      where('businessId', '==', businessId)
    );

    return onSnapshot(q, (snapshot) => {
      const list: GeneratedAssetDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as GeneratedAssetDoc);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    }, (error) => {
      console.warn('Firestore subscribeGeneratedAssets error:', error);
      callback([]);
    });
  },

  /**
   * Listen to activity logs for a business
   */
  subscribeActivityLogs(businessId: string, callback: (logs: ActivityLogDoc[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'activityLogs'),
      where('businessId', '==', businessId)
    );

    return onSnapshot(q, (snapshot) => {
      const list: ActivityLogDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ActivityLogDoc);
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(list);
    }, (error) => {
      console.warn('Firestore subscribeActivityLogs error:', error);
      callback([]);
    });
  },

  /**
   * Listen to analytics for a business
   */
  subscribeAnalytics(businessId: string, callback: (analytics: BusinessAnalyticsDoc | null) => void): Unsubscribe {
    const q = query(
      collection(db, 'analytics'),
      where('businessId', '==', businessId)
    );

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        callback({ id: docSnap.id, ...docSnap.data() } as BusinessAnalyticsDoc);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('Firestore subscribeAnalytics error:', error);
      callback(null);
    });
  },

  /**
   * Write an activity log
   */
  async addActivityLog(businessId: string, action: string, details: string): Promise<void> {
    const user = auth.currentUser;
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logDoc: ActivityLogDoc = {
      id: logId,
      businessId,
      action,
      details,
      actor: user?.displayName || user?.email || 'AI Builder Engine',
      timestamp: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'activityLogs', logId), logDoc);
    } catch (e) {
      console.warn('Failed to add activity log to Firestore:', e);
    }
  },

  /**
   * Delete a business and all linked resources
   */
  async deleteBusiness(businessId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'businesses', businessId));
      // Delete associated docs
      const collectionsToDelete = ['businessPlans', 'projects', 'workflows', 'agentTasks', 'generatedAssets', 'activityLogs', 'analytics'];
      for (const colName of collectionsToDelete) {
        const q = query(collection(db, colName), where('businessId', '==', businessId));
        const snaps = await getDocs(q);
        snaps.forEach(async (d) => {
          await deleteDoc(doc(db, colName, d.id)).catch(() => {});
        });
      }
    } catch (e) {
      console.warn('Failed to delete business:', e);
    }
  },

  /**
   * Main Orchestrator: Generate Business Plan & Build Workflow System
   */
  async createAndBuildBusiness(idea: string): Promise<string> {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest-user';
    const userEmail = user?.email || 'guest@promptops.ai';
    const businessId = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // 1. Create Business Document
    const businessDoc: BusinessDoc = {
      id: businessId,
      title: 'Building Business...',
      description: idea,
      ownerId: userId,
      ownerEmail: userEmail,
      createdAt: now,
      updatedAt: now,
      status: 'generating',
      currentStage: 'Generating Business Plan'
    };
    await setDoc(doc(db, 'businesses', businessId), businessDoc);
    await this.addActivityLog(businessId, 'Business Created', `Started autonomous build for idea: "${idea.substring(0, 60)}..."`);

    try {
      // 2. Call Gemini API to generate structured Business Plan
      const res = await fetch('/api/business/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const generatedData = await res.json();
      const title = generatedData.title || 'New AI Enterprise';

      // Update Business Title
      await setDoc(doc(db, 'businesses', businessId), {
        title,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Store Business Plan output in Firestore
      const planId = `plan_${businessId}`;
      const planDoc: BusinessPlanDoc = {
        id: planId,
        businessId,
        executiveSummary: generatedData.executiveSummary || 'Executive summary generated.',
        targetAudience: generatedData.targetAudience || [],
        valueProposition: generatedData.valueProposition || '',
        revenueModel: generatedData.revenueModel || [],
        competitorAnalysis: generatedData.competitorAnalysis || [],
        brandConcepts: generatedData.brandConcepts || {
          selectedName: title,
          names: [{ name: title, tagline: generatedData.tagline || '', selected: true }],
          colorPalette: [
            { hex: '#4F46E5', label: 'Primary' },
            { hex: '#0F172A', label: 'Background' },
            { hex: '#F8FAFC', label: 'Text' },
            { hex: '#10B981', label: 'Accent' }
          ],
          logoConcept: 'Modern code brackets with initial emblem.'
        },
        marketingStrategy: generatedData.marketingStrategy || { phases: [], assets: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'businessPlans', planId), planDoc);
      await this.addActivityLog(businessId, 'Business Plan Generated', `Generated executive summary, target market, and revenue model for ${title}`);

      // 4. Create Project Automatically
      const projectId = `proj_${businessId}`;
      const projectDoc: BusinessProjectDoc = {
        id: projectId,
        businessId,
        name: `${title} Workspace & Roadmap`,
        description: `Central execution project for ${title}`,
        status: 'Active',
        workflowIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'projects', projectId), projectDoc);
      await this.addActivityLog(businessId, 'Project Created', `Linked Project Workspace "${projectDoc.name}" to business`);

      // 5. Create Workflows Automatically
      const workflowNames = [
        'Market Research Workflow',
        'Branding Workflow',
        'Content Workflow',
        'Marketing Workflow',
        'Launch Workflow'
      ];

      const workflowIds: string[] = [];
      for (const wName of workflowNames) {
        const wId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        workflowIds.push(wId);
        const wfDoc: BusinessWorkflowDoc = {
          id: wId,
          businessId,
          projectId,
          name: wName,
          type: 'Autonomous AI',
          status: 'Pending',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'workflows', wId), cleanUndefined(wfDoc));
      }
      await setDoc(doc(db, 'projects', projectId), { workflowIds }, { merge: true });
      await this.addActivityLog(businessId, 'Workflow Created', `Initialized 5 core execution workflows`);

      // 6. Create Agent Tasks
      const agentTaskList: Array<{
        agentName: 'Research Agent' | 'Brand Agent' | 'Content Agent' | 'Marketing Agent' | 'Analytics Agent';
        taskName: string;
        description: string;
        workflowId: string;
      }> = [
        {
          agentName: 'Research Agent',
          taskName: 'Market Research & Competitor Analysis',
          description: 'Analyze total addressable market, user personas, and competitor strengths/weaknesses',
          workflowId: workflowIds[0]
        },
        {
          agentName: 'Brand Agent',
          taskName: 'Brand Identity & Visual System',
          description: 'Define naming concepts, color palette, tagline, and emblem design',
          workflowId: workflowIds[1]
        },
        {
          agentName: 'Content Agent',
          taskName: 'Content Strategy & Messaging Matrix',
          description: 'Generate launch announcements, value messaging, and 30-day content calendar',
          workflowId: workflowIds[2]
        },
        {
          agentName: 'Marketing Agent',
          taskName: 'Go-To-Market Campaign & Acquisition',
          description: 'Construct multi-phase launch timeline and partner channel playbook',
          workflowId: workflowIds[3]
        },
        {
          agentName: 'Analytics Agent',
          taskName: 'KPI Dashboard & Growth Metrics',
          description: 'Set up conversion tracking targets, viral growth loops, and unit economics',
          workflowId: workflowIds[4]
        }
      ];

      // Save initial Pending tasks in Firestore
      const taskDocsMap: Record<string, string> = {};
      for (const item of agentTaskList) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        taskDocsMap[item.agentName] = taskId;
        const taskDoc: BusinessAgentTaskDoc = {
          id: taskId,
          businessId,
          projectId,
          agentName: item.agentName,
          taskName: item.taskName,
          description: item.description,
          status: 'Pending',
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'agentTasks', taskId), taskDoc);
      }

      // 7. Execute Tasks with Real Status Transitions & Asset Generation
      let completedCount = 0;
      let totalAssets = 0;

      for (let i = 0; i < agentTaskList.length; i++) {
        const item = agentTaskList[i];
        const taskId = taskDocsMap[item.agentName];
        const workflowId = item.workflowId;

        // Mark task and workflow as Running
        await setDoc(doc(db, 'agentTasks', taskId), { status: 'Running', updatedAt: new Date().toISOString() }, { merge: true });
        await setDoc(doc(db, 'workflows', workflowId), { status: 'Running' }, { merge: true });
        await this.addActivityLog(businessId, 'Agent Started', `${item.agentName} started task: "${item.taskName}"`);

        // Generate specific Asset Doc for this agent task
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        let assetTitle = '';
        let assetType: GeneratedAssetDoc['type'] = 'document';
        let assetSummary = '';
        let assetContent = '';

        if (item.agentName === 'Research Agent') {
          assetTitle = `${title} - Competitive Intelligence Matrix`;
          assetType = 'document';
          assetSummary = `Detailed market analysis comparing ${title} against key competitors.`;
          assetContent = JSON.stringify(planDoc.competitorAnalysis, null, 2);
        } else if (item.agentName === 'Brand Agent') {
          assetTitle = `${title} - Brand Identity Kit & Color System`;
          assetType = 'brand_logo';
          assetSummary = `Brand guidelines, primary palette (${planDoc.brandConcepts.colorPalette[0]?.hex}), and logo concept.`;
          assetContent = JSON.stringify(planDoc.brandConcepts, null, 2);
        } else if (item.agentName === 'Content Agent') {
          assetTitle = `${title} - 30-Day Content Launch Playbook`;
          assetType = 'copy';
          assetSummary = 'Content calendar with blog topics, email sequences, and social media posts.';
          assetContent = generatedData.marketingStrategy?.assets?.[1]?.summary || 'Full social batch generated.';
        } else if (item.agentName === 'Marketing Agent') {
          assetTitle = `${title} - Go-To-Market Execution Strategy`;
          assetType = 'strategy';
          assetSummary = '3-phase launch timeline from beta acquisition to viral scaling.';
          assetContent = JSON.stringify(planDoc.marketingStrategy.phases, null, 2);
        } else {
          assetTitle = `${title} - KPI Analytics & Growth Dashboard`;
          assetType = 'chart';
          assetSummary = 'Conversion milestones, viral loop mechanics, and user retention targets.';
          assetContent = 'Target Conversion: 3.5% free-to-paid, CAC: $12, LTV: $180, MoM Growth Target: 25%';
        }

        const assetDoc: GeneratedAssetDoc = {
          id: assetId,
          businessId,
          projectId,
          agentTaskId: taskId,
          title: assetTitle,
          type: assetType,
          summary: assetSummary,
          content: assetContent,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'generatedAssets', assetId), assetDoc);
        totalAssets++;
        await this.addActivityLog(businessId, 'Asset Generated', `Created ${assetType} asset: "${assetTitle}"`);

        // Mark task and workflow as Completed
        completedCount++;
        const summaryText = generatedData.agentOutputs?.[
          item.agentName === 'Research Agent' ? 'researchAgent' :
          item.agentName === 'Brand Agent' ? 'brandAgent' :
          item.agentName === 'Content Agent' ? 'contentAgent' :
          item.agentName === 'Marketing Agent' ? 'marketingAgent' : 'analyticsAgent'
        ]?.summary || 'Task successfully executed.';

        await setDoc(doc(db, 'agentTasks', taskId), {
          status: 'Completed',
          resultSummary: summaryText,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        await setDoc(doc(db, 'workflows', workflowId), { status: 'Completed' }, { merge: true });
        await this.addActivityLog(businessId, 'Agent Finished', `${item.agentName} finished task successfully`);

        // Update real-time analytics document
        const analyticsId = `analytics_${businessId}`;
        const analyticsDoc: BusinessAnalyticsDoc = {
          id: analyticsId,
          businessId,
          assetsGenerated: totalAssets,
          completedTasks: completedCount,
          totalTasks: agentTaskList.length,
          runningWorkflows: agentTaskList.length - completedCount,
          agentRuns: completedCount,
          projectProgress: Math.round((completedCount / agentTaskList.length) * 100),
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'analytics', analyticsId), analyticsDoc);
      }

      // Mark business as active
      await setDoc(doc(db, 'businesses', businessId), {
        status: 'active',
        currentStage: 'Execution Ready',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await this.addActivityLog(businessId, 'Build Completed', `All AI Agents finished! ${title} is ready for execution.`);

      return businessId;
    } catch (error: any) {
      console.error('Failed to create and build business:', error);
      await setDoc(doc(db, 'businesses', businessId), {
        status: 'failed',
        currentStage: 'Build Failed',
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
      await this.addActivityLog(businessId, 'Build Failed', error?.message || 'Error executing AI agents');
      throw error;
    }
  }
};
