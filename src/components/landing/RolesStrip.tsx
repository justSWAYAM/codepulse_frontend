import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { GraduationCap, ClipboardCheck, Shield } from 'lucide-react';

const roles = [
  {
    icon: GraduationCap,
    title: 'Student',
    description:
      'Write and submit code in a timed environment. Get instant feedback on test cases and track your progress across contests.',
    accent: 'bg-accent-compile/10 text-accent-compile',
  },
  {
    icon: ClipboardCheck,
    title: 'Evaluator',
    description:
      'Design problems, set test suites, and review submissions. Grade at scale with automated checks and manual override.',
    accent: 'bg-accent-syntax/10 text-accent-syntax',
  },
  {
    icon: Shield,
    title: 'Admin',
    description:
      'Manage users, configure contests, and oversee the entire platform. Full control over roles, permissions, and scheduling.',
    accent: 'bg-ink/5 text-ink',
  },
];

export const RolesStrip: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="roles" className="py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="font-mono text-xs tracking-widest text-accent-syntax uppercase mb-3 block">
            Built for everyone
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">
            Three roles, one platform
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12, ease: 'easeOut' }}
              className="bg-surface rounded-xl border border-hairline p-7 hover:shadow-md hover:border-hairline/80 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg ${role.accent} flex items-center justify-center mb-4`}>
                <role.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink mb-2">{role.title}</h3>
              <p className="text-sm text-ink/55 leading-relaxed">{role.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
