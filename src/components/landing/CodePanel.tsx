import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

const CODE_LINES = [
  { text: '// Contest: Algorithm Challenge 2025', delay: 0 },
  { text: 'function findMaxSubarray(arr) {', delay: 0.8 },
  { text: '  let maxSum = arr[0];', delay: 1.4 },
  { text: '  let currentSum = arr[0];', delay: 2.0 },
  { text: '  for (let i = 1; i < arr.length; i++) {', delay: 2.6 },
  { text: '    currentSum = Math.max(arr[i], currentSum + arr[i]);', delay: 3.2 },
  { text: '    maxSum = Math.max(maxSum, currentSum);', delay: 3.8 },
  { text: '  }', delay: 4.2 },
  { text: '  return maxSum;', delay: 4.6 },
  { text: '}', delay: 5.0 },
];

const TOTAL_TYPING_DURATION = 5.8;

export const CodePanel: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [typedLines, setTypedLines] = useState<string[]>(
    prefersReducedMotion ? CODE_LINES.map((l) => l.text) : []
  );
  const [showSubmitted, setShowSubmitted] = useState(prefersReducedMotion ? true : false);
  const [cursorLine, setCursorLine] = useState(prefersReducedMotion ? -1 : 0);
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion || hasPlayed.current) return;
    hasPlayed.current = true;

    CODE_LINES.forEach((line, index) => {
      // Start typing this line
      setTimeout(() => {
        setCursorLine(index);
        // Simulate typing character by character
        const chars = line.text.split('');
        let currentText = '';
        chars.forEach((char, charIndex) => {
          setTimeout(() => {
            currentText += char;
            setTypedLines((prev) => {
              const newLines = [...prev];
              newLines[index] = currentText;
              return newLines;
            });
          }, charIndex * 25);
        });
      }, line.delay * 1000);
    });

    // Show "Submitted" after typing
    setTimeout(() => {
      setCursorLine(-1);
      setShowSubmitted(true);
    }, TOTAL_TYPING_DURATION * 1000);
  }, [prefersReducedMotion]);

  return (
    <div className="w-full max-w-lg">
      {/* Editor chrome */}
      <div className="bg-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl border border-white/5">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#181825] border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-danger/80" />
            <div className="w-3 h-3 rounded-full bg-warning/80" />
            <div className="w-3 h-3 rounded-full bg-primary/80" />
          </div>
          <span className="text-xs text-white/30 font-mono ml-2">solution.js</span>
        </div>

        {/* Code area */}
        <div className="p-5 font-mono text-sm leading-relaxed min-h-[300px]">
          {CODE_LINES.map((_line, index) => (
            <div key={index} className="flex">
              <span className="w-6 text-right text-white/15 text-xs mr-4 select-none shrink-0 pt-0.5">
                {index + 1}
              </span>
              <span className="text-white/80">
                {typedLines[index] || ''}
                {cursorLine === index && !prefersReducedMotion && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-[2px] h-[14px] bg-primary ml-0.5 align-text-bottom"
                  />
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Status bar with submitted */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#181825] border-t border-white/5">
          <span className="text-xs text-white/25 font-mono">JavaScript</span>
          {showSubmitted && (
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-1.5"
            >
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-text" />
              </div>
              <span className="text-xs font-medium text-primary-text">Submitted</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
