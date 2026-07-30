import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Download,
  Loader2,
  Filter,
  Sparkles,
  BarChart3,
  Cpu,
  RefreshCw,
  SlidersHorizontal,
  X,
  Layers,
} from 'lucide-react';
import { useGenerations } from '../../hooks/useGenerations';
import { AssetType, GenerationJob } from '../../types';
import { AnalyticsFilterState, TimeRangeOption } from '../../types/analytics';
import {
  computeKpiCardData,
  computeStorageBreakdown,
  computeUserInsights,
  computeRecentActivity,
  filterGenerations,
  getAugmentedGenerations,
} from '../../services/analyticsService';
import { OverviewCards } from '../../components/analytics/OverviewCards';
import { AnalyticsCharts } from '../../components/analytics/AnalyticsCharts';
import { StorageAnalytics } from '../../components/analytics/StorageAnalytics';
import { UserInsights } from '../../components/analytics/UserInsights';
import { RecentActivityTimeline } from '../../components/analytics/RecentActivityTimeline';
import { AnalyticsNotifications } from '../../components/analytics/AnalyticsNotifications';
import { ExportReportModal } from '../../components/analytics/ExportReportModal';
import { cn } from '../../utils/cn';

export const Analytics = () => {
  const { generations: rawGenerations, loading, error } = useGenerations();

  // Combine real Firestore generations with smart sample augmentation for rich visualization
  const allGenerations = useMemo(() => {
    return getAugmentedGenerations(rawGenerations);
  }, [rawGenerations]);

  // Filter State
  const [filterState, setFilterState] = useState<AnalyticsFilterState>({
    timeRange: '30d',
    model: 'all',
    assetType: 'all',
    status: 'all',
  });

  const [showCustomDates, setShowCustomDates] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Filtered Generations
  const filteredGenerations = useMemo(() => {
    return filterGenerations(allGenerations, filterState);
  }, [allGenerations, filterState]);

  // Unique model list for filter dropdown
  const uniqueModels = useMemo(() => {
    const set = new Set<string>();
    allGenerations.forEach((g) => {
      if (g.model) set.add(g.model);
    });
    return Array.from(set);
  }, [allGenerations]);

  // Computed Datasets
  const kpiCards = useMemo(() => {
    return computeKpiCardData(filteredGenerations, allGenerations);
  }, [filteredGenerations, allGenerations]);

  const storageBreakdown = useMemo(() => {
    return computeStorageBreakdown(filteredGenerations);
  }, [filteredGenerations]);

  const totalBytesUsed = useMemo(() => {
    return storageBreakdown.reduce((sum, item) => sum + item.bytesUsed, 0);
  }, [storageBreakdown]);

  const userInsights = useMemo(() => {
    return computeUserInsights(filteredGenerations);
  }, [filteredGenerations]);

  const recentActivityLogs = useMemo(() => {
    return computeRecentActivity(filteredGenerations);
  }, [filteredGenerations]);

  // Time Range Quick Switcher
  const handleTimeRangeSelect = (range: TimeRangeOption) => {
    if (range === 'custom') {
      setShowCustomDates(true);
      setFilterState((prev) => ({ ...prev, timeRange: 'custom' }));
    } else {
      setShowCustomDates(false);
      setFilterState((prev) => ({ ...prev, timeRange: range }));
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-16 bg-[#09090B] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Analytics Dashboard</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> PromptOps AI
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            Realtime intelligence into AI generations, model performance, Backblaze storage usage, and tokens.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Analytics Report
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-[#111827]/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
            {(
              [
                { label: 'Today', key: 'today' },
                { label: '7 Days', key: '7d' },
                { label: '30 Days', key: '30d' },
                { label: '90 Days', key: '90d' },
                { label: 'Custom', key: 'custom' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                onClick={() => handleTimeRangeSelect(item.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                  filterState.timeRange === item.key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Secondary Filters: Model, Type, Status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Model Selector */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={filterState.model}
                onChange={(e) => setFilterState((prev) => ({ ...prev, model: e.target.value }))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#111827] text-white">
                  All AI Models
                </option>
                {uniqueModels.map((m) => (
                  <option key={m} value={m} className="bg-[#111827] text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Type Selector */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={filterState.assetType}
                onChange={(e) => setFilterState((prev) => ({ ...prev, assetType: e.target.value as any }))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#111827] text-white">
                  All Asset Types
                </option>
                <option value="image" className="bg-[#111827] text-white">
                  Images
                </option>
                <option value="video" className="bg-[#111827] text-white">
                  Videos
                </option>
                <option value="audio" className="bg-[#111827] text-white">
                  Audio
                </option>
                <option value="text" className="bg-[#111827] text-white">
                  Text / Docs
                </option>
              </select>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={filterState.status}
                onChange={(e) => setFilterState((prev) => ({ ...prev, status: e.target.value as any }))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#111827] text-white">
                  All Statuses
                </option>
                <option value="completed" className="bg-[#111827] text-white">
                  Completed
                </option>
                <option value="failed" className="bg-[#111827] text-white">
                  Failed
                </option>
                <option value="processing" className="bg-[#111827] text-white">
                  Processing
                </option>
              </select>
            </div>

            {/* Clear Filters button if filters active */}
            {(filterState.model !== 'all' || filterState.assetType !== 'all' || filterState.status !== 'all') && (
              <button
                onClick={() =>
                  setFilterState({
                    timeRange: '30d',
                    model: 'all',
                    assetType: 'all',
                    status: 'all',
                  })
                }
                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Pickers if 'custom' range active */}
        {showCustomDates && (
          <div className="pt-3 border-t border-white/10 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Start Date:</span>
              <input
                type="date"
                value={filterState.customStartDate || ''}
                onChange={(e) => setFilterState((prev) => ({ ...prev, customStartDate: e.target.value }))}
                className="bg-black/40 border border-white/10 text-white rounded-lg px-2.5 py-1 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">End Date:</span>
              <input
                type="date"
                value={filterState.customEndDate || ''}
                onChange={(e) => setFilterState((prev) => ({ ...prev, customEndDate: e.target.value }))}
                className="bg-black/40 border border-white/10 text-white rounded-lg px-2.5 py-1 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Realtime System Notifications Banner */}
      <AnalyticsNotifications generations={filteredGenerations} totalBytesUsed={totalBytesUsed} />

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Syncing Firestore & Backblaze B2 analytics...</p>
        </div>
      ) : (
        <>
          {/* KPI Overview Cards */}
          <OverviewCards cardsData={kpiCards} />

          {/* Interactive Recharts Analytics Graphs */}
          <AnalyticsCharts generations={filteredGenerations} />

          {/* Storage Consumption & Breakdown */}
          <StorageAnalytics breakdown={storageBreakdown} totalBytesUsed={totalBytesUsed} />

          {/* AI Intelligence & User Insights */}
          <UserInsights insights={userInsights} />

          {/* Recent Activity Timeline Log */}
          <RecentActivityTimeline activityLogs={recentActivityLogs} />
        </>
      )}

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        generations={filteredGenerations}
      />
    </div>
  );
};
