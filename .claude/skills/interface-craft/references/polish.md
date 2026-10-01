# Polish: type, space, colour, surfaces, copy

## Typography

- `-webkit-font-smoothing: antialiased`. `text-rendering: optimizeLegibility`. `-webkit-text-size-adjust: 100%`.
- **Few sizes, few weights.** At most three sizes and three weights per component (for example 12 / 14 / 16px at 400 / 500 / 600). Nothing below 400. Line heights sit on the 8px rhythm (16 / 24 / 32).
- Tracking tightens as size grows: about −0.035em for display, −0.03em for titles, −0.015em for UI labels, 0 for body. Small uppercase labels get positive tracking.
- Fluid sizes use `clamp()` between a phone and a large desktop, set against the real size of what sits on the page.
- `text-wrap: balance` on headings and `pretty` on prose. Prose measure about 65ch.
- `font-variant-numeric: tabular-nums` on timers, counters, prices, tables and anything that ticks.
- Never change weight between states. Use colour, not boldness, to mark selection.
- A fallback font with matching metrics (`size-adjust`, `ascent-override`, `descent-override`) stops the page jumping when the web font arrives. Preload the critical font file.
- Real typographic characters: … (ellipsis), curly quotes, × for dimensions. Keep units and shortcuts together with a non-breaking space (`10 MB`, `⌘ K`).
- Underline only links (a selection indicator drawn as a line is a deliberate exception). Italic is for citations and credits.
- Scale text by animating a wrapper, not the text node.
- A canvas that draws text must `await document.fonts.load('600 16px "Inter Variable"')` before drawing, or it paints the fallback.

## Space and layout

- An 8px base grid: gaps, padding and grouping are multiples of 8 (4 for hairline adjustments).
- **Radii are concentric.** A nested surface's radius is the outer radius minus the gap between them, and never larger than its parent's. For example an outer card at 24 with a 24px inset holds nested surfaces at 16; a sheet's bottom radius is the display radius minus its inset.
- Controls keep their functional geometry (capsules stay capsules).
- Separate four layers: the outer surface, the safe content area, the interactive control, and supporting text. Leave room for anything that expands or lifts, so no active shape or shadow is ever clipped. Canvases overhang their control by at least 24px, and pages use `overflow-x: clip`.
- Optical alignment beats geometric alignment. Nudge by ±1px where the eye disagrees (play icons, arrows, text beside icons).
- Prefer flex, grid and intrinsic sizing to measuring in JS. Use container queries when a widget should respond to its own width.
- Handle notches with `env(safe-area-inset-*)`, and anchors with `scroll-margin-top` equal to the sticky header's height.
- Check 375px, 390, 414, 768, 1366, 1440, 1536 and 1920. There must be no horizontal scroll at any width.

## Colour and tokens

- Use a **numeric 12-step scale per hue** (after Radix):
  - 1–2 app and subtle backgrounds;
  - 3–5 component backgrounds (rest, hover, pressed);
  - 6–8 borders (subtle, default, strong or focus);
  - 9–10 solid fills;
  - 11 low-contrast text;
  - 12 high-contrast text.
- Dark mode swaps the variables; components never change.
- Build scales in OKLCH/LCH, not HSL, so equal lightness looks equal across hues. Status colours then share one lightness and chroma, and red doesn't shout louder than green.
- Colour carries meaning. About 90% neutrals; accent and status colour only where they mean state, action or data. No decorative gradients or glows.
- On a tinted background, shift borders, shadows and secondary text toward that hue.
- Focus rings are grey, black, white or one consistent accent. A coloured ring must not clash with the surface.
- Dark themes set `color-scheme: dark`, `<meta name="theme-color">`, and an explicit background and text colour on native `<select>`.
- Contrast: check body text against its real surface. Prefer APCA to WCAG 2 when they disagree.

## Surfaces, borders, shadows

- A shadow border blends better than a solid one: `box-shadow: 0 0 0 1px rgb(0 0 0 / .06)`.
- Hairlines are 0.5px on 2× screens (`min-resolution: 192dpi`) and 1px elsewhere.
- Layered shadows, at least two: a tight contact shadow plus a soft ambient one, for example `0 2px 8px rgb(0 0 0/.06), 0 16px 32px -16px rgb(0 0 0/.24)`.
- In dark UI, depth comes from lighter surfaces, not shadows.
- Pair semi-transparent borders with shadows for a crisp edge.
- A radial gradient is cheaper than a big blurred shape and doesn't band.
- Decorative layers: `pointer-events: none`, `user-select: none`, and `aria-hidden` (or one `role="img"` with a label on the container).

## Stacking

- Use a fixed scale, never 9999. For example:

  | Layer | z-index |
  | --- | --- |
  | Rail | 100 |
  | Sticky | 200 |
  | Overlay | 300 |
  | Sheet | 310 |
  | Popover | 400 |
  | Tooltip | 500 |
  | Toast | top |

- Prefer `isolation: isolate` for local stacking contexts.

## Scrollbars

- Leave the page's scrollbar native (tinting it is fine). Style scrollbars only inside small elements like code blocks.
- For testing, set the OS to always show scrollbars.
- Never fade the edges of a scrollable list.

## Copy

- Active voice, second person, action first. Specific button labels, consistent nouns.
- Numerals for counts. Currency always with 0 or 2 decimals. Dates, numbers and currency through `Intl.*`.
- Every screen offers a next step. Every error says how to fix it.
- Prefer an inline explanation to a tooltip.
- `<title>` reflects the current context.
- Put UI state (filters, tabs, open panels) in the URL so it survives refresh, sharing and Back.
