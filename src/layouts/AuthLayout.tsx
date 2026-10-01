import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark, ThemeToggle } from '../components/ui';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
      {/* Quiet radial wash behind the card — cheaper than a blurred shape, no banding */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)]"
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Link to="/" className="relative mb-8 rounded-xl" aria-label="CodePulse home">
        <BrandMark size={36} />
      </Link>
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
};
