import React from 'react';
import { cn } from '../../lib/cn';

/** Twelve-bar spinner (components.md): bars fade, the container never rotates. */
export const Spinner: React.FC<{ size?: number; className?: string; label?: string }> = ({
  size = 16,
  className,
  label = 'Loading',
}) => (
  <span role="status" aria-label={label} className={cn('relative inline-block', className)} style={{ width: size, height: size }}>
    {Array.from({ length: 12 }, (_, i) => (
      <span
        key={i}
        aria-hidden
        className="absolute left-1/2 top-0 h-[28%] w-[9%] -translate-x-1/2 rounded-full bg-current motion-safe:animate-[cp-spin-bar_800ms_linear_infinite]"
        style={{
          transform: `translateX(-50%) rotate(${i * 30}deg)`,
          transformOrigin: `50% ${size / 2}px`,
          animationDelay: `${-800 + (i * 800) / 12}ms`,
          opacity: 0.35,
        }}
      />
    ))}
  </span>
);
