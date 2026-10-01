import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TooltipProvider } from './components/ui';
import { AppToaster } from './components/AppToaster';
import { queryClient } from './lib/queryClient';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      {/* Reduced motion means gentler, not dead: framer swaps movement for opacity */}
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <App />
              <AppToaster />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  </React.StrictMode>
);
