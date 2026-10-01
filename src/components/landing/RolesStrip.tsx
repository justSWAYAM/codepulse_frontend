import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GraduationCap, ClipboardCheck, Shield } from 'lucide-react';
import { Card, Eyebrow } from '../ui';

const roles = [
  {
    icon: GraduationCap,
    title: 'Student',
    description:
      'Write and submit code in a timed environment. Get instant feedback on test cases and track your progress across contests.',
  },
  {
    icon: ClipboardCheck,
    title: 'Evaluator',
    description:
      'Design problems, set test suites and review submissions. Grade at scale with automated checks and manual override.',
  },
  {
    icon: Shield,
    title: 'Admin',
    description:
      'Manage users, configure contests and oversee the platform. Full control over roles, permissions and scheduling.',
  },
];

/** Shared heading for landing sections: eyebrow, title, optional lede. */
export const SectionHeading: React.FC<{ eyebrow: string; title: string; description?: string }> = ({
  eyebrow,
  title,
  description,
}) => (
  <div className="max-w-2xl">
    <Eyebrow className="text-primary-text">{eyebrow}</Eyebrow>
    <h2 className="mt-3 font-display text-[32px] font-semibold leading-10 tracking-[-0.03em] text-fg sm:text-[40px] sm:leading-[48px]">
      {title}
    </h2>
    {description && <p className="mt-4 text-base leading-7 text-fg-muted">{description}</p>}
  </div>
);

export const RolesStrip: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="roles" className="border-t border-line py-16 sm:py-24" ref={ref}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Built for everyone" title="Three roles, one platform" />

        <div className="mt-12 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.25, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
            >
              <Card className="h-full p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
                  <role.icon className="size-5" aria-hidden />
                </div>
                <h3 className="font-display text-base font-semibold tracking-[-0.015em] text-fg">{role.title}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-muted">{role.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
