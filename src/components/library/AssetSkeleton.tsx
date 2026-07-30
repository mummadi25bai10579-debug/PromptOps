import React from 'react';

interface AssetSkeletonProps {
  viewMode?: 'grid' | 'list';
  count?: number;
}

export const AssetSkeleton: React.FC<AssetSkeletonProps> = ({ viewMode = 'grid', count = 10 }) => {
  const items = Array.from({ length: count });

  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between p-4 bg-[#111827]/40 border border-white/5 rounded-2xl animate-pulse backdrop-blur-md"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
              <div className="space-y-2 flex-1 max-w-md">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="h-4 bg-white/10 rounded w-16 hidden sm:block" />
              <div className="h-4 bg-white/10 rounded w-20 hidden md:block" />
              <div className="h-4 bg-white/10 rounded w-24 hidden lg:block" />
              <div className="w-8 h-8 rounded-lg bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {items.map((_, i) => (
        <div 
          key={i} 
          className="bg-[#111827]/60 border border-white/5 rounded-2xl overflow-hidden animate-pulse flex flex-col shadow-lg"
        >
          {/* Media Skeleton */}
          <div className="w-full aspect-square bg-gradient-to-b from-white/10 to-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
          {/* Metadata Skeleton */}
          <div className="p-4 space-y-3 bg-[#111827]">
            <div className="h-4 bg-white/10 rounded w-5/6" />
            <div className="h-3 bg-white/5 rounded w-3/4" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-3 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/10 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
