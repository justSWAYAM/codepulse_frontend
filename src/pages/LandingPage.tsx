import React from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { RolesStrip } from '../components/landing/RolesStrip';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';
import { Footer } from '../components/landing/Footer';

const LandingPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <RolesStrip />
        <HowItWorksSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
