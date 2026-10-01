import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      {/* Brand mark */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center group-hover:bg-primary-hover transition-colors">
          <Terminal className="w-5 h-5 text-primary-text" />
        </div>
        <span className="font-display text-xl font-bold text-fg tracking-tight">
          Code<span className="text-primary-text">Pulse</span>
        </span>
      </Link>

      {/* Card */}
      {children}
    </div>
  );
};
