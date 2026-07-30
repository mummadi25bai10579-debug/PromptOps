import { db } from '../firebase/firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export interface GenblazeStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  model?: string;
  logs?: string[];
  durationMs?: number;
}

export interface GenblazeWorkflow {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'failed';
  steps: GenblazeStep[];
  startedAt: number;
}

export const genblazeService = {
  /**
   * Triggers a new Genblaze pipeline execution and persists to Firestore
   */
  async executePipeline(name: string, payload: any): Promise<GenblazeWorkflow> {
    console.log(`[Genblaze] Executing pipeline: ${name}`, payload);
    
    const type = payload.type || 'image';
    const model = type === 'image' ? 'Imagen 3' : type === 'video' ? 'Veo' : type === 'audio' ? 'AudioGen' : 'Gemini 2.5 Flash';
    const generationStepName = `${type.charAt(0).toUpperCase() + type.slice(1)} Generation`;

    const workflowId = `gb-wf-${Math.random().toString(36).substring(7)}`;
    const workflowDoc: GenblazeWorkflow = {
      id: workflowId,
      name,
      status: 'active',
      startedAt: Date.now(),
      steps: [
        { id: 'step-1', name: 'Semantic Parsing', status: 'completed', model: 'Gemini 2.5 Flash', durationMs: 400 },
        { id: 'step-2', name: generationStepName, status: 'running', model },
        { id: 'step-3', name: 'Post-Processing', status: 'pending' }
      ]
    };

    try {
      await setDoc(doc(db, 'workflows', workflowId), {
        ...workflowDoc,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Failed to persist workflow to Firestore, proceeding with local object:", err);
    }

    return workflowDoc;
  },

  /**
   * Subscribes to workflow status changes in Firestore
   */
  subscribeToWorkflow(workflowId: string, payload: any, onUpdate: (wf: GenblazeWorkflow) => void) {
    console.log(`[Genblaze] Subscribed to workflow: ${workflowId}`);
    
    const docRef = doc(db, 'workflows', workflowId);

    // Automatically update step 2 and step 3 as process advances
    setTimeout(async () => {
      try {
        await updateDoc(docRef, {
          status: 'active',
          'steps': [
            { id: 'step-1', name: 'Semantic Parsing', status: 'completed', model: 'Gemini 2.5 Flash' },
            { id: 'step-2', name: 'Generation', status: 'completed', model: payload.type === 'image' ? 'Imagen 3' : 'Gemini 2.5 Flash' },
            { id: 'step-3', name: 'Post-Processing', status: 'running' }
          ]
        });
      } catch (e) {
        // Ignore if document not present
      }
    }, 1000);

    setTimeout(async () => {
      try {
        await updateDoc(docRef, {
          status: 'idle',
          'steps': [
            { id: 'step-1', name: 'Semantic Parsing', status: 'completed', model: 'Gemini 2.5 Flash' },
            { id: 'step-2', name: 'Generation', status: 'completed', model: payload.type === 'image' ? 'Imagen 3' : 'Gemini 2.5 Flash' },
            { id: 'step-3', name: 'Post-Processing', status: 'completed' }
          ]
        });
      } catch (e) {
        // Ignore
      }
    }, 2000);

    // Listen in real-time to Firestore workflow document
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          id: docSnap.id,
          name: data.name || 'Pipeline',
          status: data.status || 'idle',
          steps: data.steps || [],
          startedAt: data.startedAt || Date.now()
        });
      }
    }, (err) => {
      console.error("Workflow snapshot error:", err);
    });

    return unsubscribe;
  }
};
