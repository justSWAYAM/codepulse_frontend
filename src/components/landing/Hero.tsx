import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useLenis } from 'lenis/react';
import { CodePanel } from './CodePanel';

export const Hero: React.FC = () => {
  const lenis = useLenis();

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el && lenis) {
      lenis.scrollTo(el, { offset: -80 });
    }
  };

  return (
    <section id="hero" className="min-h-screen flex items-center pt-16">
      <div className="max-w-6xl mx-auto px-6 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Pitch */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary-text text-xs font-mono font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              NOW IN BETA
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-fg leading-[1.1] tracking-tight mb-5">
              Where code meets{' '}
              <span className="text-primary-text">evaluation</span>
            </h1>

            <p className="text-lg text-fg-muted leading-relaxed max-w-lg mb-8">
              Run coding contests, auto-grade submissions, and deliver instant feedback — 
              built for classrooms and competitive programming alike.
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
                >
                  Log In
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.button
                onClick={scrollToHowItWorks}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-line text-fg-muted font-medium hover:border-line-strong hover:text-fg transition-colors cursor-pointer"
              >
                See how it works
                <ChevronDown className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* Right — Code panel */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="flex justify-center lg:justify-end"
          >
            <CodePanel />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
