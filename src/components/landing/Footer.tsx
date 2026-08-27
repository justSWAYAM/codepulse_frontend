import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-10 border-t border-hairline">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center group-hover:bg-ink/90 transition-colors">
              <Terminal className="w-3.5 h-3.5 text-accent-compile" />
            </div>
            <span className="font-display text-sm font-bold text-ink tracking-tight">
              Code<span className="text-accent-compile">Pulse</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm text-ink/40 hover:text-ink/70 transition-colors">
              Log In
            </Link>
            <span className="text-sm text-ink/20">·</span>
            <span className="text-sm text-ink/40">
              &copy; {new Date().getFullYear()} CodePulse
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
