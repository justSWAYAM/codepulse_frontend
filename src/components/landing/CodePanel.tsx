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
    <div className="w-full min-w-0 max-w-xl">
      <div className="overflow-hidden rounded-2xl border border-editor-line bg-editor-bg shadow-pop">
        {/* Title bar */}
        <div className="flex items-center gap-3 border-b border-editor-line bg-editor-panel px-4 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-editor-line" />
            <span className="size-2.5 rounded-full bg-editor-line" />
            <span className="size-2.5 rounded-full bg-editor-line" />
          </div>
          <span className="font-mono text-[12px] text-editor-muted">solution.js</span>
        </div>

        {/* Code area: fixed height so typing never shifts layout */}
        <div className="scroll-thin min-h-[296px] overflow-x-auto p-4 font-mono text-[13px] leading-6 sm:p-5">
          {CODE_LINES.map((_line, index) => (
            <div key={index} className="flex whitespace-pre">
              <span className="mr-4 w-6 shrink-0 select-none text-right text-editor-muted/60 tabular" aria-hidden>
                {index + 1}
              </span>
              <span className={index === 0 ? 'text-editor-muted' : 'text-editor-fg'}>
                {typedLines[index] || ''}
                {cursorLine === index && !prefersReducedMotion && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="ml-0.5 inline-block h-[14px] w-[2px] bg-primary align-text-bottom"
                  />
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Status bar */}
        <div className="flex h-10 items-center justify-between border-t border-editor-line bg-editor-panel px-4">
          <span className="font-mono text-[12px] text-editor-muted">JavaScript</span>
          {showSubmitted && (
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-success"
            >
              <Check className="size-3.5" aria-hidden />
              Submitted · 10/10 tests passed
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
