import React from 'react';
import { Skeleton } from '../ui';

/** Tile- and chart-shaped placeholders; also the Suspense fallback while the analytics chunk loads. */
export const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-4" aria-busy>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  </div>
);
