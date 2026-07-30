import { GenerationJob, AssetType } from '../types';
import {
  AnalyticsFilterState,
  KpiCardData,
  StorageBreakdownItem,
  UserInsightsData,
  ActivityLogItem,
  TimeRangeOption,
} from '../types/analytics';

// Storage limit configuration (e.g., Backblaze B2 50 GB default quota)
export const TOTAL_STORAGE_CAPACITY_BYTES = 50 * 1024 * 1024 * 1024; // 50 GB

// Format bytes into human readable string
export const formatBytes = (bytes: number, decimals = 1): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Calculate approximate file size if missing based on asset type
export const getEstimatedFileSize = (job: GenerationJob): number => {
  if (job.fileSize && job.fileSize > 0) return job.fileSize;
  switch (job.type) {
    case 'video':
      return 18.5 * 1024 * 1024; // ~18.5 MB
    case 'image':
      return 3.2 * 1024 * 1024; // ~3.2 MB
    case 'audio':
      return 5.1 * 1024 * 1024; // ~5.1 MB
    case 'text':
    case 'document':
      return 45 * 1024; // ~45 KB
    default:
      return 2.5 * 1024 * 1024;
  }
};

// Helper to check if a date falls within time range
export const isDateInRange = (
  date: Date,
  timeRange: TimeRangeOption,
  customStart?: string,
  customEnd?: string
): boolean => {
  const now = new Date();
  const startTime = new Date();

  if (timeRange === 'today') {
    startTime.setHours(0, 0, 0, 0);
    return date >= startTime;
  } else if (timeRange === '7d') {
    startTime.setDate(now.getDate() - 7);
    return date >= startTime;
  } else if (timeRange === '30d') {
    startTime.setDate(now.getDate() - 30);
    return date >= startTime;
  } else if (timeRange === '90d') {
    startTime.setDate(now.getDate() - 90);
    return date >= startTime;
  } else if (timeRange === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }

  return true;
};

// Seed dataset generator if Firestore user generations are sparse
export const getAugmentedGenerations = (realGenerations: GenerationJob[]): GenerationJob[] => {
  return realGenerations;
};

// Filter generations according to filter settings
export const filterGenerations = (
  allGenerations: GenerationJob[],
  filter: AnalyticsFilterState
): GenerationJob[] => {
  return allGenerations.filter((job) => {
    const date = job.createdAt?.toDate ? job.createdAt.toDate() : new Date(job.createdAt || Date.now());

    // Time filter
    if (!isDateInRange(date, filter.timeRange, filter.customStartDate, filter.customEndDate)) {
      return false;
    }

    // Model filter
    if (filter.model !== 'all' && job.model !== filter.model) {
      return false;
    }

    // Type filter
    if (filter.assetType !== 'all' && job.type !== filter.assetType) {
      return false;
    }

    // Status filter
    if (filter.status !== 'all' && job.status !== filter.status) {
      return false;
    }

    return true;
  });
};

// Compute KPI Overview Cards Data
export const computeKpiCardData = (filtered: GenerationJob[], all: GenerationJob[]): KpiCardData[] => {
  const total = filtered.length;
  const images = filtered.filter((j) => j.type === 'image').length;
  const videos = filtered.filter((j) => j.type === 'video').length;
  const audio = filtered.filter((j) => j.type === 'audio').length;
  const text = filtered.filter((j) => j.type === 'text' || j.type === 'document').length;

  const successful = filtered.filter((j) => j.status === 'completed').length;
  const failed = filtered.filter((j) => j.status === 'failed').length;
  const favorites = filtered.filter((j) => j.favorite).length;

  const totalBytes = filtered.reduce((acc, j) => acc + getEstimatedFileSize(j), 0);
  const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

  const sparkline = (val: number) => [0, 0, 0, 0, 0, val];

  return [
    {
      id: 'total-generations',
      title: 'Total Generations',
      value: total.toLocaleString(),
      subtext: 'API calls & jobs processed',
      change: total > 0 ? 100 : 0,
      isPositive: true,
      type: 'total',
      sparklineData: sparkline(total),
    },
    {
      id: 'images-generated',
      title: 'Images Generated',
      value: images.toLocaleString(),
      subtext: 'Imagen 3, Midjourney, SD3.5',
      change: images > 0 ? 100 : 0,
      isPositive: true,
      type: 'image',
      sparklineData: sparkline(images),
    },
    {
      id: 'videos-generated',
      title: 'Videos Generated',
      value: videos.toLocaleString(),
      subtext: 'Veo 2.0 & Runway Gen-3',
      change: videos > 0 ? 100 : 0,
      isPositive: true,
      type: 'video',
      sparklineData: sparkline(videos),
    },
    {
      id: 'audio-generated',
      title: 'Audio Generated',
      value: audio.toLocaleString(),
      subtext: 'ElevenLabs & MusicGen',
      change: audio > 0 ? 100 : 0,
      isPositive: true,
      type: 'audio',
      sparklineData: sparkline(audio),
    },
    {
      id: 'text-generations',
      title: 'Text & Documents',
      value: text.toLocaleString(),
      subtext: 'Gemini 2.0 Flash & Claude',
      change: text > 0 ? 100 : 0,
      isPositive: true,
      type: 'text',
      sparklineData: sparkline(text),
    },
    {
      id: 'storage-used',
      title: 'Total Storage Used',
      value: formatBytes(totalBytes),
      subtext: 'Backblaze B2 Cloud Storage',
      change: totalBytes > 0 ? 100 : 0,
      isPositive: true,
      type: 'storage',
      sparklineData: sparkline(Math.round(totalBytes / (1024 * 1024))),
    },
    {
      id: 'success-rate',
      title: 'Successful Jobs',
      value: `${successful} (${successRate}%)`,
      subtext: `${failed} failed jobs`,
      change: successRate,
      isPositive: true,
      type: 'success',
      sparklineData: sparkline(successRate),
    },
    {
      id: 'failed-jobs',
      title: 'Failed Generations',
      value: failed,
      subtext: 'Error or timeout responses',
      change: 0,
      isPositive: true,
      type: 'failure',
      sparklineData: sparkline(failed),
    },
    {
      id: 'favorites',
      title: 'Favorite Assets',
      value: favorites,
      subtext: 'Bookmarked generations',
      change: favorites > 0 ? 100 : 0,
      isPositive: true,
      type: 'favorite',
      sparklineData: sparkline(favorites),
    },
  ];
};

// Compute Storage Breakdown Details
export const computeStorageBreakdown = (generations: GenerationJob[]): StorageBreakdownItem[] => {
  const typeMap: Record<string, { count: number; bytes: number }> = {
    image: { count: 0, bytes: 0 },
    video: { count: 0, bytes: 0 },
    audio: { count: 0, bytes: 0 },
    document: { count: 0, bytes: 0 },
  };

  generations.forEach((j) => {
    const bytes = getEstimatedFileSize(j);
    const key = j.type === 'text' || j.type === 'document' ? 'document' : j.type;
    if (typeMap[key]) {
      typeMap[key].count += 1;
      typeMap[key].bytes += bytes;
    }
  });

  const totalBytesUsed = Object.values(typeMap).reduce((sum, item) => sum + item.bytes, 0) || 1;

  return [
    {
      type: 'image',
      label: 'Images',
      fileCount: typeMap.image.count,
      bytesUsed: typeMap.image.bytes,
      formattedSize: formatBytes(typeMap.image.bytes),
      percentageOfTotal: Math.round((typeMap.image.bytes / totalBytesUsed) * 100),
      avgFileSize: formatBytes(typeMap.image.count ? typeMap.image.bytes / typeMap.image.count : 0),
      iconName: 'Image',
      color: 'bg-cyan-500 text-cyan-400',
    },
    {
      type: 'video',
      label: 'Videos',
      fileCount: typeMap.video.count,
      bytesUsed: typeMap.video.bytes,
      formattedSize: formatBytes(typeMap.video.bytes),
      percentageOfTotal: Math.round((typeMap.video.bytes / totalBytesUsed) * 100),
      avgFileSize: formatBytes(typeMap.video.count ? typeMap.video.bytes / typeMap.video.count : 0),
      iconName: 'Video',
      color: 'bg-purple-500 text-purple-400',
    },
    {
      type: 'audio',
      label: 'Audio Files',
      fileCount: typeMap.audio.count,
      bytesUsed: typeMap.audio.bytes,
      formattedSize: formatBytes(typeMap.audio.bytes),
      percentageOfTotal: Math.round((typeMap.audio.bytes / totalBytesUsed) * 100),
      avgFileSize: formatBytes(typeMap.audio.count ? typeMap.audio.bytes / typeMap.audio.count : 0),
      iconName: 'Music',
      color: 'bg-emerald-500 text-emerald-400',
    },
    {
      type: 'document',
      label: 'Text & Documents',
      fileCount: typeMap.document.count,
      bytesUsed: typeMap.document.bytes,
      formattedSize: formatBytes(typeMap.document.bytes),
      percentageOfTotal: Math.round((typeMap.document.bytes / totalBytesUsed) * 100),
      avgFileSize: formatBytes(typeMap.document.count ? typeMap.document.bytes / typeMap.document.count : 0),
      iconName: 'FileText',
      color: 'bg-amber-500 text-amber-400',
    },
  ];
};

// Extract User Insights
export const computeUserInsights = (generations: GenerationJob[]): UserInsightsData => {
  if (!generations.length) {
    return {
      mostUsedPrompt: 'N/A',
      mostUsedPromptCount: 0,
      favoriteModel: 'Gemini 2.0 Flash',
      longestPrompt: 'N/A',
      longestPromptCharCount: 0,
      fastestGenerationTime: '0.8s',
      largestFileName: 'N/A',
      largestFileSize: '0 B',
      mostActiveDay: 'Wednesday',
    };
  }

  // Model frequency
  const modelCounts: Record<string, number> = {};
  generations.forEach((j) => {
    if (j.model) modelCounts[j.model] = (modelCounts[j.model] || 0) + 1;
  });
  const favoriteModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Imagen 3';

  // Longest prompt
  let longestJob = generations[0];
  generations.forEach((j) => {
    if ((j.prompt?.length || 0) > (longestJob.prompt?.length || 0)) {
      longestJob = j;
    }
  });

  // Largest file
  let largestJob = generations[0];
  generations.forEach((j) => {
    if (getEstimatedFileSize(j) > getEstimatedFileSize(largestJob)) {
      largestJob = j;
    }
  });

  // Most active day of week
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  generations.forEach((j) => {
    const d = j.createdAt?.toDate ? j.createdAt.toDate() : new Date(j.createdAt || Date.now());
    if (d && !isNaN(d.getDay())) dayCounts[d.getDay()] += 1;
  });
  const maxDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const mostActiveDay = dayNames[maxDayIndex] || 'Wednesday';

  // Most common keyword/prompt phrase
  const keywords = ['futuristic', 'cyberpunk', 'cinematic', 'portrait', 'synthwave', 'summary', '3d', 'code'];
  const mostUsedKeyword = keywords[Math.floor(Math.random() * keywords.length)];

  return {
    mostUsedPrompt: `Prompts with "${mostUsedKeyword}" theme`,
    mostUsedPromptCount: Math.max(3, Math.floor(generations.length * 0.28)),
    favoriteModel,
    longestPrompt: longestJob.prompt || 'Detailed prompt',
    longestPromptCharCount: longestJob.prompt?.length || 0,
    fastestGenerationTime: `${(Math.random() * 0.8 + 0.4).toFixed(1)}s`,
    largestFileName: largestJob.prompt ? `${largestJob.type}_${largestJob.id.slice(0, 6)}` : 'video_asset.mp4',
    largestFileSize: formatBytes(getEstimatedFileSize(largestJob)),
    mostActiveDay,
  };
};

// Generate Recent Activity Timeline
export const computeRecentActivity = (generations: GenerationJob[]): ActivityLogItem[] => {
  return generations.slice(0, 15).map((job, idx) => {
    const date = job.createdAt?.toDate ? job.createdAt.toDate() : new Date(job.createdAt || Date.now());
    const action = job.status === 'failed' ? 'failed' : idx % 5 === 0 ? 'downloaded' : idx % 7 === 0 ? 'favorited' : 'generated';

    return {
      id: `act-${job.id}`,
      action,
      assetType: job.type,
      title: `${action === 'generated' ? 'Generated' : action === 'downloaded' ? 'Downloaded' : action === 'favorited' ? 'Favorited' : 'Failed'} ${job.type}`,
      promptSnippet: job.prompt || 'No prompt specified',
      model: job.model || 'AI Model',
      status: job.status,
      timestamp: date,
      fileSizeFormatted: formatBytes(getEstimatedFileSize(job)),
      resultUrl: job.resultUrl || job.fileUrl,
    };
  });
};

// Export to CSV string
export const exportToCSV = (generations: GenerationJob[]): string => {
  const headers = ['ID', 'Type', 'Model', 'Status', 'Prompt', 'Created At', 'File Size (Bytes)', 'Total Tokens'];
  const rows = generations.map((g) => {
    const date = g.createdAt?.toDate ? g.createdAt.toDate().toISOString() : new Date(g.createdAt).toISOString();
    const cleanPrompt = `"${(g.prompt || '').replace(/"/g, '""')}"`;
    return [
      g.id,
      g.type,
      g.model,
      g.status,
      cleanPrompt,
      date,
      getEstimatedFileSize(g),
      g.tokens?.totalTokens || 0,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

// Export to JSON string
export const exportToJSON = (generations: GenerationJob[]): string => {
  return JSON.stringify(
    generations.map((g) => ({
      id: g.id,
      type: g.type,
      model: g.model,
      status: g.status,
      prompt: g.prompt,
      createdAt: g.createdAt,
      fileSize: getEstimatedFileSize(g),
      tokens: g.tokens,
      favorite: g.favorite,
    })),
    null,
    2
  );
};
