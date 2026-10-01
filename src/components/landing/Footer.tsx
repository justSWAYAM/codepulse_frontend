import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../ui';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-line py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <Link to="/" aria-label="CodePulse home" className="rounded-xl">
          <BrandMark size={24} />
        </Link>
        <div className="flex items-center gap-4 text-[13px] text-fg-subtle">
          <Link to="/login" className="transition-colors duration-150 hover-fine:text-fg">
            Log in
          </Link>
          <span aria-hidden>·</span>
          <span className="tabular">&copy; {new Date().getFullYear()} CodePulse</span>
        </div>
      </div>
    </footer>
  );
};
