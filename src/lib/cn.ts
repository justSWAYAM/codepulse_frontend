import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge that shadow-card / shadow-pop are shadows, not colours
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ['card', 'pop'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
