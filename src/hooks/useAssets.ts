import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { AssetDocument } from '../types';
import { firestoreAssetService } from '../services/firestoreAssetService';
import { backblazeService } from '../services/backblazeService';

export const useAssets = () => {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<AssetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('Newest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Firestore Realtime Subscription
  useEffect(() => {
    if (!user) {
      setAssets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const q = query(
      collection(db, 'generations'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AssetDocument[];

        setAssets(results);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching assets:', err);
        if (err.message.includes('Missing or insufficient permissions')) {
          setError('Permission denied. Please log in or check Firebase Firestore authorized domains.');
        } else {
          setError(err.message || 'Failed to sync asset library from Firestore.');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Extract unique tags across all assets
  const allTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      a.tags?.forEach((t) => set.add(t.toLowerCase()));
    });
    return Array.from(set).sort();
  }, [assets]);

  // Filter and Sort Assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter((asset) => {
        // Search Query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = (asset.fileName || '').toLowerCase().includes(q);
          const matchesPrompt = (asset.prompt || '').toLowerCase().includes(q);
          const matchesModel = (asset.model || '').toLowerCase().includes(q);
          const matchesProvider = (asset.provider || '').toLowerCase().includes(q);
          const matchesWorkflow = (asset.workflowId || '').toLowerCase().includes(q);
          const matchesTag = asset.tags?.some((t) => t.toLowerCase().includes(q));

          if (!matchesName && !matchesPrompt && !matchesModel && !matchesProvider && !matchesWorkflow && !matchesTag) {
            return false;
          }
        }

        // Tag filter
        if (selectedTag) {
          const hasTag = asset.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
          if (!hasTag) return false;
        }

        // Category filter
        switch (activeCategory) {
          case 'Images':
            return asset.type === 'image';
          case 'Videos':
            return asset.type === 'video';
          case 'Audio':
            return asset.type === 'audio';
          case 'Documents':
            return asset.type === 'document';
          case 'Text':
            return asset.type === 'text';
          case 'Favorites':
            return asset.favorite === true;
          case 'All':
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt) || 0;
        const timeB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt) || 0;
        const sizeA = a.fileSize || 0;
        const sizeB = b.fileSize || 0;
        const nameA = a.fileName || a.prompt || '';
        const nameB = b.fileName || b.prompt || '';

        switch (sortOrder) {
          case 'Oldest':
            return timeA - timeB;
          case 'A-Z':
            return nameA.localeCompare(nameB);
          case 'Z-A':
            return nameB.localeCompare(nameA);
          case 'Largest':
            return sizeB - sizeA;
          case 'Smallest':
            return sizeA - sizeB;
          case 'Newest':
          default:
            return timeB - timeA;
        }
      });
  }, [assets, searchQuery, selectedTag, activeCategory, sortOrder]);

  // Selection handlers
  const toggleSelectId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
    }
  }, [selectedIds, filteredAssets]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Operations
  const handleFavoriteToggle = async (asset: AssetDocument) => {
    await firestoreAssetService.toggleFavorite(asset.id, !!asset.favorite);
  };

  const handleDeleteAsset = async (id: string) => {
    const asset = assets.find((a) => a.id === id);
    if (asset?.b2FileId) {
      await backblazeService.deleteFile(asset.b2FileId);
    }
    await firestoreAssetService.deleteAsset(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleRenameAsset = async (asset: AssetDocument, newName: string) => {
    await firestoreAssetService.renameAsset(asset.id, newName);
  };

  const handleDuplicateAsset = async (asset: AssetDocument) => {
    if (user) {
      await firestoreAssetService.duplicateAsset(asset, user.id);
    }
  };

  const handleAddTag = async (id: string, tag: string) => {
    const asset = assets.find((a) => a.id === id);
    if (asset) {
      await firestoreAssetService.addTag(id, tag, (asset.tags as string[]) || []);
    }
  };

  const handleRemoveTag = async (id: string, tag: string) => {
    const asset = assets.find((a) => a.id === id);
    if (asset) {
      await firestoreAssetService.removeTag(id, tag, (asset.tags as string[]) || []);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} assets from Firestore and Backblaze B2?`)) {
      return;
    }
    const ids: string[] = Array.from(selectedIds);
    // Delete B2 files if applicable
    for (const id of ids) {
      const a = assets.find((x) => x.id === id);
      if (a?.b2FileId) {
        await backblazeService.deleteFile(a.b2FileId);
      }
    }
    await firestoreAssetService.bulkDeleteAssets(ids);
    clearSelection();
  };

  const handleBulkFavorite = async () => {
    if (selectedIds.size === 0) return;
    const ids: string[] = Array.from(selectedIds);
    // Mark all as favorite
    await firestoreAssetService.bulkFavoriteAssets(ids, true);
    clearSelection();
  };

  const handleBulkDownload = async () => {
    const selectedAssets = assets.filter((a) => selectedIds.has(a.id));
    for (const a of selectedAssets) {
      const url = a.fileUrl || a.resultUrl || a.b2Url;
      if (url) {
        await backblazeService.downloadFile(url, a.fileName || `asset-${a.id}`);
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  };

  return {
    assets,
    filteredAssets,
    loading,
    error,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    selectedTag,
    setSelectedTag,
    allTags,
    selectedIds,
    toggleSelectId,
    toggleSelectAll,
    clearSelection,
    handleFavoriteToggle,
    handleDeleteAsset,
    handleRenameAsset,
    handleDuplicateAsset,
    handleAddTag,
    handleRemoveTag,
    handleBulkDelete,
    handleBulkFavorite,
    handleBulkDownload,
  };
};
