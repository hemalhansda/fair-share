import React from 'react';

const SkeletonLoader = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '', 
  rounded = 'rounded',
  count = 1 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${width} ${height} ${rounded} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-pulse ${className}`}
        />
      ))}
    </>
  );
};

// Specific skeleton components for common UI patterns
export const ExpenseSkeleton = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SkeletonLoader width="w-10" height="h-10" rounded="rounded-full" />
        <div className="space-y-2">
          <SkeletonLoader width="w-32" height="h-4" />
          <SkeletonLoader width="w-24" height="h-3" />
        </div>
      </div>
      <SkeletonLoader width="w-16" height="h-6" />
    </div>
    <SkeletonLoader width="w-full" height="h-3" />
  </div>
);

export const GroupSkeleton = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SkeletonLoader width="w-12" height="h-12" rounded="rounded-full" />
        <div className="space-y-2">
          <SkeletonLoader width="w-32" height="h-5" />
          <SkeletonLoader width="w-20" height="h-3" />
        </div>
      </div>
      <SkeletonLoader width="w-8" height="h-8" rounded="rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <SkeletonLoader width="w-20" height="h-3" />
        <SkeletonLoader width="w-16" height="h-4" />
      </div>
      <div className="space-y-2">
        <SkeletonLoader width="w-24" height="h-3" />
        <SkeletonLoader width="w-18" height="h-4" />
      </div>
    </div>
  </div>
);

export const UserSkeleton = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SkeletonLoader width="w-12" height="h-12" rounded="rounded-full" />
        <div className="space-y-2">
          <SkeletonLoader width="w-28" height="h-4" />
          <SkeletonLoader width="w-32" height="h-3" />
        </div>
      </div>
      <div className="flex gap-2">
        <SkeletonLoader width="w-8" height="h-8" rounded="rounded" />
        <SkeletonLoader width="w-8" height="h-8" rounded="rounded" />
      </div>
    </div>
  </div>
);

export const ActivitySkeleton = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
    <div className="flex items-start gap-3">
      <SkeletonLoader width="w-8" height="h-8" rounded="rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader width="w-3/4" height="h-4" />
        <SkeletonLoader width="w-1/2" height="h-3" />
        <SkeletonLoader width="w-20" height="h-3" />
      </div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="space-y-4">
      <SkeletonLoader width="w-48" height="h-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-3">
            <SkeletonLoader width="w-24" height="h-4" />
            <SkeletonLoader width="w-20" height="h-6" />
            <SkeletonLoader width="w-16" height="h-3" />
          </div>
        ))}
      </div>
    </div>
    
    {/* Recent expenses skeleton */}
    <div className="space-y-4">
      <SkeletonLoader width="w-32" height="h-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ExpenseSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

export default SkeletonLoader;