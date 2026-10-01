# Glass, refraction, WebGL

This is the short version. The full method (templates, shader anatomy, Apple's per-frame measurements, capture scripts) lives in the `liquid-glass-components` skill. Use that whenever you build a glass control.

## What real glass does (iOS 26 Liquid Glass, measured from WWDC25 sessions 219, 323 and 356)

- **At rest it is quiet:** a solid white capsule with a faint shadow and a hairline edge. The glass appears only while touched or travelling, then settles back.
- **On touch:**
  - The lens lifts in about 130ms, critically damped, with no bounce.
  - It grows well past the track (about 1.1–1.75× wide, taller than the track) and overhangs it.
  - Then it goes clear: content inside is magnified (about 1.16× for text), and the curved rim pulls in and squeezes what lies just beyond the edge. The rim takes the colour of what's under it.
- **Only then does it travel:** it creeps, accelerates and arrives without overshoot. Contraction overlaps arrival; it doesn't wait for it.
- **On settling:** it returns to solid over about 230–330ms. A toggle passes through a frosted state (blurred, not faded) on the way down.
- Nothing wobbles. Nothing glows.

## Hard rules (every one of these was learnt by being rejected)

- Never fake glass with CSS. `backdrop-filter: blur()`, gradients, inset shadows and "glassmorphism" only blur; real glass *bends* what's behind it. Use a WebGL fragment shader (`refract()` through a bevel, index of refraction about 1/1.46).
- Default to **pure refraction**. Clear glass that bends a sharp view beats a measured frost; frost read as "milky" and "plastic".
- No coloured sheen, no rainbow rim. Dispersion is at most a hairline at the rim, and none on text controls.
- Glass needs something behind it: large saturated shapes and thin strong lines. A blank or grey backdrop makes glass read as a plastic pill.
- A wide, smooth bevel (about 25px) through a physical refraction feels liquid. A narrow rim band over frost does not.
- Icons in glass stay the artwork, edge to edge, with a fine rim. The bend wakes with "energy" (hover + press + speed) and settles back to the exact art. An always-on thick bevel reads as a plastic wrapper.
- When two glass shapes merge or split (a tab bar's search circle), use a smooth-min union whose blend radius shrinks as they part. Bulge, neck, pinch and round then happen by themselves.
- Menus grow from the tapped button, carry their content inside the shape, and are keyframed from measured silhouettes. They are played through a monotone cubic, which never invents overshoot. Interruptions crossfade over about 140ms into the other track at the nearest time.

## WebGL hygiene

- One canvas and one pass per scene beats many DOM layers. The folder went from 50ms p95 frames (DOM plus SVG filters) to 16.8ms (one shader).
- Budget contexts:
  - Android Chrome keeps about 8 per page and silently drops the oldest.
  - Mount heavy pieces only near the viewport (IntersectionObserver `rootMargin: 50%`).
  - Compile them one at a time from a queue about 50ms apart.
  - Reveal after the first painted frame (two rAFs).
  - Call `WEBGL_lose_context.loseContext()` when a piece leaves.
- Handle `webglcontextlost` (call `preventDefault` so it can restore) and `webglcontextrestored` in their own effect. Delay the release one task after cleanup so React Strict Mode's re-run keeps the context.
- A render loop requests a frame only while something is moving, and stops when settled.
- Never blur or crossfade a WebGL canvas. Chrome draws dark rows, and opaque canvases stack over each other's shadows. Swap out, then in.
- Guard zero-size canvases (a 0-width pane crashed the page). Measure fit against the stage, not the viewport.
- A/B test shader variants without editing source: patch `WebGLRenderingContext.prototype.shaderSource` in a test init script and compare frame tiles.
- Watch the sign of a refraction offset: an outward `bend` must sample inward (`q − bend`), or corners smear.
