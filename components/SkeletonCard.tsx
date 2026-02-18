import React from 'react';

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-700/40 rounded-xl p-4 animate-pulse ${className}`}>
    <div className="h-4 bg-slate-600/60 rounded w-3/4 mb-3" />
    <div className="h-3 bg-slate-600/60 rounded w-1/2" />
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="bg-slate-700/40 rounded-xl p-6 animate-pulse">
    <div className="h-5 bg-slate-600/60 rounded w-1/3 mb-6" />
    <div className="flex gap-4 items-end h-32">
      {[40, 70, 50, 90, 60].map((h, i) => (
        <div key={i} className="flex-1 bg-slate-600/60 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

export const SkeletonActivityItem: React.FC = () => (
  <div className="bg-slate-700/30 p-4 rounded-xl animate-pulse flex justify-between items-center">
    <div className="h-4 bg-slate-600/60 rounded w-1/2" />
    <div className="h-6 w-12 bg-slate-600/60 rounded-full" />
  </div>
);
