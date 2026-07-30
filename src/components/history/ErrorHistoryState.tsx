import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorHistoryStateProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorHistoryState: React.FC<ErrorHistoryStateProps> = ({ error, onRetry }) => {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center backdrop-blur-xl max-w-lg mx-auto my-12 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h4 className="text-base font-bold text-white">Unable to Load Prompt History</h4>
        <p className="text-xs text-red-300/80 leading-relaxed font-mono">{error}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 rounded-xl text-xs font-semibold flex items-center gap-2 mx-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};
