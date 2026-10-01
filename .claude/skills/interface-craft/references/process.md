# Process: how quality is actually reached

## Train judgement

Taste is trained, not innate. The loop:

1. Study the best work, and the people those people admire.
2. Say exactly why a detail works, in numbers where possible.
3. Rebuild it until your version is indistinguishable.
4. Ask for critique.

Show a difference rather than describe it. Put bad and good side by side, triggered on the same frame, so people compare against each other and not against memory.

## Recreating a reference (measure, then build)

Invented physics fails side by side. Every time the feel was guessed ("more liquid", "add jiggle"), it was rejected. Every time it was measured, it held.

1. **Capture the reference.**
   - Record at 60fps (2× device pixels) or pull the source video at 4K.
   - For WWDC-style HLS, seek to `start + (n + 0.5)/fps` and draw each frame onto a canvas so every frame is exact.
2. **Measure it.**
   - Per frame: the silhouette (extents, widths at 5/25/50/75/95% of height, corner radius), positions and opacity.
   - Write size ratios, timings and what happens at the edges **before** coding.
3. **Fit it.**
   - Fit springs with a small grid search (numpy is enough) against the tracked curve.
   - Read critical damping carefully: a misread tail gave ω 7.7 where the true fit was 9.3.
   - Shapes that can't be expressed as one spring get keyframed per frame and played through a monotone cubic.
4. **Compare the numbers, not the screenshots.**
   - Run the same probes on the reference and the rebuild, and compare the fitted parameters (the toolbar tooltip was measured at rms 0.028 against a default layout animation's 0.158).
   - Pair frames at the same millisecond in one image.
   - Judge stills *and* slow motion; many effects only show in motion.
5. **Paywalled source is never copied.** Rebuild it from observed behaviour and public docs, and credit it ("after …").

## Changing an existing component

- **Checkpoint first.** Copy it to `.checkpoints/<name>-<n>/` with a `RESTORE.md` holding the exact copy-back commands. People ask for earlier versions often.
- **Restore before rewriting.** When someone brings their own component, keep its mechanics verbatim. They encode deliberate decisions: a toolbar rewrite from a screenshot lost the sliding tooltip and the capsule-to-panel morph it was built for.
- Tune constants; don't rewrite a component that is liked. If you believe a rewrite is needed, say why and wait.
- Change only what a frame comparison proves wrong, and justify each change with the measured number.

## Verification loop (before saying "done")

1. **Slow motion.**
   - Slow the page clock about 20× by scaling rAF timestamps in an init script. 5× lets screenshot latency skew the timings.
   - Playwright's virtual clock does not drive Motion correctly. Delete `Element.prototype.animate` so Motion falls back to rAF under the slowed clock.
2. **Frame sheet.** Capture rest, press, travel, settle, drag and release at fixed offsets (for example +60, 130, 200, 300, 400, 500, 650, 800, 1000ms) and composite them into one grid. Judge only the latest sheet.
3. **Behaviour script.** Write explicit pass/fail checks, as the toolbar's 24 checks do:
   - roving focus;
   - focus-visible tooltip;
   - Enter opens with search focused;
   - `aria-expanded`;
   - no highlight on open;
   - Escape returns focus;
   - no console or page errors.
4. **State traces.** For canvases, read uniforms or state every frame (`gl.getUniform`) to prove timing claims, for example that contraction starts before arrival. Screenshot sheets carry 0.4–0.7% pixel noise between runs, so prove "feel unchanged" with identical value traces.
5. **Performance.** Check frame-time p95 and the frames over 33ms during the animation, plus long tasks on frequent actions (a filter click must cost none).
6. **Environment.**
   - Keyboard only.
   - Reduced motion: reset the emulation at the start of every run, because it is sticky.
   - 375px with `scrollWidth <= innerWidth`.
   - The target viewports (see `polish.md`).
   - A real phone for gestures.
   - The WebGL-missing fallback.
   - A production build.
7. **Fresh eyes.** Review the next day, at 2–5× slow motion, and step frame by frame in DevTools' Animations panel. Look for:
   - two states overlapping in a crossfade;
   - a wrong origin;
   - out-of-sync properties;
   - abrupt starts or stops.

## Deciding and shipping

- **Friction as a feature.** Building is cheap, so judgement is the filter. Pick one version, cut the rest, and ship only what was judged. Never show a stream of unjudged variants.
- Good defaults matter more than options. Customisation comes after the behaviour is final.
- A new component earns an abstraction after 2–3 copies, not before.
- **Distribution gotchas (shadcn registry):**
  - the CLI can trim whitespace-only string literals;
  - `init` needs Tailwind;
  - read `navigator` only after mount;
  - ship CSS Modules, not the registry `css` field;
  - byte-compare installed files against source in a smoke test.
