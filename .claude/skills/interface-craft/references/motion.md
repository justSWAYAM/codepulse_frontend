# Motion

## Easing tokens

Built-in CSS keywords are too weak. Use these curves, which are the classic Penner curves as used by Emil Kowalski and in our builds:

```css
:root {
  --ease-out:        cubic-bezier(0.23, 1, 0.32, 1);      /* quint: default for enter/exit */
  --ease-out-quart:  cubic-bezier(0.165, 0.84, 0.44, 1);  /* softer; good for text rises */
  --ease-out-quad:   cubic-bezier(0.25, 0.46, 0.45, 0.94);/* gentle exits, press release */
  --ease-out-expo:   cubic-bezier(0.19, 1, 0.22, 1);      /* snaps out hard, glides in */
  --ease-in-out:     cubic-bezier(0.645, 0.045, 0.355, 1);/* cubic: moving on screen */
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);  /* quart: clip-path reveals, 1s */
  --ease-drawer:     cubic-bezier(0.32, 0.72, 0, 1);      /* iOS sheet / Vaul */

  --dur-press: 150ms;
  --dur-micro: 120ms;
  --dur-ui:    200ms;
  --dur-sheet: 320ms;
  --dur-page:  400ms;
}
```

| Situation | Easing |
| --- | --- |
| Enters or leaves the screen | `--ease-out` |
| Already visible and moves, morphs or resizes | `--ease-in-out` |
| Hover or colour change | `ease` |
| Progress, a hold fill, a marquee (time made visible) | `linear` |
| Sheet or drawer | `--ease-drawer` |
| Anything in UI | never `ease-in` |

Paired elements animate as one unit, with the same easing and duration: modal and scrim, drawer and backdrop, tooltip and arrow.

## Durations

| Element | Duration |
| --- | --- |
| Press feedback | 100–160ms |
| Tooltip, small popover | 125–200ms |
| Dropdown, select, menu | 150–250ms |
| Modal, drawer | 200–300ms (library sheets like Vaul use 500ms on `--ease-drawer`) |
| Page transition | 300–400ms |
| Marketing or explanatory motion | can be longer; it still answers the user |

- UI stays under 300ms. Speed is perceived performance: a 180ms select feels quicker than a 400ms one.
- Exit ≈ 0.8 × enter. Values we use:
  - popover 150ms in, 120ms out;
  - hero swap 150ms out, then 250ms in;
  - palette content in over 260ms, out in 80ms.
- When one thing replaces another in the same spot, run it **out, then in**. A crossfade lays two objects on top of each other.
- Spinners: a moderate cycle feels shortest. Perceived wait is convex in spin speed, so neither the slowest nor the fastest wins. We tested 1200, 800 and 400ms cycles over the same 3s wait.

## Springs

`ζ = c / (2·√(k·m))`. ζ = 1 is critical: it arrives as fast as possible with no overshoot.

| Use | Config (stiffness / damping, mass 1) | ζ | Notes |
| --- | --- | --- | --- |
| Value must arrive without overshoot (glass lift in) | 400 / 40 | 1.0 | Lens is clear in about 130ms |
| Settle back (glass lift out) | 256 / 32 | 1.0 | About 230–250ms |
| Sheet snap to detent | ω 25, critical | 1.0 | About 250ms; ζ 0.85 was rejected (overshot after flings) |
| Rolling digits | 86 / 18.6 | 1.0 | ω ≈ 9.3 rad/s, fitted against Motion's example |
| Drag follow (held thumb) | k 900, critical | 1.0 | Tight, but not 1:1 jitter |
| Released thumb | k 360, critical | 1.0 | |
| Tooltip sliding between buttons | 324 / 33 | 0.92 | Fitted over 13 slides of Rauno's toolbar |
| Bar → palette morph, open | 240 / 28 | 0.90 | |
| Palette → bar, close | 272 / 32 | 0.97 | Close is stiffer, so it is faster |
| Width morph (text pill) | 200 / 26 to 210 / 27 | 0.92–0.95 | |
| App folder (playful, measured) | 200 / 22 | 0.78 | The only visibly bouncy default |
| Surface recoil at pinch-off | 360 / 24 | 0.63 | Only for a shape that tears apart |

Apple-style `{ type: "spring", duration: 0.5, bounce: 0 }` is easier to reason about. Keep bounce at 0 by default, and 0.1–0.3 only for drag-to-dismiss or play.

Springs keep velocity when interrupted, which is why they are the answer for gestures and anything that can reverse mid-flight. CSS keyframes restart from zero.

### Writing your own spring loop

- Use semi-implicit Euler with 3–4 sub-steps per frame and `dt = min(Δ/1000, 1/30)`.
- Snap to rest when |Δ| < 0.05px and |v| < 0.5px/s, then **stop requesting frames**.
- After an idle period, reset the last timestamp, or the first step jumps a whole frame.
- Motion's `animate()` inherits velocity from a preceding `set()`. Pass `velocity: 0`, or it overshoots badly (digits flew about 14 slots).
- Motion's default layout transition was about 6× off Rauno's footage. Never trust a library default to match a reference; fit it.

## Stagger and choreography

- Stagger by hierarchy: the most important element first and longest, the least important only fades, last.
- Delays of 20–50ms between items. Values we use:
  - toolbar icons leave 20ms apart and return 23ms apart;
  - site intro 40ms per step, capped at about 11 steps.
- Stagger is decoration. Never block input while it plays, and never make people wait through two layers of motion (a panel slides in, *then* its items stagger).
- Choreograph from the trigger. The part closest to the finger or pointer leads.
- An intro plays once per session (`sessionStorage`), never with reduced motion, and never on repeat visits.

## Blur, clip-path and masks

- A 2px blur during a crossfade makes two states read as one change. Examples:
  - icon swap: opacity + scale 0.8 + blur 2px over 150ms;
  - word morphs: enter from blur 5–8px.
- Blur is never more than 20px (expensive, worst in Safari), and **never on a WebGL canvas**: Chrome paints dark rows mid-fade.
- `clip-path: inset()` gives layout-free, GPU-friendly reveals. Uses:
  - tabs whose colour and highlight move as one;
  - hold-to-confirm fills;
  - comparison sliders;
  - reveals: `inset(0 0 100% 0) → inset(0)`, 1s `--ease-in-out-strong`.
- Fades use `mask-image`, not an overlay gradient. Never fade the edge of a scrollable list.

## Reduced motion

- `prefers-reduced-motion: reduce` replaces movement with an opacity fade (120–200ms). It does not remove feedback.
- Springs snap to their target; lifts don't happen.
- Motion that is the function stays, for example the hold-to-confirm fill. Remove only its decorative press scale.
- Loops pause, with a visible end state. Autoplaying video gets a play button instead.

## Motion performance

- CSS runs predetermined motion off the main thread. JS (rAF) is for dynamic, interruptible motion.
- The Web Animations API gives JS control at CSS cost.
- While dragging, write `el.style.transform` directly. A CSS variable updated on a large subtree restyles every descendant (our drawer lagged until fixed).
- `will-change: transform` only while a struggling animation runs.
- Pause loops off-screen with IntersectionObserver.
- Switching theme must not animate. Add a no-transitions class for two frames.
- Fake an animated glow with opacity on a pseudo-element rather than animating `box-shadow`.
- Replay a CSS keyframe by changing the React `key`.
