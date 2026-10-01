import React from 'react';
import { ReactLenis } from 'lenis/react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { RolesStrip } from '../components/landing/RolesStrip';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';
import { Footer } from '../components/landing/Footer';

const LandingPage: React.FC = () => {
  return (
    // Smooth scroll only on the marketing page — it would fight Monaco and app panels
    <ReactLenis root options={{ lerp: 0.12, smoothWheel: true }}>
      <Navbar />
      <main>
        <Hero />
        <RolesStrip />
        <HowItWorksSection />
        <FinalCTASection />
      </main>
      <Footer />
    </ReactLenis>
  );
};

export default LandingPage;
