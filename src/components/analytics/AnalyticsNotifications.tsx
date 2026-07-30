import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, CheckCircle2, AlertOctagon, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { GenerationJob } from '../../types';
import { TOTAL_STORAGE_CAPACITY_BYTES } from '../../services/analyticsService';

interface AnalyticsNotificationsProps {
  generations: GenerationJob[];
  totalBytesUsed: number;
}

export const AnalyticsNotifications: React.FC<AnalyticsNotificationsProps> = ({
  generations,
  totalBytesUsed,
}) => {
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  const usagePct = Math.round((totalBytesUsed / TOTAL_STORAGE_CAPACITY_BYTES) * 100);
  const isStorageHigh = usagePct >= 80;
  const failedJobs = generations.filter((g) => g.status === 'failed');
  const recentCompleted = generations.find((g) => g.status === 'completed');

  const handleDismiss = (id: string) => {
    setDismissedNotifications((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-3 w-full">
      <AnimatePresence>
        {/* Notification 1: Storage Warning */}
        {isStorageHigh && !dismissedNotifications.includes('storage-warning') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start justify-between gap-4 text-amber-200 text-xs shadow-lg backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-0.5">Storage Quota Almost Full</h4>
                <p className="text-amber-200/80">
                  Your Backblaze B2 storage is at <strong>{usagePct}% capacity</strong>. To avoid generation interruptions, clean up unneeded assets or expand your tier.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss('storage-warning')}
              className="p-1 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer text-amber-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Notification 2: Failed Generations Notice */}
        {failedJobs.length > 0 && !dismissedNotifications.includes('failed-jobs-warning') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start justify-between gap-4 text-rose-200 text-xs shadow-lg backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-300 text-sm mb-0.5">
                  {failedJobs.length} Failed Generation{failedJobs.length > 1 ? 's' : ''} Detected
                </h4>
                <p className="text-rose-200/80">
                  Some API calls encountered model safety filters or timeout limits. Check parameter configurations or retry with alternative prompts.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss('failed-jobs-warning')}
              className="p-1 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer text-rose-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Notification 3: Recent Generation Completed */}
        {recentCompleted && !dismissedNotifications.includes('completed-success') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start justify-between gap-4 text-emerald-200 text-xs shadow-lg backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-300 text-sm mb-0.5">Generations Operational</h4>
                <p className="text-emerald-200/80">
                  Latest job finished successfully with <strong>{recentCompleted.model}</strong>. All system background queues running smoothly.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss('completed-success')}
              className="p-1 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer text-emerald-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
