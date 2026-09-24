# CodePulse Enterprise — Module 3: Frontend Plan
**Scope: Frontend only. Pages in scope: Contest List, Contest Create, Contest Detail + Candidate Assignment. Backend (Module 3) must be working — do not touch it.**

---

## 1. Purpose of This Document

This is the single reference for building Module 3 of the frontend. It contains:
- The design direction (continuing the established CodePulse light-mode identity)
- The full component inventory, product-manager style (what it is, where it lives, why)
- Shared components that must be completed before Contest pages can work
- A strict build sequence
- Copy-paste prompts to hand to an AI coding assistant, one per build stage

No code is written here — only specifications and prompts.

---

## 2. Tech Stack for Module 3

All libraries were installed in Module 1. No new dependencies needed except one:

| Category | Library | Why |
|---|---|---|
| Build tool | Vite + React + TypeScript | Unchanged |
| Styling | Tailwind CSS + shadcn/ui | Unchanged |
| Animation | Framer Motion | Status badge transitions, list entrance animations |
| Icons | lucide-react | Contest icons (`Trophy`, `Clock`, `Users`, `Calendar`, `Code2`) |
| Forms | React Hook Form + Zod | `ContestCreatePage` — date/time fields, language multiselect |
| Data/state | TanStack Query | `useContests()`, `useContest(id)`, `useCreateContest()`, `useAssignCandidates()` |
| HTTP | Axios | `contestApi.*` calls through `apiClient` |
| Routing | React Router v6+ | New routes: `/contests`, `/contests/new`, `/contests/:id` |
| Toasts | shadcn/ui `sonner` | Success on create, assign, publish — unchanged |
| **NEW** | `react-datepicker` or shadcn `DateTimePicker` | Start/end time selection in the create form — pick one consistent picker |

**Date/time picker decision:** `react-datepicker` is standalone and widely compatible. Alternatively, use `shadcn/ui`'s Calendar + manual time input. Whatever you pick, apply it consistently — the same pattern will be reused in Module 6 (Assessment Session) for session time display.

---

## 3. Design Direction (Continuation of Module 1 Light Mode)

Module 3 introduces the first real data-heavy pages. The design must stay disciplined — no clutter, no excessive color, tables and status badges do the heavy lifting visually.

### 3.1 Color tokens (unchanged from Module 1)
| Token | Hex | Use in Module 3 |
|---|---|---|
| `background` | `#FAFAF8` | Page background behind the contest list |
| `surface` | `#FFFFFF` | ContestCard background, detail panel |
| `ink` | `#1B1E3A` | All headings, table text |
| `accent-compile` | `#2F9E6E` | ONGOING status badge, Publish button, Create CTA |
| `accent-syntax` | `#E8A33D` | PUBLISHED status badge, pending/invited enrollment badge |
| `accent-error` | `#E85D4E` | Form validation errors only |
| `hairline` | `#E4E2DC` | Table row dividers, card borders |

### 3.2 Status badge color mapping
The `ContestStatusBadge` component is the most visually important new component. Map statuses to colors consistently across every surface it appears on:

| Status | Badge color | Rationale |
|---|---|---|
| `DRAFT` | Muted gray (`#9CA3AF`) | Not yet live — intentionally understated |
| `PUBLISHED` | `accent-syntax` amber | Scheduled, upcoming — calls attention without urgency |
| `ONGOING` | `accent-compile` green | Active — the \"tests passing\" green signals this is live |
| `COMPLETED` | Muted indigo (`#6366F1`) | Archived — distinct from DRAFT, signals closure |

### 3.3 Typography (unchanged)
- **Display:** Space Grotesk for page titles (`Contests`, `Create Contest`)
- **Body:** Inter for table content, form labels, description text
- **Mono:** JetBrains Mono for: contest IDs (shown in detail header), language tags (`JAVA`, `PYTHON`, `CPP`) — these are code-adjacent concepts, the mono face is appropriate

### 3.4 Layout
- Contest list: `AppShell` with a two-column header row (title left, Create button right for Admin)
- ContestCard in list: horizontal card — title + status badge left, dates + candidate count right. Dense but not cramped. No hero images.
- ContestDetailPage: tabbed layout — **Overview** tab (details, timeline, description) and **Candidates** tab (assignment panel, candidate table). Tabs avoid a single long page that mixes admin-only content with general info.

---

## 4. Site Map for Module 3

```
/contests              → ContestListPage (role-scoped list — all authenticated)
/contests/new          → ContestCreatePage (Admin only — guarded by ProtectedRoute)
/contests/:id          → ContestDetailPage (all authenticated — role-scoped detail)
```

The existing routes from Modules 1 & 2 are untouched:
```
/                      → LandingPage (unchanged)
/login                 → LoginPage (unchanged)
/dashboard             → DashboardHome (add a contest widget — see Section 5.1)
/users                 → UserManagementPage (unchanged)
/profile               → ProfilePage (unchanged)
```

---

## 5. Component Inventory (Product Manager View)

### 5.1 Shared Components to Complete Before Contest Pages (build these first)

These were deferred from Module 2 or are new shared utilities needed by contests and every later module.

| Component | Purpose | Where it lives | Needed for Module 3? |
|---|---|---|---|
| `AppShell` | Top navbar + role-based sidebar + content area | `src/layouts/AppShell.tsx` | **Yes — if not fully built in Module 2, complete it now.** All contest pages live inside it. |
| `DataTable` | Reusable paginated/sortable table (shadcn + TanStack Table) | `src/components/DataTable.tsx` | **Yes** — contest list (admin variant) and candidate assignment table both use it |
| `Sidebar` with contest nav link | Sidebar entry for `/contests` — all roles see it, Admin sees \"Manage Contests\" label, Candidate sees \"My Contests\" | Inside `AppShell` | **Yes** |
| `PageHeader` | Reusable title row: heading left, optional action button (e.g., \"Create Contest\") right | `src/components/PageHeader.tsx` | **Yes** — used on ContestListPage and ContestDetailPage |
| `StatusBadge` (generic) | Generic colored badge — takes `label` + `color`. Used by `ContestStatusBadge` and later `SubmissionStatusBadge`, `SessionStatusBadge` | `src/components/StatusBadge.tsx` | **Yes** |
| `ConfirmDialog` | Generic \"Are you sure?\" dialog — used for Publish action | `src/components/ConfirmDialog.tsx` | **Yes** — Publish is irreversible |
| Dashboard contest widget | A \"Upcoming Contests\" summary card on `/dashboard` for all roles | Inside `DashboardHome.tsx` | **Yes** — first meaningful content on the dashboard |

**Do not build Module 3 pages until `AppShell` and `DataTable` are solid.** These are the hardest shared components to retrofit once pages are built on top of them.

---

### 5.2 `ContestListPage`

**Route:** `/contests`
**Access:** All authenticated roles. Content is role-scoped.

| Component | Purpose | Placement |
|---|---|---|
| `PageHeader` | Title \"Contests\" + \"Create Contest\" button (Admin only, hidden for other roles) | Top of page |
| Status filter tabs | shadcn `Tabs` — `All`, `Upcoming`, `Live`, `Completed`. Each tab filters by status. | Below PageHeader |
| `ContestCard` (list of) | One per contest — see spec below | Main content area |
| `EmptyState` | \"No contests yet\" (admin) or \"You haven't been assigned to any contests\" (candidate) | When list is empty |
| Pagination | shadcn pagination — server-side, passed from TanStack Query | Bottom of list |

**ContestCard spec (this is NOT the same as a generic shadcn card):**
- Left column: Contest title (Space Grotesk, `ink`), status badge directly below title, description excerpt (2 lines max, clipped)
- Right column: Start date, end date (formatted `DD MMM YYYY, HH:mm`), duration in minutes, candidate count (Admin/Evaluator only)
- Bottom strip: Language tags rendered in JetBrains Mono as small mono badges
- Hover: subtle shadow lift, background transition from `surface` to a 2% tinted version
- Click: navigates to `/contests/:id`
- Admin-only: a `⋮` kebab menu on the card with \"Edit\" and \"Publish\" actions (only show if DRAFT)

---

### 5.3 `ContestCreatePage`

**Route:** `/contests/new`
**Access:** Admin only — wrapped in `<ProtectedRoute roles={['ADMIN']} />`

| Component | Purpose | Placement |
|---|---|---|
| `PageHeader` | \"Create Contest\" title + \"← Back to Contests\" link | Top |
| `ContestForm` | The main form — see below | Full-width card |
| Submit button | \"Create Contest\" — `accent-compile` green, full width of form, loading spinner during mutation | Bottom of form |

**`ContestForm` field spec:**
| Field | Input type | Validation |
|---|---|---|
| Title | `Input` | Required, min 3 chars |
| Description | `Textarea` | Optional, max 2000 chars. Show character counter. |
| Start Time | DateTime picker | Required, must be in the future |
| End Time | DateTime picker | Required, must be after Start Time. Show error if end ≤ start. |
| Duration (minutes) | `Input` (number) | Required. Pre-fill automatically from `end - start` when both dates are set, but allow manual override for when candidates get custom-length sessions. |
| Allowed Languages | Multi-select | Required, at least 1. Options: `JAVA`, `PYTHON`, `CPP`, `C`, `JAVASCRIPT`. Display as a multi-select with checkboxes or a tag-select component. |

**UX notes:**
- Auto-compute `durationMinutes` from `startTime` and `endTime` using a `useEffect` watcher — saves the Admin from manual math, but keep the field editable for override.
- On success (`201 Created`), redirect to `/contests/:id` (the newly created contest's detail page) and fire a success toast: \"Contest created successfully\".
- On API error, show an inline error below the form (not just a toast) — same pattern as `LoginForm`.

---

### 5.4 `ContestDetailPage`

**Route:** `/contests/:id`
**Access:** All authenticated roles (role-scoped detail via the backend).

This page has two distinct halves: an info section (visible to all) and an admin section (Candidate Assignment, visible to Admin/Evaluator only). Use shadcn `Tabs` to separate them.

**Tab 1: Overview (all roles)**

| Component | Purpose |
|---|---|
| Contest header | Title (large, Space Grotesk), `ContestStatusBadge`, dates, duration |
| Timeline bar | A simple horizontal bar showing DRAFT → PUBLISHED → ONGOING → COMPLETED with the current status highlighted — visual at a glance |
| Description block | Full markdown-rendered description (use `react-markdown` or plain `<pre>` for now) |
| Language tags | Mono-styled language badges |
| \"Publish\" button | Admin only. Only shows if status is DRAFT. Opens `ConfirmDialog` before triggering the mutation. |
| Empty candidate note | Admin only. If no candidates assigned and status is DRAFT, show a warning: \"Assign candidates before publishing\" |

**Tab 2: Candidates (Admin / Evaluator only)**

| Component | Purpose |
|---|---|
| `CandidateAssignmentPanel` | The main assignment UI — see below |
| `AssignedCandidateTable` | Paginated table of assigned candidates: name, email, roll number, enrollment status badge |

**`CandidateAssignmentPanel` spec:**
- Multi-select input: search and select from existing Candidate-role users (fetched from `GET /api/users?role=CANDIDATE` — Module 2 endpoint)
- \"Assign Selected\" button — calls `POST /api/contests/{id}/candidates`
- Displays result: \"5 assigned, 2 already enrolled, 1 not found\" — matches the `AssignCandidatesResult` DTO shape
- Disabled if contest status is COMPLETED

---

## 6. API Layer

**File:** `src/api/contestApi.ts`

```typescript
import apiClient from '../lib/apiClient';
import type {
  ContestResponse,
  ContestDetailResponse,
  CreateContestRequest,
  UpdateContestRequest,
  AssignCandidatesRequest,
  AssignCandidatesResult,
  PagedResponse,
  ApiResponse,
} from '../types';

export const contestApi = {
  list: (params?: { status?: string; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PagedResponse<ContestResponse>>>('/api/contests', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<ContestDetailResponse>>(`/api/contests/${id}`),

  create: (data: CreateContestRequest) =>
    apiClient.post<ApiResponse<ContestResponse>>('/api/contests', data),

  update: (id: string, data: UpdateContestRequest) =>
    apiClient.put<ApiResponse<ContestResponse>>(`/api/contests/${id}`, data),

  publish: (id: string) =>
    apiClient.post<ApiResponse<ContestResponse>>(`/api/contests/${id}/publish`),

  assignCandidates: (id: string, data: AssignCandidatesRequest) =>
    apiClient.post<ApiResponse<AssignCandidatesResult>>(`/api/contests/${id}/candidates`, data),

  getCandidates: (id: string) =>
    apiClient.get<ApiResponse<UserSummaryResponse[]>>(`/api/contests/${id}/candidates`),
};
```

---

## 7. Hooks Layer

**File:** `src/hooks/useContests.ts`

```typescript
// Paginated list — used by ContestListPage
export const useContests = (filters?: ContestFilters) =>
  useQuery({
    queryKey: ['contests', filters],
    queryFn: () => contestApi.list(filters).then(r => r.data.data),
    staleTime: 30_000,  // contests don't change that often
  });

// Single contest detail — used by ContestDetailPage
export const useContest = (id: string) =>
  useQuery({
    queryKey: ['contests', id],
    queryFn: () => contestApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });

// Create mutation — used by ContestCreatePage
export const useCreateContest = () =>
  useMutation({
    mutationFn: contestApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      // Caller handles redirect
    },
  });

// Publish mutation — used by ContestDetailPage
export const usePublishContest = (id: string) =>
  useMutation({
    mutationFn: () => contestApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests', id] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success('Contest published successfully');
    },
  });

// Assign candidates mutation — used by CandidateAssignmentPanel
export const useAssignCandidates = (contestId: string) =>
  useMutation({
    mutationFn: (data: AssignCandidatesRequest) =>
      contestApi.assignCandidates(contestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests', contestId] });
    },
  });
```

**Note on `queryClient`:** import your singleton `queryClient` from `src/lib/queryClient.ts`. Don't create a new one inside hooks.

---

## 8. TypeScript Types

**File:** `src/types/contest.ts`

```typescript
export type ContestStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED';
export type ContestCandidateStatus = 'INVITED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ContestResponse {
  id: string;
  title: string;
  description: string | null;
  startTime: string;   // ISO 8601
  endTime: string;
  durationMinutes: number;
  allowedLanguages: string[];
  status: ContestStatus;
  candidateCount?: number;  // present for Admin/Evaluator, absent for Candidate
  createdAt: string;
}

export interface ContestDetailResponse extends ContestResponse {
  candidates?: UserSummaryResponse[];  // present only if Admin/Evaluator requested
}

export interface CreateContestRequest {
  title: string;
  description?: string;
  startTime: string;  // ISO 8601 UTC
  endTime: string;
  durationMinutes: number;
  allowedLanguages: string[];
}

export interface AssignCandidatesRequest {
  candidateIds: string[];
}

export interface AssignCandidatesResult {
  assignedCount: number;
  alreadyAssignedCount: number;
  notFoundCount: number;
  failedIds: string[];
}
```

Add these to `src/types/index.ts` re-export barrel so pages import from `'../types'` not from nested files.

---

## 9. Navigation & UX Notes

- **Sidebar contest link** should show "My Contests" for Candidate role and "Contests" for Admin/Evaluator. The same route (`/contests`) is used — the backend scopes the data; the label is just a UX affordance.
- **Status filter tabs** on ContestListPage: the "Live" tab should have a subtle pulsing green dot indicator — a single `animate-pulse` on the `accent-compile` dot makes it feel alive without being distracting.
- **Publish action** requires a `ConfirmDialog` before firing — it's irreversible. Dialog copy: "Publish this contest? Candidates will immediately be able to see it. This cannot be undone."
- **Date/time inputs** must capture and submit time in UTC (ISO 8601 format). Display them in the user's local timezone using `Intl.DateTimeFormat`. Never submit local time strings to the backend — the backend expects `Instant` (UTC).
- **Candidate cannot reach `/contests/new`** — protect this route with `<ProtectedRoute roles={['ADMIN']} />`. An Evaluator also cannot create contests.

---

## 10. Sequence of Implementation (Frontend, Module 3 Only)

1. Complete `AppShell` and `DataTable` if not finished in Module 2 — these are blockers.
2. Add sidebar entry for `/contests` (role-aware label) and wire routing.
3. Build `src/types/contest.ts` type definitions.
4. Build `src/api/contestApi.ts` (all functions stubbed first, then tested against the running backend).
5. Build `src/hooks/useContests.ts` — all four hooks.
6. Build shared components: `PageHeader`, `StatusBadge`, `ContestStatusBadge`, `ConfirmDialog`.
7. Build `ContestListPage` — Admin view first (full data visible), then verify Candidate view shows only assigned contests.
8. Build `ContestCreatePage` with `ContestForm` — test against `POST /api/contests` with a running backend.
9. Build `ContestDetailPage` — Overview tab first, then Candidates tab.
10. Build `CandidateAssignmentPanel` and `AssignedCandidateTable`.
11. Add contest widget to `DashboardHome`.
12. Manual QA pass against Definition of Done.

---

## 11. Definition of Done (Frontend Module 3)

- [ ] Logged-in Admin can navigate to `/contests` and see all contests with correct status badges
- [ ] Logged-in Candidate can navigate to `/contests` and sees ONLY their assigned contests (verified by checking a different Candidate account that has zero assignments — list is empty)
- [ ] Admin can create a contest at `/contests/new`, submit the form, and is redirected to the new contest's detail page
- [ ] `startTime >= endTime` client-side validation fires before the API is called
- [ ] Admin can publish a DRAFT contest — the `ConfirmDialog` appears and the status badge updates to `PUBLISHED` after confirmation
- [ ] Admin can assign candidates on the Candidates tab and the assigned table updates without a full page reload (TanStack Query cache invalidation)
- [ ] `CandidateAssignmentPanel` shows the per-candidate outcome (how many assigned, already enrolled, not found)
- [ ] Candidate calling `/contests/:id` for a contest they're not assigned to gets a graceful error (403 or redirect) — not a blank page crash
- [ ] Status filter tabs on the list page correctly filter contests
- [ ] Date/time values are displayed in the user's local timezone, stored/sent to the backend in UTC
- [ ] All contest routes redirect to `/login` if unauthenticated (`ProtectedRoute` wrapper)
- [ ] `/contests/new` returns 403 redirect if accessed by Candidate or Evaluator role

---

## 12. AI Build Prompts

Use these in order, one per message. Paste **Prompt 0** once at the very start of the conversation.

### Prompt 0 — Project Context (paste once, first)
> I'm building Module 3 of the CodePulse frontend — a coding-contest/assessment platform used by three roles: Admin, Evaluator, and Candidate. Modules 1 and 2 are already complete: Login page, Landing page, Auth context, ProtectedRoute, apiClient with JWT interceptor, UserManagementPage, and ProfilePage all exist and work. I'm now building Module 3: Contest Management. The backend's contest endpoints are live and working:
>
> - `GET /api/contests` — paginated, role-scoped list
> - `POST /api/contests` — create (Admin only)
> - `GET /api/contests/{id}` — detail (role-scoped)
> - `PUT /api/contests/{id}` — update (Admin, DRAFT only)
> - `POST /api/contests/{id}/publish` — publish (Admin only)
> - `POST /api/contests/{id}/candidates` — assign candidates batch (Admin only)
> - `GET /api/contests/{id}/candidates` — list assigned candidates (Admin/Evaluator)
>
> The design system is light mode: background `#FAFAF8`, surface `#FFFFFF`, primary ink `#1B1E3A`, primary accent `#2F9E6E` (green for CTAs, ONGOING badge), secondary accent `#E8A33D` (amber for PUBLISHED badge), error `#E85D4E`, hairline `#E4E2DC`. Display font Space Grotesk, body Inter, mono JetBrains Mono (used for contest IDs and language tags).
>
> Please confirm you have this context before I give you the first task.

### Prompt 1 — TypeScript Types + API Client
> Add the Contest-related TypeScript types to `src/types/contest.ts` and add the contest API functions to `src/api/contestApi.ts`.
>
> Types needed: `ContestStatus` ('DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED'), `ContestCandidateStatus`, `ContestResponse` (id, title, description, startTime, endTime, durationMinutes, allowedLanguages, status, candidateCount, createdAt), `ContestDetailResponse` (extends ContestResponse + candidates list), `CreateContestRequest`, `UpdateContestRequest`, `AssignCandidatesRequest` (list of candidateIds), `AssignCandidatesResult` (assignedCount, alreadyAssignedCount, notFoundCount, failedIds list).
>
> API functions in `contestApi`: `list(params?)`, `getById(id)`, `create(data)`, `update(id, data)`, `publish(id)`, `assignCandidates(id, data)`, `getCandidates(id)`.
>
> Export all types from `src/types/index.ts`.

### Prompt 2 — TanStack Query Hooks
> Build the contest hooks in `src/hooks/useContests.ts`:
> - `useContests(filters?)` — paginated list query, staleTime 30s
> - `useContest(id)` — single detail query, enabled only when id is truthy
> - `useCreateContest()` — mutation that invalidates the contests list on success
> - `usePublishContest(id)` — mutation that invalidates both the list and the specific contest on success, fires a success toast
> - `useAssignCandidates(contestId)` — mutation that invalidates the specific contest on success
>
> Import `queryClient` from `src/lib/queryClient.ts` (the singleton). Use `toast.success()` from sonner for success messages.

### Prompt 3 — Shared Components (build before pages)
> Build these shared components before any contest page:
> 1. `PageHeader` (`src/components/PageHeader.tsx`) — takes a `title` string and optional `action` ReactNode (right-aligned). Renders a bottom hairline border.
> 2. `StatusBadge` (`src/components/StatusBadge.tsx`) — generic: takes `label: string` and `color: string` (hex). Small pill badge with 8px border-radius, no border.
> 3. `ContestStatusBadge` (`src/components/contest/ContestStatusBadge.tsx`) — wraps `StatusBadge` with the correct color per `ContestStatus`: DRAFT=gray #9CA3AF, PUBLISHED=amber #E8A33D, ONGOING=green #2F9E6E, COMPLETED=indigo #6366F1. ONGOING badge gets a small pulsing dot before the label.
> 4. `ConfirmDialog` (`src/components/ConfirmDialog.tsx`) — shadcn Dialog wrapping a confirm/cancel pattern. Props: `title`, `description`, `confirmLabel`, `onConfirm`, `isLoading`. Used for the Publish action.

### Prompt 4 — ContestListPage
> Build `ContestListPage` at `src/pages/ContestListPage.tsx`, rendered at `/contests`.
>
> Layout inside `AppShell`: `PageHeader` with title "Contests" and an "Create Contest" button (only render this button if the current user role is ADMIN). Below the header, status filter tabs (All / Upcoming / Live / Completed) using shadcn Tabs. Below the tabs, a list of `ContestCard` components — one per contest from `useContests()`.
>
> `ContestCard` (build inside `src/components/contest/ContestCard.tsx`): horizontal layout — left column has contest title in Space Grotesk, `ContestStatusBadge` below the title, description excerpt clipped to 2 lines. Right column has formatted start date, end date (user local timezone, `DD MMM YYYY HH:mm` format), duration in minutes. Bottom strip shows allowed languages as small JetBrains Mono badges. Hover: subtle shadow lift via Framer Motion `whileHover`. Entire card is clickable, navigates to `/contests/:id`. Admin-only: a kebab menu button (`MoreVertical` icon from lucide) with "Edit" and "Publish" options (only shown when status is DRAFT).
>
> Show `EmptyState` when the list is empty. Show `LoadingState` while `useContests()` is loading. Show `ErrorState` if it errors. Add server-side pagination using shadcn Pagination.

### Prompt 5 — ContestCreatePage
> Build `ContestCreatePage` at `src/pages/ContestCreatePage.tsx`, rendered at `/contests/new`, wrapped in `<ProtectedRoute roles={['ADMIN']} />`.
>
> Layout: `PageHeader` with title "Create Contest" and a "← Back to Contests" link routing to `/contests`. Below, a white surface card containing `ContestForm`.
>
> `ContestForm` (build at `src/components/contest/ContestForm.tsx`) using React Hook Form + Zod:
> - Title: text input, required, min 3 chars.
> - Description: textarea, optional, max 2000 chars with a character counter below.
> - Start Time: date+time picker, required, must be in the future (Zod `.refine()`).
> - End Time: date+time picker, required, must be after Start Time.
> - Duration (minutes): number input, auto-computed from `endTime - startTime` via a `useEffect` watcher, but manually editable. Required.
> - Allowed Languages: multi-select checkboxes (JAVA, PYTHON, CPP, C, JAVASCRIPT), at least 1 required.
>
> All date/time values must be converted to ISO 8601 UTC strings before submission. Submit button: "Create Contest", accent-compile green, full width, loading spinner during `useCreateContest()` mutation. On success, redirect to `/contests/:id` of the newly created contest. On API error, show inline error below the form.

### Prompt 6 — ContestDetailPage
> Build `ContestDetailPage` at `src/pages/ContestDetailPage.tsx`, rendered at `/contests/:id`.
>
> Use `useContest(id)` to fetch. Show `LoadingState` while loading. Show `ErrorState` on error (backend will return 403 if the candidate isn't assigned — map this to a "You don't have access to this contest" `ErrorState`, not a blank crash).
>
> Layout: contest title in Space Grotesk + `ContestStatusBadge` in the header. Below, a simple horizontal timeline bar showing the four statuses with the current one highlighted in `accent-compile`. Then shadcn `Tabs` with two tabs:
>
> **Tab 1 — Overview:** Full description (render as plain text for now), start time, end time, duration, allowed language badges, and (Admin only) a "Publish Contest" button that opens `ConfirmDialog` before calling `usePublishContest()`. Only show the Publish button when status is DRAFT. If status is DRAFT and no candidates are assigned, show an amber warning callout: "Assign candidates before publishing."
>
> **Tab 2 — Candidates (Admin/Evaluator only — hide this tab entirely for Candidate role):** `CandidateAssignmentPanel` at the top (build at `src/components/contest/CandidateAssignmentPanel.tsx`): a user search/multi-select that calls `GET /api/users?role=CANDIDATE` to get options, an "Assign Selected" button that calls `useAssignCandidates()`, and a result summary showing how many were assigned/skipped. Below that, `AssignedCandidateTable`: a `DataTable` listing assigned candidates with columns: full name, email, roll number, enrollment status badge (`ContestCandidateStatus`). Disable the assignment panel when contest status is COMPLETED.

### Prompt 7 — Dashboard Widget + Navigation Wiring
> 1. Add a sidebar entry for `/contests` in `AppShell`'s sidebar. For Admin/Evaluator, the label should be "Contests". For Candidate, the label should be "My Contests". Both route to the same `/contests` path — the backend scopes the data.
>
> 2. Add a contest summary widget to `DashboardHome.tsx`: a card titled "Upcoming Contests" that shows the next 3 contests from `useContests({ status: 'PUBLISHED' })` with their title, `ContestStatusBadge`, and start date. A "View All" link routes to `/contests`. For Candidates, show their assigned upcoming contests. Show `EmptyState` if none.
>
> 3. Update the React Router config to include: `/contests` (ContestListPage, ProtectedRoute for all roles), `/contests/new` (ContestCreatePage, ProtectedRoute for Admin only), `/contests/:id` (ContestDetailPage, ProtectedRoute for all roles).

### Prompt 8 — Self-Review Pass
> Review everything built in Module 3 against this checklist and fix anything that doesn't pass:
>
> - Admin sees all contests at `/contests`; Candidate sees only assigned contests (tested by switching accounts)
> - `/contests/new` is inaccessible to Candidate and Evaluator (route is protected, returns a redirect, not a 403 page)
> - Contest status badges use the correct colors: gray (DRAFT), amber (PUBLISHED), green+pulse (ONGOING), indigo (COMPLETED)
> - Date/time values displayed in user's local timezone, submitted to backend in UTC ISO 8601
> - Publish action opens `ConfirmDialog` before firing the mutation
> - After assign-candidates, the candidate table updates without a full page reload (TanStack Query invalidation working)
> - A Candidate accessing `/contests/:id` for a contest they're not assigned to gets a graceful error state, not a JS crash
> - AppShell sidebar shows the correct contest nav label per role
> - `LoadingState`, `ErrorState`, and `EmptyState` are present on all three contest pages
> - No new unstyled or default-shadcn elements — everything uses the design system tokens
>
> List what you find and fix it.

---

## 13. Explicitly Out of Scope for Module 3

- Question management (Module 4) — `/contests/:id/questions` routes do not exist yet
- Assessment Session / candidate \"Start Exam\" button (Module 6) — the ContestDetailPage does not have a \"Start\" button yet; add it in Module 6
- Results and scores (Module 9)
- WebSocket real-time status updates — the scheduler transitions are polled via `useContest()` refetch on a timer if needed, not via WebSocket (that's Module 11)
- Dark mode toggle — deferred globally

---

## 14. Future Enhancements (Out of Scope for This Module)

- Contest duplication / template system — clone a COMPLETED contest into a new DRAFT with all questions and test cases
- \"Start Exam\" button on ContestDetailPage for Candidates — deferred to Module 6 when AssessmentSession is built
- Real-time status badge update via WebSocket — currently requires a page refresh or polling; fixed in Module 11
- Contest search / full-text filter on the list page
- Export assigned candidate list as CSV
