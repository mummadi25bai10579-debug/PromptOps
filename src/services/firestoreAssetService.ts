import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { AssetDocument } from '../types';

export function handleFirestoreError(error: any, operation: string): never {
  console.error(`Firestore operation [${operation}] failed:`, error);
  if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
    throw new Error(`Permission denied during ${operation}. Please ensure you are authenticated and authorized.`);
  }
  throw new Error(`Failed to ${operation}: ${error?.message || 'Unknown database error'}`);
}

export const firestoreAssetService = {
  /**
   * Create a new asset document in Firestore
   */
  async createAsset(assetData: Omit<AssetDocument, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'generations'), {
        ...assetData,
        tags: assetData.tags || [],
        favorite: assetData.favorite || false,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, 'create asset');
    }
  },

  /**
   * Update an existing asset document
   */
  async updateAsset(id: string, updateData: Partial<AssetDocument>): Promise<void> {
    try {
      const docRef = doc(db, 'generations', id);
      await updateDoc(docRef, updateData);
    } catch (error) {
      handleFirestoreError(error, 'update asset');
    }
  },

  /**
   * Rename an asset (updates fileName field)
   */
  async renameAsset(id: string, newFileName: string): Promise<void> {
    try {
      const docRef = doc(db, 'generations', id);
      await updateDoc(docRef, { fileName: newFileName });
    } catch (error) {
      handleFirestoreError(error, 'rename asset');
    }
  },

  /**
   * Toggle favorite state of an asset
   */
  async toggleFavorite(id: string, currentFavorite: boolean): Promise<boolean> {
    const nextState = !currentFavorite;
    try {
      const docRef = doc(db, 'generations', id);
      await updateDoc(docRef, { favorite: nextState });
      return nextState;
    } catch (error) {
      handleFirestoreError(error, 'toggle favorite');
    }
  },

  /**
   * Add a tag to an asset
   */
  async addTag(id: string, newTag: string, existingTags: string[] = []): Promise<string[]> {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed || existingTags.includes(trimmed)) return existingTags;
    const updated = [...existingTags, trimmed];
    try {
      const docRef = doc(db, 'generations', id);
      await updateDoc(docRef, { tags: updated });
      return updated;
    } catch (error) {
      handleFirestoreError(error, 'add tag');
    }
  },

  /**
   * Remove a tag from an asset
   */
  async removeTag(id: string, tagToRemove: string, existingTags: string[] = []): Promise<string[]> {
    const updated = existingTags.filter(t => t !== tagToRemove);
    try {
      const docRef = doc(db, 'generations', id);
      await updateDoc(docRef, { tags: updated });
      return updated;
    } catch (error) {
      handleFirestoreError(error, 'remove tag');
    }
  },

  /**
   * Delete single asset from Firestore
   */
  async deleteAsset(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'generations', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, 'delete asset');
    }
  },

  /**
   * Duplicate an asset record
   */
  async duplicateAsset(asset: AssetDocument, userId: string): Promise<string> {
    try {
      const { id, createdAt, ...rest } = asset;
      const copyFileName = asset.fileName 
        ? asset.fileName.replace(/(\.[\w]+)$/, '-copy$1') 
        : `${asset.type}-copy-${Date.now()}`;

      const docRef = await addDoc(collection(db, 'generations'), {
        ...rest,
        userId,
        fileName: copyFileName,
        prompt: `${asset.prompt} (Copy)`,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, 'duplicate asset');
    }
  },

  /**
   * Bulk delete assets
   */
  async bulkDeleteAssets(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, 'generations', id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'bulk delete assets');
    }
  },

  /**
   * Bulk toggle favorite
   */
  async bulkFavoriteAssets(ids: string[], favoriteState: boolean): Promise<void> {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.update(doc(db, 'generations', id), { favorite: favoriteState });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'bulk favorite assets');
    }
  }
};
