import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const FinalCTASection: React.FC = () => {
  return (
    <section className="py-20 bg-primary">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to start coding?
        </h2>
        <p className="text-white/50 text-lg mb-8 max-w-md mx-auto">
          Log in with your institution credentials and jump into your first contest.
        </p>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block"
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-white font-semibold text-base hover:bg-primary-hover transition-colors"
          >
            Log In to CodePulse
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
