# Interaction

Mostly from Rauno Freiberg's *Invisible Details of Interaction Design* and his Web Interface Guidelines, plus Emil Kowalski's component posts, all paraphrased, and what our builds proved.

## Direct manipulation and gestures

- Build on real-world metaphors so nothing has to be learned: pages turn, cards stack, objects are grabbed.
- Apply the gesture delta to the object immediately; it follows the finger. Play an animation only after a threshold. If you animate only after the threshold, a slow gesture gets no feedback.
- Lightweight, reversible actions (a peek, a search overlay) may fire partway through a gesture. Destructive or committing actions fire **only when the gesture ends**, however far it travelled.
- Never snap a peek to its final state while the finger is still down; they may reverse.
- Start a drag only past a small threshold (4–6px), measured relative to the grab point, never jumping the object to the pointer.
- Once a drag starts, keep tracking outside the control's bounds with `setPointerCapture`.
- Ignore a second pointer mid-drag, and never start a drag from a control inside the draggable.
- Never drag a sheet while its content is scrolled. Wait about 100ms after the content reaches the top.
- While dragging, make the surroundings `inert` and turn off text selection. Set `touch-action: none` on custom pan and zoom surfaces.
- Every drag or swipe has a click and keyboard alternative.

### Release: distance *or* velocity

- **Toast:** dismiss past about 45–80px or faster than 0.11px/ms.
- **Drawer:** close past 30% of its height or faster than 0.4px/ms.
- **Sheet:** above 500pt/s, go to the next detent in that direction. Otherwise go to the detent nearest the projected position (`top + v·0.12s`).
- **Projection** for flinging to a target: distance = (v/1000 · d)/(1 − d), with deceleration d = 0.998 (the iOS scroll value).
- Keep thrown momentum and angle. A dismissed card never lands perfectly centred on a fixed timing.
- A destructive control never coasts toward commit. On release, clamp its velocity to zero or away from commit (`v = min(0, v·0.12)`).
- Holding still more than about 80ms before release kills the fling.

### Past the boundary: damp, don't stop

Real objects slow down before they stop. Pick one curve:

- rubber band `R·x/(x + R)` with R ≈ 14px for thumbs and ≈ 120 for sheets;
- log `−8·ln(1 − dy/8)`;
- square root `−√(−dy)·2`.

## Spatial consistency

- A view enters from the element that spawned it and leaves back into it. A toast leaves the way it came, which is what makes swiping it away obvious.
- `transform-origin` is the physical starting point: a popover grows from its trigger, a menu from the button that opened it, a palette from the bottom centre of its toolbar.
- One surface keeps one origin everywhere.
- When shape A becomes shape B, keep it one continuous object. Morph the container and carry the content inside the shape; don't slide content relative to it. Our menu felt "unsettling" until the content rode inside the shape.
- Depth shows what is interactive: blur or dim the backgrounded layer and keep the active layer crisp. A drawer's page recedes to `scale(0.96)`, 12px down, radius 12.
- Keep grids and positions stable from page to page so navigation never feels like the layout moved.

## Frequency and novelty

- The more often something happens, the less it moves:
  - command menus open instantly;
  - context menus open instantly, with at most a short fade on close;
  - keyboard switchers never animate.
- Skip an animation when the next update arrives within its duration (about 150ms).
- About 90% familiar, 10% new. Novelty is an accent: put it where it happens once (onboarding, a first run), and give it quiet surroundings so it stands out. Never put two high-novelty moments back to back.
- Animate state changes that come from input. Don't animate the page for loading.

## Fitts's law and targets

- Frequent targets are big and near. Screen edges and corners behave as infinitely large targets.
- Radial menus opened at the pointer put every option at the same distance.
- The visible target and the hit area agree. Make the hit area at least 24px, and 44px on touch, using a pseudo-element (`::after { inset: -10px }`).
- Hit areas are concentric around small visuals. Siblings, never nested buttons.
- No dead zones: a label and its checkbox form one target; padding goes inside list rows, not gaps between them.
- Decorative overlays get `pointer-events: none`.

## Hover and pointer intent

- Hover intent: wait about 100ms before a hover-driven animation, so passing over does nothing.
- Animate a child, not the hovered element, or the moving element leaves the pointer and flickers.
- Fill the gaps between hover targets (for example an 8px `::after` between stacked toasts) so hover never drops in between.
- Tooltips wait before the first (about 300ms). While "warm", about 400ms after one closes, neighbours open instantly with no animation.
- A submenu keeps a safe triangle from the pointer to the submenu's near edge (±6px), so a diagonal move doesn't close it. Leaving the triangle closes it unless the pointer entered the submenu.
- Open dropdowns on `pointerdown`/`mousedown`, not click; it feels a frame faster.

## Feedback and latency

- Respond on press, not on release: a press scale, a pressed tint.
- Loading indicators wait 150–300ms before appearing, then stay at least 300–500ms, so they never flicker.
- A loading button keeps its label, shows the indicator inside it and stays focusable. Use `aria-busy`/`aria-disabled`, not `disabled`, which drops focus.
- Update optimistically when success is likely. On failure, roll back with a clear error or an undo.
- Toggles take effect immediately, with no confirm.
- Destructive actions are confirmed, undoable, or held.
- Timed things (toasts, auto-advance) pause on hover, on focus and while the tab is hidden, and keep their remaining time.
- Announce async results through a polite live region.
- When a finger covers what it's doing, echo it where it can be seen (a loupe above the finger, an enlarged key).
- Small objects that are satisfying to fiddle with are a feature.

## Keyboard and focus

- Follow the WAI-ARIA patterns:
  - roving tabindex in toolbars and tab lists, with arrows wrapping and Home/End;
  - comboboxes use `aria-activedescendant`;
  - ↑/↓ move through lists.
- Draw focus rings with `:focus-visible` and give them room without moving layout (padding plus matching negative margin, or `box-shadow`). Never `outline: none` without a replacement.
- Tab only through what is visible. Mark closed panels `inert`, and scroll focused items into view (`block: 'nearest'`).
- A modal moves focus in, traps it, and returns it to the trigger. If focus returns programmatically, don't raise a tooltip because of it.
- A click with `event.detail === 0` came from the keyboard. Use it to skip the animation for keyboard-driven selection.
- Show shortcuts in tooltips and menus with the platform's symbol (⌘ vs Ctrl), read after mount so hydration doesn't break.
- A shortcut belongs to one owner. When a component on the page owns ⌘K, the site header yields it.
- Scroll stays with the surface it started in.
