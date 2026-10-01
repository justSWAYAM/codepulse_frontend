# Component recipes

Each recipe is the behaviour that was accepted, with its numbers. The easing names refer to the tokens in `motion.md`.

## Button

- A real `<button type="button">`; `submit` only inside a form. Never a clickable `div`.
- Press: `transform: scale(0.97)` on `:active`, `transition: transform 150ms var(--ease-out)`. Use 0.94 for small icon buttons and 0.98 for large cards or tiles.
- Hover (fine pointers only): a colour or background change on `ease`, about 150ms. Never change the font weight; it shifts the layout.
- Hover, active and focus each have more contrast than rest. The focus ring is visible and sits outside the shape.
- Label: a specific verb ("Save key", not "Continue"). "…" means it opens something more ("Rename…").
- Put the shortcut in the tooltip ("Save ⌘S").
- Icon-only buttons need an `aria-label`, and a 44px hit area through `::after`.

### Async button (idle → loading → success/error → idle)

- The label stays. Its width is fixed or springs to the measured width, so there's no jump.
- While loading: `aria-busy="true"` and `aria-disabled="true"` (keeps focus; `disabled` would drop it). Swallow repeat presses. No press scale.
- The result shows for about 1.6s, then returns to idle. Announce it through `aria-live`.
- The state swap crossfades with a 2px blur and a small scale, over 150–200ms.

## Copy button

- Both icons are always mounted. They trade places with opacity, `scale(0.8)` and `blur(2px)` over 150ms, and revert after 2s.
- Press 0.94. A visually hidden live region says "Copied to the clipboard".

## Tooltip

- Wait about 300ms before the first. It appears over 125–150ms from `scale(0.95–0.97)` plus a 3px offset toward its anchor, with its origin at the anchor.
- "Warm" state: for about 400ms after a tooltip closes, the next one opens instantly with no animation.
- It never holds interactive content, and there's none on a disabled button. It shows on keyboard focus (`:focus-visible`) as well.
- In a toolbar, one tooltip slides between buttons rather than one per button (see Toolbar).

## Popover, dropdown, select

- Enter over 150–180ms on `--ease-out`, from `scale(0.95–0.96)` plus opacity (a 2px offset toward the trigger is optional). Exit over about 120ms.
- `transform-origin` is the trigger (`--radix-popover-content-transform-origin`, or top-left when it drops from a left-aligned trigger).
- Open on `pointerdown`. Escape closes and returns focus. Clicking outside closes without stealing focus back.
- Prefer a native `<select>`. Modern `base-select` / `::picker(select)` can be styled and animated with `@starting-style`.
- Context and command menus open instantly (frequency rule).

## Menu with submenu

- The row that opens a submenu keeps a **safe triangle** from the pointer to the submenu's near edge (±6px at top and bottom), done as a `clip-path: polygon()` element.
- The submenu opens over 130ms from `scale(0.97)`, origin at its top-left.
- ArrowRight or Enter opens it, Escape closes it, and focus opening it works too. Use `aria-haspopup`/`aria-expanded`; closed submenus are `inert`.

## Tabs and segmented controls

- **Clip-path tabs.** Draw the list twice. The top copy is styled active, `inert` and `aria-hidden`, clipped to the active tab with `inset(0 R% 0 L% round h/2)`, and transitions `clip-path` over 250ms `ease`. Background and text colour then move as one, which per-tab colour transitions can never do. Measure in a layout effect and on ResizeObserver. The first placement is instant.
- Keyboard selection (arrows, Home/End, or a click with `detail === 0`) moves the highlight **without animation**.
- Keep the same font weight in both states. The underline selection mark is 1.5px at a 6px offset.
- Grid columns `repeat(n, minmax(0, 1fr))` so long labels can't break the track. Fit the label size with a formula, not by shrinking everything.
- **Selection on release.** Pressing an unselected segment dims its label (to about 30% alpha). It selects on pointer-up only if the pointer is still over it.

## Toast stack (Sonner's behaviour, rebuilt)

- CSS transitions (400ms `ease`), not keyframes, so rapid toasts retarget.
- Three visible. Each older layer lifts about 14px and scales 0.05 smaller. Hidden toasts take the front toast's height.
- Hovering the stack expands it; hover counts only over the stack. An 8px `::after` fills the gaps.
- Swipe away past about 45px or faster than 0.11px/ms. Pulling the wrong way resists (`−√(−dy)·2`).
- Lifetime 4–5s. The timer pauses on hover, on focus and while the tab is hidden, and keeps the remaining time.
- Mount first, then enter on the next frame. Reduced motion: a 200ms opacity fade only.

## Drawer / bottom sheet (Vaul's behaviour, rebuilt)

- 500ms on `--ease-drawer`. `translateY(100%)` hides it at any height. The scrim uses the same timing.
- The page behind recedes to `scale(0.96) translateY(12px)` with radius 12, transform-origin at the current scroll position, and follows the drag.
- Close past 30% of the height or faster than 0.4px/ms. Above fully open, it resists with `−8·ln(1 − dy/8)`.
- Never drag while the content is scrolled, nor within 100ms of it reaching the top. Ignore a second pointer. Controls inside don't start a drag.
- Write the transform inline while dragging (no CSS variable). Mount, wait two frames, then show.
- Behaves as a dialog: focus trap, Escape, focus returns, body scroll lock, `overscroll-behavior: contain`. Keep inputs above the on-screen keyboard.

### Detented sheet (iOS 26)

- Measured detents at 658, 400 and 54pt of an 852pt screen. Side inset 9 → 5.5 → 0 as it rises. Top radius 34. Bottom radius concentric with the display (55 − inset).
- Follows the finger 1:1 after 6px. Velocity is the average of the last 6 samples.
- Release:
  - above 500pt/s, go to the next detent in that direction;
  - otherwise go to the detent nearest `top + v·0.12s`.
- Dismiss only when more than 60pt below the smallest detent, or when flung down from it.
- Snap critically damped (ω 25). The view behind dims by 20%.
- The grabber is a button: tap cycles detents, ↑/↓ resize.

## Modal dialog

- Centred, with `transform-origin: center`. Enter over 200–250ms from `scale(0.95)` plus opacity; exit about 20% faster. Scrim and panel share timing.
- Autofocus the first input on desktop only; on touch it throws up the keyboard.
- Destructive confirm: name the action on the button ("Delete 3 files"), never "OK".

## Hold to confirm / hold to delete

- A tinted copy of the button is wiped in with `clip-path: inset(0 100% 0 0) → inset(0)`: 2s `linear` while held, 200ms `--ease-out` back on release. Press scale 0.97 over 160ms.
- Fire on the clip-path `transitionend` **only if still held**. Reset about 1.4s after firing.
- Holding works from the keyboard too (Space/Enter keydown/keyup, repeats ignored). Pointer capture; release on up, cancel, lost capture and window blur.
- `user-select: none`, `-webkit-touch-callout: none`, context menu prevented. A live region announces the result.
- Reduced motion keeps the fill (it is the function) and drops only the press scale.

## Slide to confirm

- The thumb follows the drag. It confirms at 92% or more; otherwise it springs back.
- On release, velocity is clamped away from commit, so it can never coast into a destructive confirm.
- The end turns to the danger colour only near commitment. Before the user moves, the danger fill has zero width.
- Keys: arrows step 8%, and reaching the threshold by key confirms; End confirms, Home returns; Enter/Space confirm.

## Switch

- `<button role="switch" aria-checked>`. Space and Enter toggle. Guard against repeats. (Write the space literal as `String.fromCharCode(32)` if a CLI might trim `' '`.)
- Dragging starts past 4px and is relative to the grab point. Commit if past half. Pointer-cancel reverts. Ignore the click that follows a drag.
- The thumb travels on a critically damped spring (about 360/38 for a tap, 460/43 after a drag). The fill colour eases over about 400ms.
- The glass version is in `glass-and-webgl.md`. The CSS fallback is a thumb on 320ms quart and a background on 220ms.

## Slider

- The hit area is much taller than the track (48px, plus `::before { inset: 0 -24px }` so the ends can be grabbed). End icons have `pointer-events: none`.
- The thumb centre travels the full track, and the fill ends exactly at the value.
- Past the ends, rubber-band (`R·x/(x+R)`, R 14px), and the track shifts slightly with the overshoot.
- Held thumb follows at k 900, released at k 360, both critical. Stretch `1 + min(0.3, |v|/1600)` while lifted.
- Keys: arrows ±5%, PageUp/PageDown ±10%, Home/End. `role="slider"` with a live value.

## Rolling number (digits)

- One column per digit: the current digit in flow, plus two cyclic 0–9 strips above and below inside a one-slot window (slot 1em + a 0.15em mask).
- A change offsets the column by the roll distance and springs it to 0 (86/18.6, critical, `velocity: 0`). Opacity is a separate ~1s ease-out.
- Direction: `auto` rolls each digit the short way. `up`/`down` always spin one way and wrap (`(to − from + 10) % 10`).
- New columns widen from 0 and fade in. Leaving columns roll to 0, fade and then unmount. `overflow-x: clip` on the cell stops them piling up.
- Build from `Intl.NumberFormat().formatToParts()`. Key columns by place, not index. `tabular-nums`. Screen readers get the plain value.

## Text morph / width morph pill

- Measure a hidden twin of the *next* label (in a layout effect, and again on `document.fonts.ready`). Measuring the animating node gives the leaving word's width, one swap behind.
- Width springs (200/26) to the measured width plus padding.
- The word enters from y −13 to −26 with blur 5–8px over about 280–340ms on quart, and exits the opposite way, faster (180–250ms). An optional tiny x-shake settles it.
- Auto-advance every 2.4–5s, never with reduced motion. It pauses when off-screen.

## Toolbar morph and command palette (Rauno's toolbar, measured)

- **Bar:** 204×44, radius 22, 32px round buttons, 16px glyphs at a 1.5px stroke, hover `#272727` on black.
- **Tooltip:**
  - One label strip holds every label, seen through a `clip-path: inset(... round 8px)` window 12px above the bar.
  - Moving between buttons slides the window to the new button and the strip the other way, both on 324/33.
  - The first appearance jumps into place and fades in over 220ms. Leaving the bar fades it over 220ms; it stays up while the pointer crosses the bar's padding.
  - It is hidden while the palette is open and during programmatic focus return.
- **Morph:**
  - The bar grows from its bottom centre into a 560×500 palette (radius 20), opening on 240/28 and closing on 272/32.
  - Bar icons blur 4px and drop 16px out, 20ms apart, and come back from +175ms, 23ms apart.
  - Palette content enters at +220ms (rise 12px, from blur 8), and leaves in 80ms.
- **Keyboard:**
  - ⌘/Ctrl+K toggles. Tool letter keys work unless typing.
  - Roving tabindex with wrapping arrows and Home/End.
  - The palette is a combobox (`aria-activedescendant`), with no row highlighted on open. Enter runs, Escape closes and returns focus.
  - The bar is `inert` while open.
  - Reduced motion: every transition is instant, and the palette fades over 150ms.

## Spinner

- Twelve bars, each rotated `i·30°`, with opacity going linearly from 1 to 0.15 and delays staggered across the cycle. The container never rotates.
- Position the bars exactly at half their size, not with eyeballed offsets, so they stay centred at every size.
- Show after 150–300ms, keep for at least 300–500ms. Reduced motion shows a static, dimmed spinner.

## Stepper / progress through stages

- One indicator travels between stages (a shared `layoutId`, 360ms on an in-out curve), rather than one per stage popping in and out. Continuity makes it read as one flow.
- A status line narrates the same state in words (`aria-live`, atomic).

## One-time-code input

- `type="text" inputmode="numeric"`, with `autocomplete="one-time-code"` on the first box.
- Pasting spreads across the boxes. Backspace in an empty box clears the previous one. Never block paste.

## Skeletons and empty states

- Skeletons match the final layout exactly, sized to avoid shift.
- Design every state: empty (invite the first action), sparse, dense, error (say how to fix it), and very long content (truncate or line-clamp; `min-width: 0` on flex children).
