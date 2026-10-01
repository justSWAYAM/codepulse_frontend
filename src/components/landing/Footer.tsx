import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-10 border-t border-line">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center group-hover:bg-primary-hover transition-colors">
              <Terminal className="w-3.5 h-3.5 text-primary-text" />
            </div>
            <span className="font-display text-sm font-bold text-fg tracking-tight">
              Code<span className="text-primary-text">Pulse</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm text-fg-subtle hover:text-fg-muted transition-colors">
              Log In
            </Link>
            <span className="text-sm text-fg-subtle">·</span>
            <span className="text-sm text-fg-subtle">
              &copy; {new Date().getFullYear()} CodePulse
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
