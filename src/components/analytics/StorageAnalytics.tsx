import React from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Image as ImageIcon, Video, Music, FileText, Database, ShieldCheck, AlertTriangle } from 'lucide-react';
import { StorageBreakdownItem } from '../../types/analytics';
import { formatBytes, TOTAL_STORAGE_CAPACITY_BYTES } from '../../services/analyticsService';
import { cn } from '../../utils/cn';

interface StorageAnalyticsProps {
  breakdown: StorageBreakdownItem[];
  totalBytesUsed: number;
}

export const StorageAnalytics: React.FC<StorageAnalyticsProps> = ({ breakdown, totalBytesUsed }) => {
  const remainingBytes = Math.max(0, TOTAL_STORAGE_CAPACITY_BYTES - totalBytesUsed);
  const usagePercentage = Math.min(100, Math.round((totalBytesUsed / TOTAL_STORAGE_CAPACITY_BYTES) * 100));
  const isHighUsage = usagePercentage >= 80;

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-cyan-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-400" />;
      default:
        return <FileText className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-display font-bold text-white">Storage Consumption & Analytics</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Backblaze B2 Cloud Object Storage quota and breakdown by asset type
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold self-start md:self-auto">
          <ShieldCheck className="w-4 h-4" />
          Backblaze B2 Synced
        </div>
      </div>

      {/* Warning Notification Banner if High Usage */}
      {isHighUsage && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 text-amber-300 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            Storage capacity has reached <strong>{usagePercentage}%</strong> of your 50 GB quota. Consider deleting older assets or upgrading your storage tier.
          </span>
        </div>
      )}

      {/* Main Capacity Progress Bar */}
      <div className="bg-black/50 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Quota Usage</span>
          </div>
          <span className="font-mono text-white">
            {formatBytes(totalBytesUsed)} / {formatBytes(TOTAL_STORAGE_CAPACITY_BYTES)} ({usagePercentage}%)
          </span>
        </div>

        {/* Stacked Storage Bar */}
        <div className="w-full h-3.5 bg-white/5 rounded-full overflow-hidden flex border border-white/10">
          {breakdown.map((item) => (
            <div
              key={item.type}
              className={cn('h-full transition-all duration-500', item.color.split(' ')[0])}
              style={{ width: `${item.percentageOfTotal}%` }}
              title={`${item.label}: ${item.formattedSize} (${item.percentageOfTotal}%)`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Used Storage: <strong className="text-white">{formatBytes(totalBytesUsed)}</strong></span>
          <span>Remaining Quota: <strong className="text-emerald-400">{formatBytes(remainingBytes)}</strong></span>
        </div>
      </div>

      {/* Asset Breakdown Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {breakdown.map((item) => (
          <div
            key={item.type}
            className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:border-white/15 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/5 rounded-lg">{getIcon(item.type)}</div>
                <span className="font-semibold text-white text-xs">{item.label}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                {item.percentageOfTotal}%
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-bold font-mono text-white">{item.formattedSize}</div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{item.fileCount} files</span>
                <span>Avg: {item.avgFileSize}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
