import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Code2, Send, BarChart3 } from 'lucide-react';
import { SectionHeading } from './RolesStrip';

const steps = [
  {
    number: '01',
    icon: Code2,
    title: 'Write your solution',
    description:
      'Open the built-in editor, read the problem statement and write your solution in your language of choice, all within a timed contest window.',
  },
  {
    number: '02',
    icon: Send,
    title: 'Submit and run tests',
    description:
      'Submit and watch your code run against the full test suite. Get instant verdicts (pass, fail, time limit exceeded) with detailed output diffs.',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Get evaluated',
    description:
      'Evaluators review submissions with automated scores and manual notes. Results land in your dashboard as soon as grading is complete.',
  },
];

export const HowItWorksSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="border-t border-line bg-surface py-16 sm:py-24" ref={ref}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Simple workflow"
          title="How it works"
          description="From the first keystroke to a graded result in three steps."
        />

        <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, i) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.25, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
              className="border-t border-line-strong pt-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
                  <step.icon className="size-5" aria-hidden />
                </div>
                <span className="font-mono text-[12px] font-medium text-fg-subtle tabular">{step.number}</span>
              </div>
              <h3 className="mt-6 font-display text-base font-semibold tracking-[-0.015em] text-fg">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-fg-muted">{step.description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};
