import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center backdrop-blur-xl my-8">
      <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-display font-bold text-white mb-1">Asset Sync Error</h3>
      <p className="text-sm text-red-300 max-w-md mb-6">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry Sync
        </button>
      )}
    </div>
  );
};
