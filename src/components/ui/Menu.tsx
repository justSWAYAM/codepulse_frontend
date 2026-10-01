import React from 'react';
import * as DM from '@radix-ui/react-dropdown-menu';
import * as TT from '@radix-ui/react-tooltip';
import { cn } from '../../lib/cn';

/* ── Dropdown menu: grows from its trigger (transform-origin), Escape returns focus ── */

export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;

export const MenuContent: React.FC<DM.DropdownMenuContentProps> = ({ className, sideOffset = 6, align = 'end', ...rest }) => (
  <DM.Portal>
    <DM.Content
      sideOffset={sideOffset}
      align={align}
      className={cn(
        'z-[var(--z-popover)] min-w-48 rounded-xl border border-line bg-surface p-1 shadow-pop',
        'origin-[var(--radix-dropdown-menu-content-transform-origin)]',
        'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
        className,
      )}
      {...rest}
    />
  </DM.Portal>
);

export const MenuItem: React.FC<DM.DropdownMenuItemProps & { icon?: React.ReactNode; tone?: 'danger' }> = ({
  className,
  icon,
  tone,
  children,
  ...rest
}) => (
  <DM.Item
    className={cn(
      'flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 text-[13px] outline-none',
      'data-[highlighted]:bg-surface-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      tone === 'danger' ? 'text-danger-text' : 'text-fg',
      className,
    )}
    {...rest}
  >
    {icon && <span className="flex size-4 items-center justify-center text-fg-subtle [&>svg]:size-4">{icon}</span>}
    {children}
  </DM.Item>
);

export const MenuSeparator: React.FC = () => <DM.Separator className="-mx-1 my-1 h-px bg-line" />;
export const MenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DM.Label className="px-2.5 py-2 text-[12px] text-fg-subtle">{children}</DM.Label>
);

/* ── Tooltip: ~300ms delay, warm for 400ms after closing, shows on keyboard focus ── */

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TT.Provider delayDuration={300} skipDelayDuration={400}>
    {children}
  </TT.Provider>
);

export const Tooltip: React.FC<{
  content: React.ReactNode;
  children: React.ReactElement;
  side?: TT.TooltipContentProps['side'];
}> = ({ content, children, side = 'top' }) => (
  <TT.Root>
    <TT.Trigger asChild>{children}</TT.Trigger>
    <TT.Portal>
      <TT.Content
        side={side}
        sideOffset={6}
        className={cn(
          'z-[var(--z-tooltip)] rounded-lg bg-fg px-2.5 py-1.5 text-[12px] font-medium text-canvas shadow-pop',
          'origin-[var(--radix-tooltip-content-transform-origin)] data-[state=delayed-open]:animate-pop-in data-[state=closed]:animate-pop-out',
        )}
      >
        {content}
      </TT.Content>
    </TT.Portal>
  </TT.Root>
);
