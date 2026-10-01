import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { BrandMark, IconButton, ThemeToggle } from '../ui';
import { cn } from '../../lib/cn';

const navLinks = [
  { label: 'Product', target: 'hero' },
  { label: 'Roles', target: 'roles' },
  { label: 'How it works', target: 'how-it-works' },
];

const loginLinkClass =
  'press inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-fg hover-fine:bg-primary-hover';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const lenis = useLenis();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 8);
  });

  const scrollTo = (target: string) => {
    setMobileOpen(false);
    const el = document.getElementById(target);
    if (el && lenis) {
      lenis.scrollTo(el, { offset: -80 });
    }
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-200',
        scrolled || mobileOpen ? 'border-line bg-canvas/85 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="CodePulse home" className="rounded-xl">
          <BrandMark size={30} />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.target}
              type="button"
              onClick={() => scrollTo(link.target)}
              className="h-8 rounded-lg px-3 text-[13px] font-medium text-fg-muted transition-colors duration-150 hover-fine:bg-surface-2 hover-fine:text-fg"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className={cn(loginLinkClass, 'hidden md:inline-flex')}>
            Log in
          </Link>
          <IconButton
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </IconButton>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-line px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.target}
                type="button"
                onClick={() => scrollTo(link.target)}
                className="h-10 rounded-lg px-3 text-left text-sm font-medium text-fg-muted transition-colors duration-150 hover-fine:bg-surface-2 hover-fine:text-fg"
              >
                {link.label}
              </button>
            ))}
          </div>
          <Link to="/login" className={cn(loginLinkClass, 'mt-3 h-10 w-full text-sm')}>
            Log in
          </Link>
        </div>
      )}
    </header>
  );
};
