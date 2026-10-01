# House style: what this studio accepts and rejects

These are the judgements behind the Course Seminar site, its Studio components and piruicy.com, recorded from real verdicts. Use them as defaults; a project's own brief overrides them.

## Anchors

- **Emil Kowalski** (emilkowal.ski): craft, restraint, and timing tuned to purpose.
- **Rauno Freiberg** (rauno.me): invisible details, direct manipulation, physics.
- Also studied: Apple (the measure of "feels right"), Aave, Chanh Dai, Benji Taylor.
- When a detail is in doubt, ask what these people would ship, and what they would cut.

## Two idioms

### 1. Product and component surfaces (the Studio baseline)

- 8px grid.
- Outer cards: 24px radius and 24px inset, on mobile too. Nested surfaces 16px. Controls keep their capsule geometry.
- Only Inter and Baskerville (monospace for code). At most three sizes and three weights per component, for example 12/16px and 400/500/600, with line heights on the 8px rhythm.
- Restrained surfaces, soft corners, purposeful colour.
- Motion answers interaction. No decorative gradient backgrounds.

### 2. Showcase and editorial surfaces (the Piruicy "gallery, unframed" idiom)

- **Palette:** warm paper (`#F3F1EC`), ink (`#121212`), one grey (`#77726A`), hairline rules (`#D9D4CA`) only between list rows.
- **Objects rest directly on the page** with their own soft shadow. No cards, boxes, plinths or borders around the work; cards around components read as immature.
- **Type:**
  - a high-contrast classical serif (Baskerville, or Newsreader as the free stand-in) for headlines, titles and captions;
  - Inter for small UI;
  - a small mono for code;
  - three sizes in view: one large serif headline, 16px body, 13px captions.
- **Very few words.** A caption is title plus credit, with the credit in italic ("Switch, *after Apple*").
- **One live object** at the centre of the stage. The stage rotates through the collection instead of cramming it.
- **No badges, ticks, comparison tables, "most popular", icons outside the components, gradients or glows.** There is one plan, not three.
- **Copy leans honest:** the name reads as "piracy", so every inspiration is credited openly and exactly. Never let a generator invent a credit.

The blog idiom (the seminar site) sits between the two: a narrow prose column, Inter with tight tracking on headings, and interactive demos embedded inline in bordered canvases instead of static screenshots.

## Verdicts that became rules

- **Every piece is live and visible on load.** No poster-until-hover, no lazy "come alive" reveal. Budget WebGL some other way. When told something is wrong, fix it; don't defend the earlier choice. What is seen on screen overrides any handoff note.
- **As Apple as possible.** Motion is matched frame for frame to the reference. "No jiggle" and "too liquid" were both rejections. The target is fluid but not too much, and it is reached by measuring.
- **Glass is pure refraction,** quiet at rest, never milky, never glowing.
- **Keep the owner's mechanics.** Restore their component, then change only what the numbers prove.
- **Show the reasoning.** Each work's page carries a few measured "Details" (the springs, the timings, the thresholds) next to the live piece.
- **Differentiation lives in structure, not skin.** If a design could pass for any competitor once the logo is covered, it fails. Changing its colours won't save it; it needs a signature element or layout nobody else has.
- **Novelty in small doses.** One unexpected thing per page, surrounded by calm.
- **Customisation after behaviour.** A component gets knobs only once its feel is signed off.
- **Credit and licence carefully.** Paid course material and paywalled source code are studied, never redistributed. Rebuild from behaviour and public writing, and link the original.
