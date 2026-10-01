import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useTheme, type ThemePreference } from '../../context/ThemeContext';
import { Menu, MenuContent, MenuItem, MenuTrigger } from './Menu';
import { IconButton } from './Button';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cn('rounded-lg bg-surface-3/70 motion-safe:animate-pulse', className)} aria-hidden {...rest} />
);

export const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <kbd
    className={cn(
      'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-surface-2 px-1 font-mono text-[10.5px] font-medium text-fg-subtle',
      className,
    )}
  >
    {children}
  </kbd>
);

/** Platform-aware modifier label for shortcuts. */
export const MOD_KEY =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

/**
 * The one CodePulse mark: a pulse line through a code bracket.
 * Used by the app shell, auth layout, landing navbar and favicon.
 */
export const BrandMark: React.FC<{ size?: number; className?: string; withWordmark?: boolean }> = ({
  size = 32,
  className,
  withWordmark = true,
}) => (
  <span className={cn('inline-flex items-center gap-2.5', className)}>
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l2.5-6 5 12L17 12h4" />
      </svg>
    </span>
    {withWordmark && (
      <span className="font-display text-[17px] font-semibold tracking-[-0.03em] text-fg">
        Code<span className="text-primary-text">Pulse</span>
      </span>
    )}
  </span>
);

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'dark', label: 'Dark', icon: <Moon /> },
  { value: 'system', label: 'System', icon: <Monitor /> },
];

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { preference, resolved, setPreference } = useTheme();
  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton aria-label={`Theme: ${preference}`} className={className}>
          {resolved === 'dark' ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </IconButton>
      </MenuTrigger>
      <MenuContent className="min-w-36">
        {THEME_OPTIONS.map((o) => (
          <MenuItem
            key={o.value}
            icon={o.icon}
            onSelect={() => setPreference(o.value)}
            className={preference === o.value ? 'text-primary-text' : undefined}
          >
            {o.label}
            {preference === o.value && <span className="ml-auto text-[11px] text-fg-subtle">Active</span>}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
};

/** Small uppercase mono label (eyebrows, section labels). */
export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle', className)}>
    {children}
  </div>
);
