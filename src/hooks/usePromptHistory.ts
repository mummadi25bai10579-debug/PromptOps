import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { PromptHistoryItem, AssetType } from '../types';
import { promptHistoryService } from '../services/promptHistoryService';
import { exportToCSV, exportToJSON, exportToTXT } from '../utils/exportUtils';
import { useNavigate } from 'react-router-dom';

export type DateFilterType = 'All' | 'Today' | '7Days' | '30Days' | 'Custom';
export type SortOptionType = 'Newest' | 'Oldest' | 'Model' | 'PromptLength';

export const usePromptHistory = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [prompts, setPrompts] = useState<PromptHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Filters State
  const [typeFilter, setTypeFilter] = useState<string>('All'); // 'All' | 'text' | 'image' | 'audio' | 'video'
  const [dateFilter, setDateFilter] = useState<DateFilterType>('All');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOptionType>('Newest');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  // Pagination State
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Firestore Realtime Subscription
  useEffect(() => {
    if (!user) {
      setPrompts([]);
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
        })) as PromptHistoryItem[];

        setPrompts(results);
        setLoading(false);
      },
      (err) => {
        console.error('Error syncing prompt history:', err);
        if (err.message.includes('Missing or insufficient permissions')) {
          setError('Permission denied. Please log in or check your Firebase Firestore authorization.');
        } else {
          setError(err.message || 'Failed to sync prompt history from database.');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Extract unique tags
  const allTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    prompts.forEach((p) => {
      p.tags?.forEach((t) => set.add(t.toLowerCase()));
    });
    return Array.from(set).sort();
  }, [prompts]);

  // Filter and Sort Logic
  const filteredPrompts = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    let startCustomMs = customStartDate ? new Date(customStartDate).getTime() : 0;
    let endCustomMs = customEndDate ? new Date(customEndDate).getTime() + 86400000 : Infinity;

    return prompts
      .filter((item) => {
        // Favorites filter
        if (onlyFavorites && !item.favorite) return false;

        // Type filter
        if (typeFilter !== 'All') {
          if (item.type?.toLowerCase() !== typeFilter.toLowerCase()) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesPrompt = (item.prompt || '').toLowerCase().includes(q);
          const matchesNegPrompt = (item.negativePrompt || '').toLowerCase().includes(q);
          const matchesModel = (item.model || '').toLowerCase().includes(q);
          const matchesType = (item.type || '').toLowerCase().includes(q);
          const matchesTag = item.tags?.some((t) => t.toLowerCase().includes(q));

          if (!matchesPrompt && !matchesNegPrompt && !matchesModel && !matchesType && !matchesTag) {
            return false;
          }
        }

        // Date filter
        const itemTime = item.createdAt?.toMillis 
          ? item.createdAt.toMillis() 
          : (item.createdAt instanceof Date ? item.createdAt.getTime() : typeof item.createdAt === 'number' ? item.createdAt : Date.now());

        if (dateFilter === 'Today' && itemTime < startOfToday) return false;
        if (dateFilter === '7Days' && itemTime < sevenDaysAgo) return false;
        if (dateFilter === '30Days' && itemTime < thirtyDaysAgo) return false;
        if (dateFilter === 'Custom') {
          if (startCustomMs && itemTime < startCustomMs) return false;
          if (endCustomMs && itemTime > endCustomMs) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : typeof a.createdAt === 'number' ? a.createdAt : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : typeof b.createdAt === 'number' ? b.createdAt : 0);
        const lenA = (a.prompt || '').length;
        const lenB = (b.prompt || '').length;
        const modelA = (a.model || '').toLowerCase();
        const modelB = (b.model || '').toLowerCase();

        switch (sortOrder) {
          case 'Oldest':
            return timeA - timeB;
          case 'Model':
            return modelA.localeCompare(modelB);
          case 'PromptLength':
            return lenB - lenA;
          case 'Newest':
          default:
            return timeB - timeA;
        }
      });
  }, [
    prompts, 
    onlyFavorites, 
    typeFilter, 
    searchQuery, 
    dateFilter, 
    customStartDate, 
    customEndDate, 
    sortOrder
  ]);

  // Paginated view subset
  const displayedPrompts = useMemo(() => {
    return filteredPrompts.slice(0, visibleCount);
  }, [filteredPrompts, visibleCount]);

  const hasMore = visibleCount < filteredPrompts.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 12);
  }, []);

  // Selection state helpers
  const toggleSelectId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredPrompts.length && filteredPrompts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPrompts.map((p) => p.id)));
    }
  }, [selectedIds, filteredPrompts]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Item action handlers
  const handleFavoriteToggle = async (item: PromptHistoryItem) => {
    await promptHistoryService.toggleFavorite(item.id, !!item.favorite);
  };

  const handleDelete = async (id: string) => {
    await promptHistoryService.deletePrompt(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDuplicate = async (item: PromptHistoryItem) => {
    if (user) {
      await promptHistoryService.duplicatePrompt(item, user.id);
    }
  };

  const handleCopyPrompt = (promptText: string) => {
    if (promptText) {
      navigator.clipboard.writeText(promptText);
    }
  };

  const handleReusePrompt = (item: PromptHistoryItem) => {
    navigate('/generate', {
      state: {
        initialPrompt: item.prompt,
        initialNegativePrompt: item.negativePrompt,
        initialModel: item.model,
        initialType: item.type,
      },
    });
  };

  const handleGenerateAgain = (item: PromptHistoryItem) => {
    navigate('/generate', {
      state: {
        autoRun: true,
        initialPrompt: item.prompt,
        initialNegativePrompt: item.negativePrompt,
        initialModel: item.model,
        initialType: item.type,
      },
    });
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} prompt items?`)) {
      return;
    }
    const ids: string[] = Array.from(selectedIds);
    await promptHistoryService.bulkDeletePrompts(ids);
    clearSelection();
  };

  const handleBulkFavorite = async () => {
    if (selectedIds.size === 0) return;
    const ids: string[] = Array.from(selectedIds);
    await promptHistoryService.bulkFavoritePrompts(ids, true);
    clearSelection();
  };

  const handleBulkExport = (format: 'json' | 'csv' | 'txt') => {
    const selectedItems = prompts.filter((p) => selectedIds.has(p.id));
    const itemsToExport = selectedItems.length > 0 ? selectedItems : filteredPrompts;

    if (format === 'json') exportToJSON(itemsToExport);
    else if (format === 'csv') exportToCSV(itemsToExport);
    else if (format === 'txt') exportToTXT(itemsToExport);
  };

  const resetFilters = useCallback(() => {
    setTypeFilter('All');
    setDateFilter('All');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchQuery('');
    setSortOrder('Newest');
    setOnlyFavorites(false);
  }, []);

  return {
    prompts,
    filteredPrompts,
    displayedPrompts,
    loading,
    error,
    hasMore,
    loadMore,
    typeFilter,
    setTypeFilter,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    onlyFavorites,
    setOnlyFavorites,
    allTags,
    selectedIds,
    toggleSelectId,
    toggleSelectAll,
    clearSelection,
    handleFavoriteToggle,
    handleDelete,
    handleDuplicate,
    handleCopyPrompt,
    handleReusePrompt,
    handleGenerateAgain,
    handleBulkDelete,
    handleBulkFavorite,
    handleBulkExport,
    resetFilters,
  };
};
