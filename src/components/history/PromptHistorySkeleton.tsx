import React from 'react';

export const PromptHistorySkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-xl animate-pulse flex flex-col justify-between space-y-4"
        >
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/10" />
              <div className="w-16 h-5 rounded-lg bg-white/10" />
              <div className="w-20 h-5 rounded-lg bg-white/10" />
            </div>
            <div className="w-14 h-5 rounded-full bg-white/10" />
          </div>

          {/* Lines of text */}
          <div className="space-y-2">
            <div className="w-full h-4 rounded bg-white/10" />
            <div className="w-4/5 h-4 rounded bg-white/10" />
            <div className="w-2/3 h-4 rounded bg-white/5" />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="w-24 h-3 rounded bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/10" />
              <div className="w-6 h-6 rounded-lg bg-white/10" />
              <div className="w-6 h-6 rounded-lg bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
