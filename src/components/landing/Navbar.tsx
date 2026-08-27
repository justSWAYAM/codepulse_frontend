import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Menu, X } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useLenis } from 'lenis/react';

const navLinks = [
  { label: 'Product', target: 'hero' },
  { label: 'Roles', target: 'roles' },
  { label: 'How it works', target: 'how-it-works' },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const lenis = useLenis();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 50);
  });

  const scrollTo = (target: string) => {
    setMobileOpen(false);
    const el = document.getElementById(target);
    if (el && lenis) {
      lenis.scrollTo(el, { offset: -80 });
    }
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface/95 backdrop-blur-md border-b border-hairline shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center group-hover:bg-ink/90 transition-colors">
            <Terminal className="w-4 h-4 text-accent-compile" />
          </div>
          <span className="font-display text-lg font-bold text-ink tracking-tight">
            Code<span className="text-accent-compile">Pulse</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => scrollTo(link.target)}
              className="text-sm font-medium text-ink/60 hover:text-ink transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="inline-flex items-center px-5 py-2 rounded-lg bg-accent-compile text-white text-sm font-medium hover:bg-accent-compile-hover transition-colors"
            >
              Log In
            </Link>
          </motion.div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-ink p-1 cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-surface border-b border-hairline px-6 pb-4 space-y-3"
        >
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => scrollTo(link.target)}
              className="block w-full text-left text-sm font-medium text-ink/60 hover:text-ink transition-colors py-1 cursor-pointer"
            >
              {link.label}
            </button>
          ))}
          <Link
            to="/login"
            className="block w-full text-center px-5 py-2 rounded-lg bg-accent-compile text-white text-sm font-medium hover:bg-accent-compile-hover transition-colors mt-2"
          >
            Log In
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
};
