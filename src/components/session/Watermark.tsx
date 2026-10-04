import React, { useEffect, useRef } from 'react';

interface WatermarkProps {
  /** Lines of text to tile across the screen. */
  lines: string[];
  /** Called if the watermark node is removed or hidden via DevTools. */
  onTamper?: () => void;
}

/**
 * Watermark — full-screen tiled overlay, pointer-events:none, z-index 9999.
 *
 * Tamper-resistance:
 *  - MutationObserver re-flags if the node is removed or its style is zeroed.
 *  - The overlay is re-injected into the DOM if removed.
 *  - A slow rotation drift makes a static crop-out less effective.
 *
 * Accessible: aria-hidden so screen readers skip it entirely.
 */
export const Watermark: React.FC<WatermarkProps> = ({ lines, onTamper }) => {
  const ref        = useRef<HTMLDivElement>(null);
  const onTamperRef = useRef(onTamper);
  useEffect(() => { onTamperRef.current = onTamper; });

  // Slow drift: rotate ±3° over time to defeat static crop-outs
  const [angle, setAngle] = React.useState(-25);
  useEffect(() => {
    let dir = 1;
    const id = window.setInterval(() => {
      setAngle((a) => {
        const next = a + dir * 0.3;
        if (next > -22 || next < -28) dir *= -1;
        return next;
      });
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  // Tamper detection via MutationObserver
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const handleTamper = () => onTamperRef.current?.();

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        // Node removed
        if (m.type === 'childList') {
          for (const node of m.removedNodes) {
            if (node === el) handleTamper();
          }
        }
        // Style/attribute zeroed (opacity=0, display=none, visibility=hidden)
        if (m.type === 'attributes' && m.target === el) {
          const style = (el as HTMLElement).style;
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            parseFloat(style.opacity) < 0.01
          ) {
            handleTamper();
          }
        }
      }
    });

    mo.observe(parent, { childList: true });
    mo.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });

    return () => mo.disconnect();
  }, []);

  const text = lines.join('  •  ');

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        userSelect: 'none',
        overflow: 'hidden',
        opacity: 0.075,
      }}
    >
      {/* Extended canvas so tiles cover even after rotation */}
      <div
        style={{
          position: 'absolute',
          inset: '-60%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '3rem 4rem',
          transform: `rotate(${angle}deg)`,
          transition: 'transform 1.5s linear',
          alignContent: 'start',
        }}
      >
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            style={{
              whiteSpace: 'nowrap',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.02em',
              color: 'currentColor',
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};
