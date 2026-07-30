import { db, auth } from '../firebase/firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { WorkflowDefinition, WorkflowRun } from '../types/workflow';

const WORKFLOWS_COLLECTION = 'workflows';
const WORKFLOW_RUNS_COLLECTION = 'workflow_runs';

export const workflowFirestoreService = {
  /**
   * Saves or updates a workflow in Firestore (with localStorage fallback)
   */
  async saveWorkflow(workflow: WorkflowDefinition): Promise<void> {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest-user';
    const cleanWorkflow: WorkflowDefinition = {
      ...workflow,
      userId,
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage
    try {
      const localWorkflows = JSON.parse(localStorage.getItem('promptops_workflows') || '[]');
      const index = localWorkflows.findIndex((w: any) => w.id === cleanWorkflow.id);
      if (index >= 0) {
        localWorkflows[index] = cleanWorkflow;
      } else {
        localWorkflows.push(cleanWorkflow);
      }
      localStorage.setItem('promptops_workflows', JSON.stringify(localWorkflows));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // Save to Firestore if available
    try {
      const docRef = doc(db, WORKFLOWS_COLLECTION, cleanWorkflow.id);
      await setDoc(docRef, cleanWorkflow, { merge: true });
    } catch (e) {
      console.warn('Firestore workflow save failed:', e);
    }
  },

  /**
   * Fetches saved workflows for current user
   */
  async getUserWorkflows(): Promise<WorkflowDefinition[]> {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest-user';

    const localWorkflows: WorkflowDefinition[] = JSON.parse(localStorage.getItem('promptops_workflows') || '[]');

    try {
      const q = query(
        collection(db, WORKFLOWS_COLLECTION),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const firestoreWorkflows: WorkflowDefinition[] = [];
      querySnapshot.forEach(docSnap => {
        firestoreWorkflows.push(docSnap.data() as WorkflowDefinition);
      });

      if (firestoreWorkflows.length > 0) {
        return firestoreWorkflows;
      }
    } catch (e) {
      console.warn('Firestore get workflows failed:', e);
    }

    return localWorkflows;
  },

  /**
   * Deletes a workflow by ID
   */
  async deleteWorkflow(id: string): Promise<void> {
    try {
      const localWorkflows = JSON.parse(localStorage.getItem('promptops_workflows') || '[]');
      const filtered = localWorkflows.filter((w: any) => w.id !== id);
      localStorage.setItem('promptops_workflows', JSON.stringify(filtered));
    } catch (e) {}

    try {
      await deleteDoc(doc(db, WORKFLOWS_COLLECTION, id));
    } catch (e) {}
  },

  /**
   * Saves a completed/failed Workflow Run history item
   */
  async saveWorkflowRun(run: WorkflowRun): Promise<void> {
    const user = auth.currentUser;
    const cleanRun = {
      ...run,
      userId: user?.uid || 'guest-user'
    };

    // Save to LocalStorage
    try {
      const localRuns = JSON.parse(localStorage.getItem('promptops_workflow_runs') || '[]');
      localRuns.unshift(cleanRun);
      localStorage.setItem('promptops_workflow_runs', JSON.stringify(localRuns.slice(0, 50)));
    } catch (e) {}

    // Save to Firestore
    try {
      const docRef = doc(db, WORKFLOW_RUNS_COLLECTION, cleanRun.id);
      await setDoc(docRef, cleanRun);
    } catch (e) {
      console.warn('Firestore run save failed:', e);
    }
  },

  /**
   * Fetches workflow execution history runs
   */
  async getWorkflowRuns(): Promise<WorkflowRun[]> {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest-user';

    const localRuns: WorkflowRun[] = JSON.parse(localStorage.getItem('promptops_workflow_runs') || '[]');

    try {
      const q = query(
        collection(db, WORKFLOW_RUNS_COLLECTION),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const firestoreRuns: WorkflowRun[] = [];
      querySnapshot.forEach(docSnap => {
        firestoreRuns.push(docSnap.data() as WorkflowRun);
      });

      if (firestoreRuns.length > 0) {
        return firestoreRuns.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      }
    } catch (e) {
      console.warn('Firestore get runs failed:', e);
    }

    return localRuns;
  }
};
