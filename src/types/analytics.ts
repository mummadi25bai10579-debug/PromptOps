import { AssetType, GenerationJob } from './index';

export type TimeRangeOption = 'today' | '7d' | '30d' | '90d' | 'custom';

export type AnalyticsFilterState = {
  timeRange: TimeRangeOption;
  customStartDate?: string;
  customEndDate?: string;
  model: string; // 'all' or specific model name
  assetType: AssetType | 'all';
  status: 'all' | 'pending' | 'processing' | 'completed' | 'failed';
};

export type KpiCardData = {
  id: string;
  title: string;
  value: string | number;
  subtext: string;
  change: number; // percentage change e.g. +14.2 or -3.1
  isPositive: boolean;
  type?: AssetType | 'storage' | 'success' | 'failure' | 'favorite' | 'total';
  sparklineData?: number[];
};

export type StorageBreakdownItem = {
  type: AssetType | 'document';
  label: string;
  fileCount: number;
  bytesUsed: number;
  formattedSize: string;
  percentageOfTotal: number;
  avgFileSize: string;
  iconName: string;
  color: string;
};

export type UserInsightsData = {
  mostUsedPrompt: string;
  mostUsedPromptCount: number;
  favoriteModel: string;
  longestPrompt: string;
  longestPromptCharCount: number;
  fastestGenerationTime: string; // e.g. "1.2s"
  largestFileName: string;
  largestFileSize: string;
  mostActiveDay: string; // e.g. "Wednesday"
};

export type ActivityLogItem = {
  id: string;
  action: 'generated' | 'deleted' | 'downloaded' | 'favorited' | 'failed';
  assetType: AssetType;
  title: string;
  promptSnippet: string;
  model: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  fileSizeFormatted?: string;
  resultUrl?: string;
};

export type ExportFormat = 'pdf' | 'csv' | 'json';
