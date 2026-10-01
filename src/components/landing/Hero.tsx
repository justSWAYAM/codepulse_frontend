import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useLenis } from 'lenis/react';
import { Badge, Button } from '../ui';
import { CodePanel } from './CodePanel';

const EASE = [0.23, 1, 0.32, 1] as const;

export const Hero: React.FC = () => {
  const lenis = useLenis();
  const navigate = useNavigate();

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el && lenis) {
      lenis.scrollTo(el, { offset: -80 });
    }
  };

  return (
    <section id="hero" className="relative isolate overflow-hidden pt-16">
      {/* Quiet radial wash, same treatment as the auth layout */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 select-none bg-[radial-gradient(60%_55%_at_70%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)]"
      />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="min-w-0"
        >
          <Badge tone="primary" dot className="mb-6 font-mono uppercase tracking-[0.06em]">
            Now in beta
          </Badge>

          <h1 className="font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-fg sm:text-[56px] lg:text-[64px]">
            Where code meets <span className="text-primary-text">evaluation</span>
          </h1>

          <p className="mt-6 max-w-[48ch] text-base leading-7 text-fg-muted sm:text-[17px]">
            Run coding contests, auto-grade submissions and give instant feedback. Built for classrooms and
            competitive programming alike.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => navigate('/login')} trailingIcon={<ArrowRight className="size-4" />}>
              Log in
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={scrollToHowItWorks}
              trailingIcon={<ChevronDown className="size-4" />}
            >
              See how it works
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.04, ease: EASE }}
          className="flex min-w-0 justify-center lg:justify-end"
        >
          <CodePanel />
        </motion.div>
      </div>
    </section>
  );
};
