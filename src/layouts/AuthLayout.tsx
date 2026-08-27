import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Brand mark */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 rounded-lg bg-ink flex items-center justify-center group-hover:bg-ink/90 transition-colors">
          <Terminal className="w-5 h-5 text-accent-compile" />
        </div>
        <span className="font-display text-xl font-bold text-ink tracking-tight">
          Code<span className="text-accent-compile">Pulse</span>
        </span>
      </Link>

      {/* Card */}
      {children}
    </div>
  );
};
