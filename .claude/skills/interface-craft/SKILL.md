---
name: interface-craft
description: Design-engineering rulebook for building interfaces that feel right, covering buttons, menus, popovers, tooltips, tabs, toasts, drawers, sheets, sliders, switches, command palettes, forms, number and text morphs, and any animation or gesture. It distils Emil Kowalski's and Rauno Freiberg's public writing, plus the measured values and lessons from components built and verified frame by frame (Rauno's toolbar morph, iOS 26 liquid-glass controls, the iOS app folder, the rolling number, the Piruicy site). Use it whenever you build, review or polish UI, choose an easing, duration or spring, add hover/press/focus states, handle drag or swipe, or when someone says a UI "feels off", "janky", "cheap", "slow" or "not like Apple".
---

# Interface craft

Most details are never consciously noticed, and that is the point. A control that behaves exactly as someone assumed lets them carry on without a thought. Quality is the sum of hundreds of invisible, correct decisions. Every rule below either comes from a public source (credited in `references/sources.md`) or was measured on a build that was accepted or rejected.

## How to use this skill

1. Before building, read the reference for what you're touching:

   | Touching | Read |
   | --- | --- |
   | Any animation: easing, duration, spring, stagger, blur, reduced motion | `references/motion.md` |
   | Gestures, drag, swipe, hover, keyboard, focus, feedback, latency, Fitts | `references/interaction.md` |
   | A specific component (button, tooltip, menu, tabs, toast, drawer, sheet, switch, slider, number, toolbar…) | `references/components.md` |
   | Typography, spacing, radii, colour tokens, shadows, z-index, copy | `references/polish.md` |
   | Forms, inputs, touch devices, accessibility | `references/forms-touch-a11y.md` |
   | Glass, refraction, WebGL, canvases | `references/glass-and-webgl.md` |
   | Recreating a reference, verifying feel, checkpoints, reviews | `references/process.md` |
   | The house taste: what this studio accepts and rejects | `references/house-style.md` |

2. Answer the five motion questions below before writing any animation.
3. Build, then verify with the loop in `references/process.md`. Nothing is done until it has been checked in the browser.

## The five motion questions (in order)

**1. Should it animate at all?** Frequency decides.

| How often it's seen | Decision |
| --- | --- |
| Hundreds of times a day (command palette, shortcuts, context menu) | No animation. Ever. |
| Tens of times a day (list hover, tab switching, filters) | Instant, or a trivial fade |
| Occasionally (modal, drawer, toast, popover) | Standard animation |
| Rarely or once (onboarding, first run, celebration) | Room for delight |

Anything started from the keyboard is instant. If updates arrive faster than the animation lasts, skip it.

**2. What is its job?** It must be one of these: show where something came from or went (spatial consistency), show a change of state, explain how something works, acknowledge input, or stop a jarring pop. "It looks cool" is not a job for anything seen often.

**3. Which easing?**
- Entering or leaving: ease-out, `cubic-bezier(0.23, 1, 0.32, 1)`.
- Already on screen and moving or morphing: ease-in-out, `cubic-bezier(0.645, 0.045, 0.355, 1)`.
- Hover or colour: `ease`.
- Time or progress made visible: `linear`.
- Sheets and drawers: `cubic-bezier(0.32, 0.72, 0, 1)`.
- Never `ease-in` for UI; it delays the moment the eye is watching. The browser's own `ease-out` is too weak.

**4. How long?**
- Press: 100–160ms.
- Tooltip: 125–200ms.
- Dropdown or select: 150–250ms.
- Modal or drawer: 200–300ms.
- Page: 300–400ms.
- UI stays under 300ms. Exits run about 20% faster than entrances. Longer travel or a bigger object takes longer.

**5. Duration or spring?** Use a spring when the value follows a finger or pointer, can be interrupted mid-flight, or should feel alive. Critically damped (no overshoot) is the default. Add bounce only on purpose. The measured configs are in `references/motion.md`.

## The laws (break one only with a written reason)

1. **Animate only `transform` and `opacity`** (and small blurs). Never width, height, margin, padding, top or left. For widths, animate a measured value.
2. **Nothing appears from `scale(0)`.** Start from 0.9–0.96 plus opacity. Dialogs start from 0.9–0.95.
3. **Popovers grow from their trigger.** Set `transform-origin` there. Modals are the exception and stay centred.
4. **Every pressable thing answers the press.** Use `scale(0.97)` on `:active`, 0.94 for small icon buttons, 0.98 for cards, over 150–160ms ease-out.
5. **Transitions, not keyframes, for anything that can be retriggered.** Transitions retarget mid-flight; keyframes restart from zero.
6. **Slow where the user is deciding, fast where the system responds.** A hold fills over 2s linear and snaps back in 200ms. Opening takes longer than closing.
7. **Hover is an enhancement, never a requirement.** Gate it behind `@media (hover: hover) and (pointer: fine)`. Add about 100ms of hover intent before a hover animation. Never hide content until hover.
8. **Hit areas are at least 44px** on touch (24px minimum anywhere), even when the control looks smaller. Leave no dead zones between a label and its control.
9. **No layout shift.** Use tabular numbers for anything that changes. Keep the font weight fixed across states. Reserve space for async content. Skeletons match the final layout.
10. **Keyboard parity.** Every flow works by keyboard, with a visible `:focus-visible` ring. Focus is trapped in modals and returned to the trigger on close.
11. **Reduced motion means gentler, not dead.** Swap movement for a short fade and keep the feedback. Motion that *is* the function (a hold-to-confirm fill) stays.
12. **Destructive actions need friction.** Confirm them, give an undo window, or require a sustained gesture that commits only at the gesture's end.
13. **Feedback lives next to its cause.** An inline check on copy, the error beside its field, a loading state inside the button that keeps its label.
14. **Frequent actions cost no frames.** Keep mounted what will be shown again. Never remount heavy pieces on a filter click.
15. **Measure, don't guess.** When recreating something, extract its frames and fit its numbers. Invented physics fails side by side (`references/process.md`).
16. **Restore before rewriting.** Keep an existing component's mechanics. Change only what a comparison proves wrong, and checkpoint first.
17. **Every piece is live on load.** No poster-until-hover, no reveal-on-scroll. Performance is budgeted some other way.
18. **Colour is never the only signal.** Pair it with a word or a glyph.
19. **Good defaults beat options.** Customisation comes only after the behaviour is final.
20. **Credit the inspiration openly,** and show the reasoning behind the result (measured details next to the demo).

## Review format (required when reviewing UI)

Use one table with one row per issue:

| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: transform 200ms var(--ease-out)` | Name the properties; `all` animates by accident |
| `scale(0)` on enter | `scale(0.95); opacity: 0` | Nothing appears from nothing |
| Popover `transform-origin: center` | `var(--radix-popover-content-transform-origin)` | It should grow out of its trigger |
| `:hover { transform: … }` everywhere | Wrapped in `(hover: hover) and (pointer: fine)` | Touch fires hover on tap |
| Command palette fades in over 200ms | Opens instantly | Opened hundreds of times a day |

End every review with the five checks that most often fail: keyboard path, focus ring, reduced motion, 375px width with no horizontal scroll, and hover-only dependencies.

## Stack notes

- **Tokens.** Define easing, duration, radius and colour as CSS custom properties, and flip colour tokens per theme. Don't scatter Tailwind `dark:` overrides. The token set is in `references/polish.md`.
- **Motion (Framer Motion).** The `x`, `y` and `scale` shorthands run on the main thread. Pass a full `transform` string when the page is busy. Pass `velocity: 0` when animating right after a `set()`. Use `AnimatePresence mode="popLayout"` when an exiting item sits in a group.
- **Radix/shadcn.** Popovers expose `--radix-*-transform-origin`; use it. Keep native `<select>` where it suffices; it is accessible and fast.
- **CSS first**, then the Web Animations API, then a JS library, and a library only where springs or interruptible gestures need it.
