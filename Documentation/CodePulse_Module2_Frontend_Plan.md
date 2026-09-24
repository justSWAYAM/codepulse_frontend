# CodePulse Enterprise — Module 2: Frontend Plan
**Scope: Frontend only. Pages in scope: real authenticated shell (`AppShell`), `UserManagementPage` (Admin only), `ProfilePage` (all roles). Backend (Module 2) is assumed done — do not touch it.**

---

## 1. Where You're Picking Up From

Module 1 frontend shipped a working `LoginPage` wired to the real login API, and a placeholder `/dashboard` route that just renders "Welcome" so `ProtectedRoute` had somewhere to send a successful login. That placeholder is now replaced with something real.

**Two things Module 1 explicitly deferred are now due:**
- `AppShell` (navbar + sidebar + content layout for authenticated pages)
- `DataTable` (shared, reusable paginated/sortable table — first real usage is the user list)

Everything from Module 1's shared foundation (`apiClient`, `AuthContext`/`useAuth()`, `ProtectedRoute`, `QueryClient`, toast system, RHF+Zod convention, `LoadingState`/`ErrorState`/`EmptyState`) is reused as-is. `ProtectedRoute` already supports a `roles` prop per the Module 1 spec — Module 2 is the first place that prop actually gets used, since `UserManagementPage` is Admin-only while `ProfilePage` is any authenticated role.

---

## 2. Tech Stack Additions for Module 2

Everything from Module 1's stack carries over unchanged. Add:

| Category | Library | Why |
|---|---|---|
| Table | **TanStack Table** (`@tanstack/react-table`) | Powers the shared `DataTable` — sorting, pagination, column defs |
| CSV parsing (client-side preview) | **Papa Parse** (`papaparse`) | Preview parsed rows/errors in the browser before hitting the bulk-import endpoint, so the user sees a mistake before uploading, not after |
| Drag-and-drop file zone | **react-dropzone** | Underlies the CSV upload UI (see Section 4 — pull a themed component built on this, don't build the drag/drop mechanics from scratch) |
| Data tables shadcn pattern | shadcn/ui's official **Data Table** block | This is the standard shadcn recipe combining Radix primitives + TanStack Table — use it as the base for `DataTable`, don't reinvent |

No new animation library needed — Framer Motion + Lenis from Module 1 already cover reveals and micro-interactions here (row hover states, dialog transitions, staggered card entrances on `ProfilePage`).

---

## 3. Design Continuity

Same token system, fonts, and motion rules as Module 1 — nothing new to define. Two additions specific to data-heavy screens:

- **Status/role chips:** small pill badges using the existing accent tokens — `accent-compile` (green) for Active/Admin, `accent-syntax` (amber) for Evaluator, `hairline`-bordered neutral for Candidate/Inactive. Reuse the same visual grammar as the landing page's "tests passed" green rather than inventing a new color language for status.
- **Empty/loading table states:** reuse Module 1's `LoadingState`/`EmptyState` components inside `DataTable`, don't build table-specific versions.

---

## 4. The "Cool Component" Layer — Where to Source, Not Build

You asked for this explicitly, so here's where to actually look instead of hand-rolling everything. All of these are open-source, MIT-licensed, and distributed via the **shadcn CLI registry pattern** (`npx shadcn add <url>`) — meaning they drop into your existing shadcn setup as source code you own and can restyle with your token system, not an external dependency you're locked into.

| Where to look | What to pull for this module |
|---|---|
| **Aceternity UI** (ui.aceternity.com) | **File Upload** component — this is the one to grab for CSV bulk import. It's a drag-and-drop dropzone with a dotted grid background, stacked file-preview cards, and a Framer Motion "drop" animation. Built on `react-dropzone` under the hood, so it slots straight into `CsvUploadInput` (see Section 5) instead of you wiring dropzone styling by hand. Also worth a look: their **Animated Modal** for `CreateUserDialog`/`EditUserDialog` if the plain shadcn `Dialog` feels flat — it adds a nicer scale/blur transition on open. |
| **Magic UI** (magicui.design) | **Number Ticker** — animated count-up, good for a "Total Users" / "Active Candidates" stat at the top of `UserManagementPage`. **Shimmer Button** — an option for the primary "Create User" CTA if you want it to read as more of a signature action than a flat button. Use sparingly — one shimmer button max on this page, not every button. |
| **shadcn/ui official blocks** (ui.shadcn.com/blocks) | The **Data Table** block itself — this is the actual base to build `DataTable` from, including the row-selection checkbox column and column-visibility dropdown pattern, which you'll want later for bulk actions. |
| **kibo-ui** (kibo-ui.com) | Has its own **Dropzone** primitive if Aceternity's File Upload feels too heavy-handed visually for the amber/navy palette — a lighter-weight fallback. |
| **Awesome shadcn/ui** (github.com/birobirobiro/awesome-shadcn-ui) | The curated index of basically every registry above, plus more (originui, motion-primitives, tremor for stat charts). Worth a five-minute scroll before committing to specific picks — new components get added constantly and this list is the fastest way to compare options instead of searching Reddit threads one at a time. |

**One rule when pulling any of these in:** restyle immediately to the Module 1 token system (`#1B1E3A` ink, `#2F9E6E` compile-green, `#E8A33D` syntax-amber, Space Grotesk/Inter/JetBrains Mono) before it ships. These registries default to their own demo palettes (often violet/black), and mixing an unstyled violet dropzone into your indigo-and-green system will look like two different products stitched together. Treat every pulled component as a starting point for the CSS variables, not a finished piece.

---

## 5. Site Map for Module 2

```
/dashboard              → DashboardHome (authenticated, all roles) — replaces the Module 1 placeholder
/dashboard/users        → UserManagementPage (Admin only, guarded by ProtectedRoute roles=["ADMIN"])
/dashboard/profile      → ProfilePage (authenticated, all roles)
```

`/`  and `/login` are untouched from Module 1. `DashboardHome` becomes real now: it's the first screen wrapped in `AppShell`, and for now just needs a lightweight welcome + role-aware nav cards (Admin sees a "Manage Users" card linking to `/dashboard/users`; every role sees a "My Profile" card). It does not need contest data yet — that's Module 3.

---

## 6. Component Inventory

### 6.1 Shared Foundation — Completing What Module 1 Deferred

| Component | Purpose | Where it lives | Notes |
|---|---|---|---|
| `AppShell` | Navbar (top) + collapsible sidebar (left) + content outlet | `src/layouts/AppShell.tsx` | Sidebar nav items are role-filtered — build a small `src/config/navigation.ts` mapping role → visible nav entries, rather than hardcoding conditionals inside the sidebar component |
| `DataTable` | Generic paginated/sortable table, built on shadcn's Data Table block + TanStack Table | `src/components/DataTable.tsx` | Generic over row type from day one — `UserTable` is its first consumer, but Module 3+ reuses it for contests, questions, submissions. Don't hardcode user-specific columns into this file. |
| Sidebar nav config | Role → nav item mapping | `src/config/navigation.ts` | Admin: Users, Profile. Evaluator/Candidate: Profile (contest links arrive in Module 3) |

### 6.2 New for Module 2

| Component | Purpose | Placement | Priority |
|---|---|---|---|
| `DashboardHome` | Post-login landing screen inside `AppShell`, replaces the Module 1 placeholder | `/dashboard` | P0 |
| `UserManagementPage` | Full CRUD screen for Admin: stat row, `UserTable`, "Create User" and "Bulk Import" actions | `/dashboard/users` | P0 |
| `ProfilePage` | Self-service: view/update name, change password | `/dashboard/profile` | P0 |
| `UserTable` | `DataTable` instance configured with columns: name, email, role (chip), status (chip), created date, row actions | Inside `UserManagementPage` | P0 |
| `UserTableRowActions` | Per-row dropdown: Edit, Deactivate/Reactivate | Inside `UserTable` rows | P0 |
| `CreateUserDialog` | Modal form: email, full name, role select, (password field or auto-generate note, per your Module 2 backend decision) | Triggered from `UserManagementPage` | P0 |
| `EditUserDialog` | Modal form: role, active status (Admin-path fields only) | Triggered from row actions | P0 |
| `CsvUploadInput` | The Aceternity-style drag-and-drop dropzone from Section 4, with Papa Parse client-side preview before submit | Inside a `BulkImportDialog` | P0 — this is your signature component for the module |
| `BulkImportDialog` | Wraps `CsvUploadInput`, shows parsed row count before upload, then renders `BulkImportResult` (success/fail per row) after submit | Triggered from `UserManagementPage` | P0 |
| `RoleBadge` / `StatusBadge` | Small colored chip components per Section 3's status/role color grammar | Reused in `UserTable`, `ProfilePage` | P0 |
| `ProfileForm` | RHF + Zod form for name update | Inside `ProfilePage` | P0 |
| `ChangePasswordForm` | RHF + Zod form: current password, new password, confirm | Inside `ProfilePage`, likely a separate card/section from `ProfileForm` | P0 |

### 6.3 Hooks & API Layer

| Hook | Backing endpoint |
|---|---|
| `useUsers(filters, page)` | `GET /api/users` |
| `useCreateUser()` | `POST /api/users` |
| `useUpdateUser(id)` | `PUT /api/users/{id}` |
| `useDeactivateUser(id)` | `PATCH /api/users/{id}/deactivate` |
| `useBulkImportUsers()` | `POST /api/users/bulk-import` |
| `useCurrentUser()` | `GET /api/users/me` (or read straight from `AuthContext` if it already caches the profile — decide based on what Module 1's `AuthContext` actually stores) |
| `useUpdateProfile()` | `PUT /api/users/me` |
| `useChangePassword()` | Whatever endpoint your Module 2 backend plan settled on for password change |

All of these live in `src/hooks/`, and their API calls live in `src/api/userApi.ts` — one file, one resource, matching the pattern the Module 1 plan set up for `authApi`.

---

## 7. Navigation & UX Notes

- `AppShell`'s sidebar is the first place role-based UI actually shows up — this is worth getting right since every later module's authenticated pages depend on this same shell and nav-config pattern.
- The CSV import flow should never feel like a black box: parse-preview → row count confirmation → upload → per-row result report. A user dropping a 200-row CSV and getting silence until a spinner resolves reads as broken even if it technically isn't.
- Deactivating a user should ask for confirmation (a lightweight `AlertDialog`, not the full modal treatment) — this is a state change with real consequences (that person can no longer log in).
- `ProfilePage`'s password change should reuse the exact same inline-error convention Module 1's `LoginForm` established for a failed 401 — consistency across the app's only two password-related forms.

---

## 8. Sequence of Implementation (Frontend, Module 2 Only)

1. Build `AppShell` + `src/config/navigation.ts`, wire `/dashboard` to render inside it, retire the Module 1 placeholder welcome text into a real (still simple) `DashboardHome`.
2. Extend `ProtectedRoute` usage: add `roles={["ADMIN"]}` to the `/dashboard/users` route.
3. Build `userApi.ts` and the hooks in Section 6.3.
4. Build the generic `DataTable` from the shadcn Data Table block + TanStack Table.
5. Build `UserTable`, `RoleBadge`, `StatusBadge`, `UserTableRowActions` on top of `DataTable`.
6. Build `CreateUserDialog` and `EditUserDialog` (plain shadcn `Dialog` first — swap in Aceternity's Animated Modal in the polish pass if you want it).
7. Pull in the Aceternity File Upload component, restyle it to the token system, wire it as `CsvUploadInput` with Papa Parse preview.
8. Build `BulkImportDialog` around `CsvUploadInput`, wire to `useBulkImportUsers()`, render `BulkImportResult`.
9. Build `ProfilePage`: `ProfileForm` + `ChangePasswordForm`.
10. Polish pass: Number Ticker stat on `UserManagementPage`, hover/press micro-interactions on new buttons matching Module 1's restrained motion rules, confirm empty/loading states render correctly on `UserTable`.
11. Manual QA pass against the Definition of Done below.

---

## 9. Definition of Done (Frontend Module 2)

- [ ] `AppShell` renders with a role-filtered sidebar; Candidate/Evaluator never see a "Manage Users" nav entry
- [ ] `/dashboard/users` is inaccessible (redirects) to any non-Admin role
- [ ] Admin can create a user via `CreateUserDialog` and see it appear in `UserTable` without a manual refresh
- [ ] Admin can deactivate a user (with confirmation) and their status chip updates to reflect it
- [ ] CSV drag-and-drop shows a client-side preview (row count, obvious parse errors) before the user confirms upload
- [ ] After bulk import, the per-row success/failure report is visible on screen — not just a generic toast
- [ ] `ProfilePage` lets any authenticated user update their name and change their password, with inline validation errors matching the `LoginForm` convention
- [ ] Every pulled-in open-source component (dropzone, ticker, etc.) is restyled to the existing token system — no leftover default-theme colors from the source registry
- [ ] `DataTable` has no user-specific logic hardcoded into it — verified by checking it only receives columns/data as props

---

## 10. AI Build Prompts

Paste **Prompt 0** once at the start of a fresh session for context, then run the rest in order.

### Prompt 0 — Project Context (paste once, first)
> I'm continuing the frontend for CodePulse, a coding-contest platform (Student/Evaluator/Admin roles). Module 1 is done: Landing Page, Login Page, and shared foundation (`apiClient`, `AuthContext`, `ProtectedRoute`, `QueryClient`, toast system, RHF+Zod convention) all exist and work. Login currently redirects to a placeholder `/dashboard` route. I'm now building Module 2: a real authenticated shell and user management.
>
> Stack (same as Module 1, plus): Vite + React + TypeScript, Tailwind + shadcn/ui, Framer Motion, Lenis, lucide-react, React Hook Form + Zod, TanStack Query, TanStack Table, Axios, React Router v6+, sonner, Papa Parse, react-dropzone.
>
> Design tokens (unchanged from Module 1): background `#FAFAF8`, surface `#FFFFFF`, ink `#1B1E3A`, accent-compile `#2F9E6E`, accent-syntax `#E8A33D`, accent-error `#E85D4E`, hairline `#E4E2DC`. Space Grotesk (display), Inter (body), JetBrains Mono (utility/code details).
>
> Backend Module 2 (User Management) is done and exposes: `GET/POST /api/users`, `PUT /api/users/{id}`, `PATCH /api/users/{id}/deactivate`, `POST /api/users/bulk-import`, `GET/PUT /api/users/me`. Do not modify or generate backend code.
>
> Please confirm you've got this context before the first build task.

### Prompt 1 — AppShell & Navigation
> Build `AppShell`: a layout with a top navbar (brand, user menu with logout) and a left sidebar whose nav items come from a role-based config file (`src/config/navigation.ts`), not hardcoded conditionals. Admin sees "Users" and "Profile"; Evaluator and Candidate see only "Profile" for now. Wire `/dashboard` to render a simple `DashboardHome` inside this shell, replacing the old placeholder — it should show a welcome message and role-aware nav cards (Admin gets a card linking to `/dashboard/users`; everyone gets a card linking to `/dashboard/profile`). Extend the existing `ProtectedRoute` so `/dashboard/users` requires the `ADMIN` role and redirects everyone else.

### Prompt 2 — Generic DataTable
> Build a generic, reusable `DataTable` component using shadcn/ui's official Data Table block pattern with TanStack Table — it should accept columns and data as props and have zero user-specific logic. Include pagination controls, column sorting, and use the existing `LoadingState`/`EmptyState` components for its loading and empty states. Do not build any user-specific columns in this file.

### Prompt 3 — User Management Page
> Using the `DataTable` from the previous step, build `UserManagementPage` (Admin only) at `/dashboard/users`:
> - A `userApi.ts` with functions for all the `/api/users` endpoints listed in the project context, and corresponding TanStack Query hooks (`useUsers`, `useCreateUser`, `useUpdateUser`, `useDeactivateUser`).
> - A `UserTable` built on `DataTable` with columns: name, email, a `RoleBadge` chip, a `StatusBadge` chip (active/inactive), created date, and a row-actions dropdown (Edit, Deactivate/Reactivate).
> - `RoleBadge` and `StatusBadge` as small pill components using the accent-compile/accent-syntax/hairline tokens.
> - A `CreateUserDialog` (shadcn Dialog) with an RHF+Zod form matching the `CreateUserRequest` shape from the backend.
> - An `EditUserDialog` for updating role/status on an existing user.
> - Deactivating a user should show a confirmation `AlertDialog` first.
> - A small stat header showing total user count.

### Prompt 4 — Bulk CSV Import (Signature Component)
> Add a "Bulk Import" flow to `UserManagementPage`:
> - Find and adapt Aceternity UI's "File Upload" component (a `react-dropzone`-based drag-and-drop zone with a dotted grid background and animated file preview) as `CsvUploadInput`. Restyle it fully to match the existing token system — no leftover default colors from the source.
> - Use Papa Parse to parse the CSV client-side and show a preview (row count, and flag anything obviously malformed) before the user confirms the upload.
> - Wire the confirmed upload to `POST /api/users/bulk-import` via a `useBulkImportUsers()` hook.
> - After the API responds, show a clear per-row result report (which rows succeeded, which failed and why) — not just a success/fail toast.
> - Wrap all of this in a `BulkImportDialog` triggered from `UserManagementPage`.

### Prompt 5 — Profile Page
> Build `ProfilePage` at `/dashboard/profile`, accessible to any authenticated role:
> - A `ProfileForm` (RHF + Zod) for updating full name, pre-filled from the current user's data.
> - A separate `ChangePasswordForm` card with current password, new password, and confirm-new-password fields, using the same inline-error convention as `LoginForm` from Module 1 for failure responses.
> - Both forms show a success toast on save.

### Prompt 6 — Polish Pass
> Review everything built in this module: add a Magic UI-style animated number ticker to the user-count stat on `UserManagementPage`. Apply consistent hover/press micro-interactions (matching Module 1's restrained scale/color rules — no bounce) to all new buttons. Confirm `DataTable` has no user-specific logic in it. Confirm `/dashboard/users` correctly redirects non-Admin roles. Confirm every pulled-in third-party component is fully restyled to the project's token system. List and fix anything that fails these checks.

---

## 11. Explicitly Out of Scope for Module 2

- Contest, question, or submission data anywhere on `DashboardHome` — that's Module 3+
- Self-service password reset via email (forgot-password flow) — noted as a future enhancement
- User activity audit trail UI — the audit data exists on the backend from earlier modules, but no frontend view for it yet
- Any dark mode toggle — still light-mode only per Module 1's direction

---

## 12. Future Enhancements (carried over)

- Self-service password reset via email
- Audit trail view for user actions (create/deactivate/role-change history)
- Dark mode toggle, once the light-mode identity is fully locked in across more modules
