# Forms, touch, accessibility

## Forms

- Wrap inputs in a `<form>` so Enter submits. In a textarea, ⌘/Ctrl+Enter submits and Enter adds a new line.
- Every control has a `<label>`, and clicking the label focuses the control. Icons inside an input are absolutely positioned over it, and clicking them focuses the input.
- Use the right `type`, `inputmode`, `autocomplete` and a meaningful `name`. Turn spellcheck off for emails, codes and usernames. Non-auth fields get `autocomplete="off"` (and `data-1p-ignore`) so password managers stay out of the way.
- Never block paste. Accept any keystroke and validate afterwards; don't block input.
- Keep submit enabled until the request starts, so an incomplete form shows its errors. While the request runs, disable repeats, show progress in the button, and send an idempotency key.
- Errors sit next to their field (`aria-invalid`, `aria-describedby`). On a failed submit, focus moves to the first error.
- Placeholders show an example and end with "…".
- Warn before leaving with unsaved data. Trim trailing whitespace added by text expansion.
- Prefill from what you already know about the user.
- Inputs keep focus and value through hydration. A `value` needs an `onChange`; otherwise use `defaultValue`.

## Touch

- Design for touch first, then enhance for a fine pointer: `@media (hover: hover) and (pointer: fine)` around every hover effect.
- Hit targets are at least 44px on touch, using a pseudo-element when the visual is smaller.
- Input text is at least 16px (`font-size: max(16px, 1em)`), or iOS Safari zooms the page on focus.
- `touch-action: manipulation` on controls removes double-tap zoom. `touch-action: none` goes only on custom gesture surfaces.
- Things you press and hold get `user-select: none` and `-webkit-touch-callout: none`.
- Don't autofocus on touch devices; it throws up the keyboard.
- Video: `autoplay muted loop playsinline`, instead of GIFs.
- Replace the default tap highlight on purpose; don't just delete it.
- Test on a real phone over the network (local dev server by IP, Safari remote devtools). A narrow desktop window is not a phone. Test iOS Low Power Mode too.

## Accessibility

- Use native elements before ARIA: `button`, `a`, `label`, `input`, `select`, `dialog`, `table`. Navigation uses real links, so ⌘-click and middle-click work.
- Icon-only buttons have an `aria-label`. Decoration is `aria-hidden`. Code-drawn illustrations get one `role="img"` with a label on the container.
- Focus:
  - a visible ring on `:focus-visible`;
  - `:focus-within` for groups;
  - never covered by sticky headers;
  - modals trap and return focus;
  - closed panels are `inert`.
- Keyboard patterns follow WAI-ARIA:
  - toolbars and tab lists use roving tabindex;
  - menus open with ArrowDown and close with Escape;
  - sliders use arrows, PageUp/PageDown and Home/End;
  - comboboxes use `aria-activedescendant`.
- Canvas and WebGL controls keep a real control on top (`role="switch"`, `role="radio"`, `role="slider"`) that holds focus, keys and names, and fall back to plain DOM when WebGL is missing or lost.
- Status is never colour alone: pair it with a word, glyph or shape.
- Live regions: polite for toasts, copy confirmations and async results. Atomic for step narration.
- Motion: `prefers-reduced-motion` is honoured by every animation (see `motion.md`). Loops longer than 5s beside other content get pause and stop controls. No autoplay with sound.
- Time limits pause when the tab is hidden (`visibilitychange`), and a user is warned before time runs out.
- Headings are in order, with a skip link. Zoom is never disabled.
- Media has captions and keyboard-operable controls.
