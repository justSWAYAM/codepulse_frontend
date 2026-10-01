import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Code2, Send, BarChart3 } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Code2,
    title: 'Write your solution',
    description:
      'Open the integrated code editor, read the problem statement, and write your solution in your language of choice — all within a timed contest window.',
  },
  {
    number: '02',
    icon: Send,
    title: 'Submit & run tests',
    description:
      'Hit submit and watch your code run against the full test suite. Get instant verdicts — pass, fail, time-limit exceeded — with detailed output diffs.',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Get evaluated',
    description:
      'Evaluators review submissions with automated scores and manual annotations. Results land in your dashboard the moment grading is complete.',
  },
];

export const HowItWorksSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="py-24 bg-surface" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="font-mono text-xs tracking-widest text-primary-text uppercase mb-3 block">
            Simple workflow
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-fg">
            How it works
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15, ease: 'easeOut' }}
              className="relative"
            >
              {/* Connector line (hidden on last item) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(100%+0.5rem)] w-[calc(100%-2rem)] h-px bg-line" />
              )}

              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-primary-text" />
                  </div>
                </div>
                <div>
                  <span className="font-mono text-xs text-warning-text font-medium">{step.number}</span>
                  <h3 className="font-display text-lg font-semibold text-fg mt-0.5 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-fg-muted leading-relaxed">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
