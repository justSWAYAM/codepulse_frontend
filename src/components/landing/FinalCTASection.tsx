import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button, Card, Eyebrow } from '../ui';

export const FinalCTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="border-t border-line py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Card className="flex flex-col items-start gap-6 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <Eyebrow className="text-primary-text">Get started</Eyebrow>
            <h2 className="mt-3 font-display text-[28px] font-semibold leading-9 tracking-[-0.03em] text-fg sm:text-[32px] sm:leading-10">
              Ready to start coding?
            </h2>
            <p className="mt-3 text-base leading-7 text-fg-muted">
              Log in with your institution credentials and jump into your first contest.
            </p>
          </div>
          <Button size="lg" onClick={() => navigate('/login')} trailingIcon={<ArrowRight className="size-4" />}>
            Log in to CodePulse
          </Button>
        </Card>
      </div>
    </section>
  );
};
