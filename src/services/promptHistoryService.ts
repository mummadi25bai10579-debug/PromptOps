import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { PromptHistoryItem } from '../types';

export function handleHistoryFirestoreError(error: any, operation: string): never {
  console.error(`PromptHistory Firestore operation [${operation}] failed:`, error);
  if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
    throw new Error(`Permission denied during ${operation}. Please verify user authentication.`);
  }
  throw new Error(`Failed to ${operation}: ${error?.message || 'Unknown database error'}`);
}

export const promptHistoryService = {
  /**
   * Create a new prompt history document in Firestore
   */
  async createPrompt(promptData: Omit<PromptHistoryItem, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'generations'), {
        ...promptData,
        favorite: promptData.favorite || false,
        status: promptData.status || 'completed',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleHistoryFirestoreError(error, 'create prompt history item');
    }
  },

  /**
   * Update an existing prompt history item
   */
  async updatePrompt(id: string, updateData: Partial<PromptHistoryItem>): Promise<void> {
    try {
      const docRef = doc(db, 'generations', id);
      await updateDoc(docRef, updateData);
    } catch (error) {
      handleHistoryFirestoreError(error, 'update prompt history item');
    }
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string, currentFavorite: boolean): Promise<boolean> {
    const nextState = !currentFavorite;
    try {
      const docRef = doc(db, 'generations', id);
      await updateDoc(docRef, { favorite: nextState });
      return nextState;
    } catch (error) {
      handleHistoryFirestoreError(error, 'toggle favorite prompt');
    }
  },

  /**
   * Delete single prompt from Firestore
   */
  async deletePrompt(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'generations', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleHistoryFirestoreError(error, 'delete prompt history item');
    }
  },

  /**
   * Duplicate a prompt record for quick iteration
   */
  async duplicatePrompt(item: PromptHistoryItem, userId: string): Promise<string> {
    try {
      const { id, createdAt, ...rest } = item;
      const docRef = await addDoc(collection(db, 'generations'), {
        ...rest,
        userId,
        prompt: `${item.prompt} (Copy)`,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleHistoryFirestoreError(error, 'duplicate prompt history item');
    }
  },

  /**
   * Bulk delete prompts
   */
  async bulkDeletePrompts(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, 'generations', id));
      });
      await batch.commit();
    } catch (error) {
      handleHistoryFirestoreError(error, 'bulk delete prompts');
    }
  },

  /**
   * Bulk favorite prompts
   */
  async bulkFavoritePrompts(ids: string[], favoriteState: boolean): Promise<void> {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.update(doc(db, 'generations', id), { favorite: favoriteState });
      });
      await batch.commit();
    } catch (error) {
      handleHistoryFirestoreError(error, 'bulk favorite prompts');
    }
  }
};
