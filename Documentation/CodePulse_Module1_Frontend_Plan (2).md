# CodePulse Enterprise — Module 1: Frontend Plan
**Scope: Frontend only. Pages in scope: Landing Page + Login Page. Backend (Module 0) is already done — do not touch it.**

---

## 1. Purpose of This Document

This is the single reference for building Module 1 of the frontend. It contains:
- The design direction (light mode, modern, non-generic)
- The full component inventory, product-manager style (what it is, where it lives, why)
- The shared foundation that Login depends on
- A strict build sequence
- Copy-paste prompts to hand to an AI coding assistant (Claude Opus / Codex), one per build stage

No code is written here — only specifications and prompts. Whoever executes this (your friend + the AI) writes the code from these prompts.

---

## 2. Tech Stack for Module 1

| Category | Library | Why |
|---|---|---|
| Build tool | Vite + React + TypeScript | Fast dev loop, matches modern React setups |
| Styling | Tailwind CSS + shadcn/ui | Design-token driven, matches Module 0 guide's later shared components |
| Smooth scroll | **Lenis** (`@studio-freight/lenis` or `lenis`) | Explicitly requested — buttery scroll on landing page |
| Animation | **Framer Motion** (`framer-motion`) | Scroll-triggered reveals, hover micro-interactions, page transitions |
| Icons | **lucide-react** | Pairs natively with shadcn/ui, consistent icon weight |
| Forms | React Hook Form + Zod | Required for LoginForm per Module 0 spec, reused everywhere later |
| Data/state | TanStack Query | Required for `useLogin()` and all future API hooks |
| HTTP | Axios | Base for `apiClient`, interceptor pattern |
| Routing | React Router v6+ | `ProtectedRoute`, `AuthLayout` |
| Toasts | shadcn/ui `sonner` | Required by Module 0 spec for global notifications |
| Optional polish | **Vaul** or shadcn `Dialog` | If a "forgot password" or info modal is wanted later — not required for Module 1 |
| Cursor/interaction polish | Framer Motion's `whileHover` / `whileTap` | Covers "fancy button" reactions without extra libraries |

Keep the dependency list this lean. Every extra animation library is one more thing to theme consistently — Framer Motion + Lenis is enough to deliver everything asked for (smooth scroll, reveals, hover/press feedback).

---

## 3. Design Direction (Light Mode Only)

The brief is a coding-contest/assessment platform used by **students, evaluators/teachers, and admins**. The design should read like a workspace for people who write and grade code — not a generic SaaS marketing site. Avoid the default AI-generated looks (cream + terracotta, or dense broadsheet grids). The direction below is specific to this product.

### 3.1 Color tokens
| Token | Hex | Use |
|---|---|---|
| `background` | `#FAFAF8` | Page background — soft paper white, not stark `#FFFFFF` |
| `surface` | `#FFFFFF` | Cards, panels, the login card |
| `ink` (primary) | `#1B1E3A` | Headlines, primary buttons, nav text — deep indigo-navy, not pure black |
| `accent-compile` | `#2F9E6E` | Primary CTA (Login, submit-style actions), success states — reads like a "tests passed" green |
| `accent-syntax` | `#E8A33D` | Secondary highlights, badges, hover underlines — reads like a syntax-highlight amber |
| `accent-error` | `#E85D4E` | Form validation errors only — never decorative |
| `hairline` | `#E4E2DC` | Borders, dividers — thin, not heavy |

### 3.2 Typography
- **Display (headlines):** Space Grotesk — geometric, slightly technical, warmer than a pure grotesk
- **Body:** Inter — neutral, highly legible at small sizes for forms/labels
- **Utility/mono:** JetBrains Mono — used sparingly for: contest IDs, the hero's live-typing code snippet, small eyebrow labels (e.g. "ROLE: STUDENT"). This is what ties the visual language back to "code."

### 3.3 Layout concept
Landing page hero is a **split workspace pane**: left side is the pitch (headline + subhead + CTA), right side is a mock editor panel that types out a short problem statement in the mono face, then shows a green checkmark and "Submitted" — this is the page's single signature moment, and it directly demonstrates the product instead of describing it.

Below the hero: a horizontal strip explaining the three roles (Student / Evaluator / Admin) as three quiet cards — not numbered steps, since this isn't a sequence, it's parallel audiences.

### 3.4 Signature element
The typing-and-submitting code panel in the hero. Everything else on the page (cards, footer, login form) stays quiet and disciplined so this one moment lands. Respect `prefers-reduced-motion` — freeze the panel on a completed state if the user has that setting on.

### 3.5 Motion rules
- Hero panel animation: plays once on load
- Section reveals: fade + slight upward slide on scroll, driven by Lenis + Framer Motion's scroll utilities, staggered per card
- Buttons: subtle scale-down on press (`whileTap={{ scale: 0.97 }}`), color deepen on hover — nothing bouncy or gimmicky
- No parallax overload, no cursor-follow blobs — those read as templated

---

## 4. Site Map for Module 1

```
/                → Landing Page (public)
/login           → Login Page (public, AuthLayout — centered card, no navbar/sidebar)
```

Nothing else exists yet. `/dashboard`, `/contests`, etc. belong to later modules and should not be scaffolded now beyond the redirect target after login. **No signup page or signup route in this module.**

---

## 5. Component Inventory (Product Manager View)

### 5.1 Shared Foundation (build once, used everywhere — required before Login can work)

| Component | Purpose | Where it lives (file location) | Needed for Module 1? |
|---|---|---|---|
| `apiClient` | Axios instance, base URL, JWT attach + refresh interceptor | `src/lib/apiClient.ts` | Yes — Login depends on it |
| `AuthContext` + `useAuth()` | Current user, role, in-memory access token, login/logout functions | `src/context/AuthContext.tsx` | Yes |
| `ProtectedRoute` | Route guard wrapper, role-aware | `src/routes/ProtectedRoute.tsx` | Yes — used to guard the post-login redirect target, even if that target is a placeholder |
| `QueryClient` config | staleTime, retry policy, global error → toast | `src/lib/queryClient.ts` | Yes |
| Toast/notification system | Global success/error, wired to interceptor + mutations | `src/components/ui/sonner` setup in `src/main.tsx` | Yes |
| Form pattern (RHF + Zod) | Standard form + validation convention | `src/lib/formConfig.ts` or documented convention | Yes — LoginForm is the first instance |
| `LoadingState` / `ErrorState` / `EmptyState` | Consistent UI for query states | `src/components/states/` | Yes, at least `LoadingState`/`ErrorState` for the login button |
| Theme setup (Tailwind + shadcn tokens) | Design tokens from Section 3 | `tailwind.config.ts`, `src/index.css` | Yes — everything else depends on this |
| `AppShell` (navbar + sidebar + content) | Layout for authenticated pages | `src/layouts/AppShell.tsx` | **No** — defer to Module 2. Only `AuthLayout` is needed now. |
| `DataTable` (shadcn + TanStack Table) | Reusable paginated/sortable table | `src/components/DataTable.tsx` | **No** — defer to Module 2, nothing to list yet |
| Typed API hooks pattern | One hook per resource | `src/hooks/` | Partially — only `useLogin()`, `useLogout()` needed now |

### 5.2 Landing Page

| Component | Purpose | Placement | Priority |
|---|---|---|---|
| `Navbar` | Brand mark left; nav links center (Product, Roles, How it works); **Login button** top-right, styled as the solid primary `accent-compile` button since it's the one real action available in this module | Sticky top, transparent over hero then solid on scroll | P0 |
| `Hero` | Split pane: pitch + CTA on left, animated code panel on right | First section, full viewport height on desktop | P0 |
| `HeroCTAGroup` | Primary "Log In" (→ `/login`) + secondary "See how it works" (scrolls to Roles section via Lenis) | Directly under hero subhead, left-aligned | P0 |
| `RolesStrip` | Three quiet cards: Student / Evaluator / Admin, one line each on what they get | Below hero | P0 |
| `HowItWorksSection` | Short 3-part explanation of the contest flow (write → submit → get evaluated) — this is the one place a numbered sequence is legitimate, since it is an actual process | Mid-page | P1 |
| `TrustStrip` (optional) | Institution/logo placeholders or a stat line ("Built for classrooms, not just judges") | Below How It Works | P2 — nice to have, skip if content isn't ready |
| `FinalCTASection` | Repeat of the primary "Log In" CTA, full-width band, `accent-compile` background | Just above footer | P0 |
| `Footer` | Minimal — brand, 2–3 links, no fake social icons | Bottom | P0 |

**Navigation to Login is non-negotiable and appears in three places on the Landing Page:** the Navbar button (always visible, sticky), the Hero's primary CTA, and the Final CTA band before the footer. Every one of these routes to `/login`.

### 5.3 Login Page

| Component | Purpose | Placement | Priority |
|---|---|---|---|
| `AuthLayout` | Centered card on `background` color, no navbar/sidebar, small brand mark above the card | Wraps the whole page | P0 |
| `LoginCard` | White `surface` card, `hairline` border, generous padding | Centered, ~400px max width | P0 |
| `LoginForm` | Email + password fields, RHF + Zod validation, inline `accent-error` messages | Inside `LoginCard` | P0 |
| **Login button** | Primary `accent-compile` button, full width of the form, label "Log in" | Directly under password field | P0 |
| `LoginState feedback` | Button shows a spinner via `LoadingState` convention while `useLogin()` is pending; `ErrorState` inline message on 401 | Same button + a line above it | P0 |
| Link back to landing | Small text link, "← Back to home" | Top-left of the card or above the brand mark | P1 |
| Account note | Small text note: "Accounts are created by your institution admin" — no signup flow exists in this module, matching the Module 0 spec, which seeds one Admin user rather than open registration | Below the form | P0 — important so the AI doesn't invent a signup page |

**There is no Signup page, no `/signup` route, and no `authApi.register()` call anywhere in Module 1.** If this changes later, it's a separate module.

---

## 6. Navigation & UX Notes

- **Login button** lives top-right of the navbar on the landing page as the primary, solid-accent button — it's the only account action in this module, so it should read as the main CTA, not a secondary/ghost button.
- The Hero's primary CTA and the Final CTA band both also route to `/login`. A user should never be more than one click from Login regardless of where they are on the landing page.
- Lenis should drive all in-page scrolling, including the "See how it works" anchor-scroll from the hero, so that jump feels as smooth as free scrolling.
- On successful login, redirect to a placeholder authenticated route (e.g. `/dashboard` rendering a plain "Welcome" placeholder) — this exists only so `ProtectedRoute` and the redirect-after-login logic have somewhere real to send the user; do not build the actual dashboard now.

---

## 7. Sequence of Implementation (Frontend, Module 1 Only)

1. Scaffold Vite + React + TS project, install all dependencies from Section 2.
2. Set up Tailwind + shadcn/ui with the design tokens from Section 3 (colors, fonts, radii).
3. Build the shared foundation: `apiClient`, `AuthContext`, `QueryClient` config, toast setup, `LoadingState`/`ErrorState`/`EmptyState`, the RHF+Zod form convention.
4. Build `ProtectedRoute` and a placeholder authenticated landing route for post-login redirect.
5. Build `AuthLayout` + `LoginPage` + `LoginForm`, wired to `useLogin()` → `authApi.login()` → `apiClient`.
6. Build the public `Navbar`, `Hero`, `RolesStrip`, `HowItWorksSection`, `FinalCTASection`, `Footer` for the Landing Page — every CTA routes to `/login`.
7. Integrate Lenis globally and add Framer Motion scroll reveals + button micro-interactions.
8. Wire routing: `/` → Landing, `/login` → Login, unknown → redirect to `/`.
9. Manual QA pass against the Definition of Done below.

---

## 8. Definition of Done (Frontend Module 1)

- [ ] Landing page renders in light mode only, matches the token system in Section 3
- [ ] Navbar, Hero, and Final CTA band all have a working "Log In" link/button routing to `/login`
- [ ] Hero's code-typing panel animates once on load and respects reduced-motion
- [ ] Lenis smooth scroll is active site-wide, including the anchor-scroll CTA
- [ ] Login page uses `AuthLayout` (no navbar/sidebar bleed from the landing page)
- [ ] `LoginForm` validates client-side via Zod before calling the API
- [ ] Failed login (401) shows an inline error, not just a toast, so the user can retry without losing context
- [ ] Successful login stores the access token in memory (never localStorage) and redirects to the placeholder authenticated route
- [ ] No signup page, `/signup` route, or signup API call exists anywhere
- [ ] `AppShell` and `DataTable` are **not** built yet — confirm they weren't accidentally scaffolded

---

## 9. AI Build Prompts

Use these in order, one per message, with Claude Opus or Codex. Paste **Prompt 0** once at the very start of the conversation/session; it gives the AI persistent context so later prompts can stay short.

### Prompt 0 — Project Context (paste once, first)
> I'm building the frontend for a coding-contest/assessment platform called CodePulse, used by three roles: Student, Evaluator, and Admin. The backend (auth: login/refresh/logout, JWT-based) is already built and working — do not generate or modify any backend code. I'm only building Module 1 of the frontend right now, which covers exactly two pages: a public Landing Page and a Login Page. There is no signup page and no registration flow in this module — do not create one. Nothing else should be scaffolded beyond a placeholder redirect target for after login.
>
> Stack: Vite + React + TypeScript, Tailwind CSS + shadcn/ui, Framer Motion, Lenis for smooth scrolling, lucide-react icons, React Hook Form + Zod, TanStack Query, Axios, React Router v6+, shadcn/ui sonner for toasts.
>
> Design direction — light mode only, no dark mode for now: background `#FAFAF8`, surface `#FFFFFF`, primary ink `#1B1E3A` (deep indigo-navy), primary accent `#2F9E6E` (a "compile success" green used for main CTAs), secondary accent `#E8A33D` (amber, used sparingly for highlights/badges), error color `#E85D4E` (validation only), hairline border `#E4E2DC`. Display font Space Grotesk, body font Inter, and a monospace font (JetBrains Mono) used sparingly for code-like details (IDs, a hero code snippet, small eyebrow labels).
>
> Please confirm you've got this context before I give you the first build task.

### Prompt 1 — Project Scaffolding & Theming
> Scaffold a new Vite + React + TypeScript project. Install and configure: Tailwind CSS, shadcn/ui, framer-motion, lenis, lucide-react, react-hook-form, zod, @tanstack/react-query, axios, react-router-dom, and shadcn's sonner component. Set up the Tailwind theme and CSS variables to match the color tokens, font choices, and border-radius/spacing conventions I described in the project context. Set up the folder structure: `src/lib`, `src/context`, `src/routes`, `src/components/ui`, `src/components/states`, `src/layouts`, `src/pages`, `src/hooks`, `src/api`. Don't build any pages yet — just the scaffold, theme, and folder structure.

### Prompt 2 — Shared Foundation
> Now build the shared frontend foundation described in the project context, frontend only:
> 1. An `apiClient` (Axios instance) with a request interceptor that attaches a JWT from memory (not localStorage) and a response interceptor that attempts a token refresh on 401 and redirects to `/login` if the refresh fails.
> 2. An `AuthContext` + `useAuth()` hook holding the current user, role, and access token in memory, with `login`/`logout` functions.
> 3. A `ProtectedRoute` component that checks auth state (and optionally a `roles` prop) and redirects unauthenticated users to `/login`.
> 4. A TanStack Query `QueryClient` with a sensible default `staleTime`, a retry policy, and a global error handler that fires a toast via sonner on failed mutations.
> 5. `LoadingState`, `ErrorState`, and `EmptyState` components for consistent query-state UI.
> 6. A documented React Hook Form + Zod convention (a small helper or shared pattern) that later forms will follow.
> Keep all of this frontend-only — assume the backend's `/api/auth/login`, `/api/auth/refresh`, and `/api/auth/logout` endpoints already exist and work as described.

### Prompt 3 — Login Page
> Build the Login Page using the shared foundation from the previous step:
> - An `AuthLayout` layout: centered card on the app background, no navbar or sidebar, a small brand mark above the card, generous padding, using the surface/hairline tokens from the theme.
> - A `LoginForm` component using React Hook Form + Zod: email and password fields, inline validation errors in the error-accent color.
> - A `useLogin()` hook (TanStack Query mutation) that calls `authApi.login()` through `apiClient`.
> - The submit button should be full-width, primary-accent colored, show a loading spinner while the mutation is pending, and show an inline error message on a 401 response (not only a toast).
> - Below the form, a short line of text noting that accounts are created by an institution admin, since there is no signup flow in this module.
> - A small "← Back to home" link near the top of the card.
> - On successful login, redirect to a placeholder authenticated route at `/dashboard` that just renders a plain "Welcome" message — this is only a target for the redirect and `ProtectedRoute`, not a real dashboard.
> Do not create a signup page or a `/signup` route.
> Wire up React Router so `/login` renders this page and `/dashboard` is wrapped in `ProtectedRoute`.

### Prompt 4 — Landing Page Structure & Content
> Build the Landing Page with these sections in order: a sticky `Navbar` (brand left, nav links center, a solid primary "Log In" button top-right — this is the only account action in this module), a `Hero` section split into a left pitch column (headline, subhead, a primary "Log In" CTA and a secondary "See how it works" CTA) and a right column reserved for an animated code panel (build the panel in the next prompt), a `RolesStrip` with three quiet cards for Student / Evaluator / Admin explaining what each role gets, a `HowItWorksSection` with three numbered steps describing the actual contest flow (write code → submit → get evaluated), a `FinalCTASection` as a full-width band repeating the primary "Log In" CTA, and a minimal `Footer`. Every CTA on this page routes to `/login` — there is no signup page in this module. Write real, specific copy for a coding-contest/assessment platform aimed at students, evaluators, and admins — avoid generic SaaS placeholder text. Don't add the Lenis integration or animations yet — just structure, layout, and copy.

### Prompt 5 — Hero Signature Animation
> In the Hero section's right column, build the signature moment: a mock code-editor panel (using the monospace font) that animates typing out a short sample problem statement or function signature, then shows a green checkmark and a "Submitted" label once the typing finishes. This should play once on page load. Respect `prefers-reduced-motion` by showing the panel already in its completed state if that setting is on. Use Framer Motion for the animation.

### Prompt 6 — Lenis Smooth Scroll & Motion Pass
> Integrate Lenis for smooth scrolling globally across the app. Make the Landing Page's "See how it works" secondary CTA smoothly scroll to the How It Works section using Lenis. Add Framer Motion scroll-triggered reveals (fade + slight upward slide, staggered) to the RolesStrip cards and How It Works steps as they enter the viewport. Add subtle hover and press micro-interactions to all primary and secondary buttons site-wide (slight scale-down on press, color deepen on hover) — keep this consistent and restrained, not bouncy.

### Prompt 7 — Self-Review Pass
> Review everything built so far against this checklist and fix anything that doesn't pass: light mode only, no dark mode toggle anywhere yet; a working "Log In" button/link exists in the Navbar, the Hero, and the Final CTA band, all routing to `/login`; no signup page, `/signup` route, or signup API call exists anywhere; `AppShell` and `DataTable` were not built; the hero animation respects reduced-motion; the login button shows a loading state and an inline error on failed login; access token is kept in memory only, never localStorage; Lenis smooth scroll works across the whole page including the anchor-scroll CTA. List anything you find and fix it.

---

## 10. Explicitly Out of Scope for Module 1

- Signup page / signup API integration / `/signup` route
- `AppShell`, `DataTable`, admin/evaluator/student dashboards
- Dark mode toggle (design tokens are light-mode only for now; toggle can be added later per Module 0's "optional but easy win" note)
- OAuth/SSO, account lockout, password reset — noted as future enhancements in Module 0, not part of this module

---

## 11. Future Enhancements (carried over from Module 0, frontend angle)

- Dark mode toggle using the same shadcn/ui token system, once the light-mode identity is locked in
- OAuth2/SSO button on the Login page (Google login for institutional accounts)
- A "Forgot password" link and flow
- Signup/onboarding flow once the backend opens registration beyond the seeded admin
