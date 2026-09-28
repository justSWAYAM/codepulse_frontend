# CodePulse Enterprise — Module 6: Frontend Plan
**Scope: Frontend only. Pages in scope: `AssessmentPage` (the exam-taking shell: timer, question navigation, question display, submit) and the Candidate "Start / Resume Exam" entry point on `ContestDetailPage`. Backend (Module 6) must be working — do not touch it.**

---

## 1. Purpose of This Document

This is the single reference for building Module 6 of the frontend. It contains:
- What this module builds, and what it deliberately leaves as an empty slot for Module 8
- The changes to Module 3/4's `ContestDetailPage` that the backend's session gating forces
- The timer design (the hardest part of this module) and why it is built the way it is
- API layer, hooks, routing, and a strict build sequence

No code is written here — only specifications.

---

## 2. Tech Stack for Module 6

**No new dependencies.** Everything needed already exists:

| Need | Already have it from | Reused as |
|---|---|---|
| Data fetching, polling, cache | All prior modules (TanStack Query) | `useAssessmentSession`, mutations |
| Status pill | Module 3 generic `StatusBadge` (its plan says it is reused by "`SessionStatusBadge`") | `SessionStatusBadge` |
| Confirm dialogs | Module 3 `ConfirmDialog` | Start and Submit confirmations |
| Loading/error/empty states | Module 1 | Unchanged |
| Question display | Module 4 `QuestionDetailCard` (+ Module 5's sample test cases inside it) | Center panel of `AssessmentPage` |
| Icons | lucide-react | `Timer`, `Play`, `Send`, `CheckCircle2`, `AlertTriangle`, `Lock` |
| Motion | Framer Motion | Panel transitions only — no timer animation |

**Monaco is intentionally not installed here.** The roadmap lists Monaco in the overall stack and says `AssessmentPage` "hosts" it, but the actual `CodeEditorPanel` (Monaco wrapper with language selector) is a **Module 8** component. Module 6 builds the layout with a clearly labelled editor slot (Section 5.5). If you find yourself running `npm install` anything, stop and check whether an earlier module already built it.

---

## 3. Design Direction (Continuation of Module 5)

No new colors, fonts, or motion rules. Module 6 is the first **focus-mode** screen in the app, so the design changes in density and restraint, not in palette.

### 3.1 Timer color states (reusing the existing palette)

| Remaining time | Style | Rationale |
|---|---|---|
| More than 10 minutes | `ink` text on `surface` | Calm; the timer should be visible but not nagging |
| 10 minutes or less | `accent-syntax` amber | Same "caution" meaning amber has on MEDIUM difficulty |
| 2 minutes or less | `accent-error` red | Same "danger" meaning as HARD / delete |

The timer is rendered in **JetBrains Mono** (technical value, per the Module 4 typography rule) with tabular numerals so digits don't jitter as they change. **No bouncing, pulsing, or scaling** — it matches Module 1's "no bounce" rule, and a pulsing red number is stress a candidate doesn't need. Honor `prefers-reduced-motion`.

### 3.2 Screen-reader announcements
The timer must **not** be an `aria-live` region that speaks every second. Announce only at thresholds (10 minutes, 2 minutes, 30 seconds, time up) via a separate visually-hidden live region.

### 3.3 Layout
`AssessmentPage` is a **three-region, full-viewport layout**:

```
┌──────────────────────────────────────────────────────────────┐
│ Header: contest title · SessionStatusBadge · CountdownTimer · Submit │
├─────────────┬────────────────────────────┬───────────────────┤
│ Question    │ QuestionPanel              │ Editor / output   │
│ Navigator   │ (QuestionDetailCard)       │ slot (Module 8)   │
│ (sidebar)   │                            │                   │
└─────────────┴────────────────────────────┴───────────────────┘
```

On narrow viewports the navigator collapses into a drawer. Editing code on a phone is not a supported use case; the layout only needs to degrade gracefully, not be optimized.

---

## 4. Decisions Carried Over From the Backend Plan

These are frontend consequences of choices already made in the Module 6 backend plan, called out so nobody reinvents them differently here.

### 4.1 The server owns the clock — the client only displays it
The timer never counts independently. Every session response includes `serverTime` and `endsAt`; the client computes `offset = serverTime − Date.now()` on **every** response and displays `endsAt − (Date.now() + offset)`. A candidate with a wrong system clock therefore still sees the correct countdown. No request ever carries a time value.

### 4.2 Resume comes from `GET`, not from `start`
`POST /start` is "start or resume", so calling it on every page load *would* work — but it would also silently **start** an exam for a candidate who merely opened a bookmarked URL. So:
- **Explicit action:** only the "Start Exam" button calls `start`, after a `ConfirmDialog`.
- **Page load / refresh:** `AssessmentPage` calls `GET .../session`. Session found and `IN_PROGRESS` → resume. `404` → redirect to the contest page with a message.

### 4.3 Candidates need a session before they can read any question
The backend plan's Section 2.2/9.3 (recommended tightening) makes candidate question reads return `403` without an active session. Consequences:
- The candidate **Questions tab on `ContestDetailPage` can no longer list questions before Start.** It is replaced by an exam entry card (Section 6.1).
- Questions and sample test cases are fetched **only after** the session is confirmed `IN_PROGRESS` (`enabled: sessionIsActive` on those queries).
- If the backend plan's 9.3 was *not* adopted, the tab still works — but the plan below assumes it was. Check before building.

### 4.4 Sessions are one-shot
One attempt per candidate per contest (backend `UNIQUE (contest_id, candidate_id)`). After `SUBMITTED` / `AUTO_SUBMITTED`, `start` returns `409`. The UI must never offer "Start" again once a session has ended, and must show a clear ended state instead.

### 4.5 `EXPIRED` is a reserved status
Type it, but no UI path produces it and `SessionStatusBadge` gets no dedicated design for it — fall back to a neutral style.

### 4.6 Unsaved editor text is not persisted
Refresh restores the **clock and session**, not text typed into an editor. Draft auto-save is a listed future enhancement. Module 8 owns the editor, but the `beforeunload` warning (Section 8.3) lives here.

---

## 5. Site Map for Module 6

```
/dashboard/contests/:id                          → ContestDetailPage (EXISTING — candidate entry card, Section 6.1)

/dashboard/contests/:contestId/assessment        → AssessmentPage (NEW, Candidate only)
```

**Why `assessment` and not `session`:** the user-facing thing is "taking the assessment"; `session` is the backend's word. **Why nested under the contest:** every session API call is already scoped by `contestId`, and the route carries exactly that one param — no second ID to thread.

**Why outside the normal `AppShell` chrome:** a candidate mid-exam should not have a full app sidebar pulling them toward other pages. `AssessmentPage` renders inside `ProtectedRoute` but with its own focused header (Section 3.3), like the auth pages use `AuthLayout` rather than `AppShell`.

---

## 6. Component Inventory

### 6.1 Extending an Existing Page — `ContestDetailPage` (Modules 3 & 4)

Module 3's frontend plan explicitly deferred the candidate "Start Exam" button: *"ContestDetailPage does not have a 'Start' button yet; add it in Module 6."* This is that addition. It also replaces the candidate variant of the Module 4 Questions tab (Section 4.3).

**Candidate view of the tab set**

| Tab | Candidate sees | Notes |
|---|---|---|
| Overview | Unchanged, **plus `ExamEntryCard` at the top** | The entry point lives where the candidate already looks |
| Candidates | Hidden (unchanged from Module 3) | |
| Questions | **Hidden for Candidates** | Replaces Module 4's "only when ONGOING" behavior; questions are now reachable only through the Assessment page |

Admin/Evaluator tabs are **untouched**.

### 6.2 New Components

#### `AssessmentPage`

| Property | Value |
|---|---|
| **Location** | `src/pages/AssessmentPage.tsx` |
| **Route** | `/dashboard/contests/:contestId/assessment` |
| **Access** | Candidate only (`ProtectedRoute roles={['CANDIDATE']}`) |
| **On load** | `useAssessmentSession(contestId)`. `404` → redirect to contest page. `IN_PROGRESS` → render exam. Any ended status → render `SessionEndedScreen`. |
| **Contents** | Header (title, `SessionStatusBadge`, `CountdownTimer`, "Submit Exam"), `QuestionNavigator`, `QuestionPanel`, editor slot |
| **Questions** | `useQuestions(contestId)` with `enabled` only while the session is `IN_PROGRESS` |
| **State handling** | Loading skeleton; `ErrorState` for 403/409 with the backend's message shown verbatim |

#### `ExamEntryCard`

| Property | Value |
|---|---|
| **Location** | `src/components/session/ExamEntryCard.tsx` |
| **Purpose** | The single place a candidate starts, resumes, or reviews the end of their exam. Its content is **derived from contest status + session state**, never guessed. |
| **Props** | `contest: ContestResponse` |

| Contest / session state | Card shows | Action |
|---|---|---|
| `PUBLISHED`, not started yet | "Exam opens on {start time}" | None (disabled) |
| `ONGOING`, no session | Duration, rules summary, "You get one attempt" | **Start Exam** → `ConfirmDialog` → `start` |
| `ONGOING`, session `IN_PROGRESS` | Time remaining (from server), "Your exam is in progress" | **Resume Exam** → navigate to `AssessmentPage` (no `start` call) |
| Any, session `SUBMITTED` | "You submitted on {time}" | None |
| Any, session `AUTO_SUBMITTED` | "Time ran out — your exam was submitted automatically" | None |
| `COMPLETED`, no session | "You didn't take this exam" | None |

The card fetches session state through `useAssessmentSession`, treating `404` as "no session", **not** as an error to display.

**Start confirmation copy:** *"Start the exam now? Your {N}-minute timer begins immediately and cannot be paused. You only get one attempt."*

#### `CountdownTimer`

| Property | Value |
|---|---|
| **Location** | `src/components/session/CountdownTimer.tsx` |
| **Purpose** | Presentational only: renders `HH:MM:SS` from `remainingSeconds`. Contains **no timing logic** — that lives in `useSessionTimer` (Section 8). |
| **Props** | `remainingSeconds: number` |
| **Behavior** | Applies the Section 3.1 color states. At `0`, shows "Time's up". |

#### `QuestionNavigator`

| Property | Value |
|---|---|
| **Location** | `src/components/session/QuestionNavigator.tsx` |
| **Purpose** | Sidebar list of the contest's questions in `orderIndex` order; click switches the active question |
| **Row content** | Number, title, `DifficultyBadge` (Module 4), points |
| **Status per row** | **Current** and **visited** only (client-side state). The roadmap describes "attempted/unattempted," but *attempted* means "has a submission," and submissions don't exist until Module 8. The row is built with a status slot so Module 8 adds the real indicator without restructuring the component. |
| **Props** | `questions: QuestionCandidateRecord[]`, `activeId: string`, `visitedIds: Set<string>`, `onSelect: (id: string) => void` |

#### `QuestionPanel`

| Property | Value |
|---|---|
| **Location** | `src/components/session/QuestionPanel.tsx` |
| **Purpose** | The center region. Thin wrapper around Module 4's `QuestionDetailCard` for the active question — it is the "`QuestionPanel`" Module 4's plan said the Assessment page would use. Because `QuestionDetailCard` already renders the sample test cases (Module 5), nothing is duplicated here. |
| **Props** | `question: QuestionCandidateRecord` |

#### `EditorSlot`

| Property | Value |
|---|---|
| **Location** | `src/components/session/EditorSlot.tsx` |
| **Purpose** | Right region. A clearly marked placeholder ("Code editor arrives with the Submission module") occupying the exact space Module 8's `CodeEditorPanel` will fill. Exists so layout, resizing, and responsive behavior are settled now. |
| **Rule** | Contains **no editor code**. When Module 8 lands, this file is replaced by `CodeEditorPanel`; nothing else in the page changes. |

#### `SubmitExamDialog`

| Property | Value |
|---|---|
| **Location** | `src/components/session/SubmitExamDialog.tsx` |
| **Purpose** | Confirmation before the manual final submit — irreversible, ends the session |
| **Copy** | *"Submit your exam? You won't be able to make further changes. Any time remaining will be forfeited."* |
| **On confirm** | `useSubmitSession` → on success show `SessionEndedScreen` |

#### `SessionEndedScreen`

| Property | Value |
|---|---|
| **Location** | `src/components/session/SessionEndedScreen.tsx` |
| **Purpose** | Terminal state shown after `SUBMITTED` or `AUTO_SUBMITTED` (including when time runs out while the page is open, and on any later revisit) |
| **Copy** | Distinguishes the two: "You submitted your exam" vs. "Time ran out — your exam was submitted automatically." No score mentioned — results are published by an Admin later (Module 9). |
| **Action** | "Back to contest" |

#### `SessionStatusBadge`

| Property | Value |
|---|---|
| **Location** | `src/components/session/SessionStatusBadge.tsx` |
| **Purpose** | Wraps the generic `StatusBadge` (Module 3). `IN_PROGRESS` → green, `SUBMITTED` → neutral, `AUTO_SUBMITTED` → amber, anything else (incl. reserved `EXPIRED`) → neutral |

---

## 7. API Layer

### 7.1 Types (`src/api/sessionApi.ts`)

```typescript
export type SessionStatus =
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'AUTO_SUBMITTED'
  | 'EXPIRED';            // reserved — no UI path produces it (Section 4.5)

export interface StartSessionResponse {
  sessionId: string;
  contestId: string;
  status: SessionStatus;
  startedAt: string;      // ISO 8601
  endsAt: string;         // ISO 8601, server-computed
  serverTime: string;     // ISO 8601, the server's "now" at response time
  remainingSeconds: number;
  resumed: boolean;       // false = new session, true = existing returned
}

export interface SessionStatusResponse {
  sessionId: string;
  contestId: string;
  status: SessionStatus;
  startedAt: string;
  endsAt: string;
  submittedAt: string | null;   // null while IN_PROGRESS
  serverTime: string;
  remainingSeconds: number;     // 0 unless IN_PROGRESS
}
```

There is no request type: none of the three calls sends a body.

### 7.2 API Functions (`src/api/sessionApi.ts`)

```typescript
export const sessionApi = {

  start: async (contestId: string): Promise<StartSessionResponse> => {
    const { data } = await apiClient.post<ApiWrapper<StartSessionResponse>>(
      `/contests/${contestId}/session/start`
    );
    return data.data;
  },

  // 404 means "no session yet" — callers must treat it as a normal outcome,
  // not surface it as an error (Section 4.2 and ExamEntryCard).
  getStatus: async (contestId: string): Promise<SessionStatusResponse> => {
    const { data } = await apiClient.get<ApiWrapper<SessionStatusResponse>>(
      `/contests/${contestId}/session`
    );
    return data.data;
  },

  submit: async (contestId: string): Promise<SessionStatusResponse> => {
    const { data } = await apiClient.post<ApiWrapper<SessionStatusResponse>>(
      `/contests/${contestId}/session/submit`
    );
    return data.data;
  },
};
```

Paths follow the `questionApi` convention from Module 4 (no `/api` prefix — `apiClient`'s base URL supplies it).

---

## 8. Hooks

**File:** `src/hooks/useAssessmentSession.ts`

```typescript
export const sessionKeys = {
  detail: (contestId: string) => ['session', contestId] as const,
};

export const useAssessmentSession = (contestId: string) =>
  useQuery({
    queryKey: sessionKeys.detail(contestId),
    queryFn: () => sessionApi.getStatus(contestId),
    enabled: !!contestId,
    retry: (count, error) => !isNotFound(error) && count < 2,  // 404 is an answer, not a failure
    refetchInterval: (query) =>
      query.state.data?.status === 'IN_PROGRESS' ? 30_000 : false,  // periodic re-sync
    refetchOnWindowFocus: true,   // re-sync when the candidate returns to the tab
    staleTime: 0,
  });

export const useStartSession = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sessionApi.start(contestId),
    onSuccess: (data) => {
      queryClient.setQueryData(sessionKeys.detail(contestId), toStatusResponse(data));
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contestId) });  // ContestCandidateStatus changed
    },
  });
};

export const useSubmitSession = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sessionApi.submit(contestId),
    onSuccess: (data) => {
      queryClient.setQueryData(sessionKeys.detail(contestId), data);
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contestId) });
    },
  });
};
```

**`useSessionTimer` — `src/hooks/useSessionTimer.ts`**

```typescript
useSessionTimer(session: SessionStatusResponse | undefined): {
  remainingSeconds: number;
  isExpired: boolean;
}
```

Behavior (this is the part of the module most worth getting exactly right):
1. **On every new `session` object** (every fetch, including the 30-second re-sync and focus refetch), recompute `offsetMs = Date.parse(serverTime) − Date.now()`. Never compute it once and keep it.
2. Tick once per second with `setInterval`; `remaining = max(0, ceil((Date.parse(endsAt) − (Date.now() + offsetMs)) / 1000))`.
3. **Clear the interval on unmount and whenever `session` is not `IN_PROGRESS`.**
4. When `remaining` first reaches `0`, set `isExpired = true` and trigger **one** `refetch()` of the session. The backend lazily auto-submits on that `GET`, so the response confirms `AUTO_SUBMITTED`. The page then swaps to `SessionEndedScreen`. The client **never decides** the exam is over on its own — it asks the server and displays the answer.
5. If that refetch returns `IN_PROGRESS` with time left (clock skew corrected), the timer simply resumes from the new offset.

**The timer never calls `submit`.** Auto-submit is the server's job (Module 6 backend scheduler + lazy enforcement). A client that submits on reaching zero would race the server and be wrong whenever its clock is off.

**8.3 `beforeunload` guard:** while the session is `IN_PROGRESS`, register a `beforeunload` handler that prompts the browser's native "Leave site?" warning; remove it when the session ends. It cannot prevent a refresh (and shouldn't — refresh must be safe) but stops accidental tab closes. The message is browser-controlled; do not try to customize it.

---

## 9. Routing

Add to `App.tsx`. `AssessmentPage` sits **outside** the `AppShell` wrapper (Section 5) but inside `ProtectedRoute`:

```tsx
<Route
  path="/dashboard/contests/:contestId/assessment"
  element={
    <ProtectedRoute roles={['CANDIDATE']}>
      <AssessmentPage />
    </ProtectedRoute>
  }
/>
```

Admin and Evaluator visiting this URL are redirected to the dashboard home, same behavior as the Module 4 admin-only routes.

---

## 10. `ContestDetailPage` Changes (Summary)

1. **Overview tab, Candidate role only:** render `ExamEntryCard` above the existing content.
2. **Questions tab:** hide it for the Candidate role entirely (Section 4.3). Remove the Module 4 candidate branch that showed a read-only list "when ONGOING." The Module 4 `QuestionListPanel` is left in place for Admin/Evaluator, unchanged.
3. Nothing changes for Admin/Evaluator.

---

## 11. Error Mapping

The backend returns specific errors for each failure (Module 6 backend, Section 14). Show the **backend's message** rather than a generic one:

| Status | Meaning | UI |
|---|---|---|
| `403` | Not assigned to the contest | `ErrorState`: "You don't have access to this exam" |
| `404` on `GET` | No session yet | **Not an error** — `ExamEntryCard` shows the Start state; `AssessmentPage` redirects |
| `409` on `start` | Contest not started / ended, or session already ended | Toast with the server message; card re-derives its state |
| `409` on `submit` | Should not occur (submit is idempotent) | Treat as "already ended": refetch and show `SessionEndedScreen` |
| Network failure mid-exam | Connection dropped | Keep showing the **last known** timer (it keeps counting locally from the last offset); show a small "Reconnecting…" indicator; refetch on reconnect. Never blank the exam screen. |

---

## 12. Build Sequence

1. **Create `src/api/sessionApi.ts`** — types and functions. No UI yet.
2. **Create `useAssessmentSession.ts`** — `useAssessmentSession`, `useStartSession`, `useSubmitSession`. Verify the 404-is-not-an-error behavior against a contest with no session.
3. **Create `useSessionTimer.ts`** and test it in isolation with a mocked session and a deliberately wrong system clock — the display must still be right.
4. **Create `CountdownTimer.tsx`** and `SessionStatusBadge.tsx` — presentational; verify the three color states with hard-coded values.
5. **Create `ExamEntryCard.tsx`** — all six states from the Section 6.2 table. Wire it into the Overview tab for the Candidate role.
6. **Hide the candidate Questions tab** (Section 10) and verify a Candidate can no longer reach a question list outside the Assessment page.
7. **Create `QuestionNavigator.tsx`** and `QuestionPanel.tsx` (wrapping `QuestionDetailCard`) with mock data first.
8. **Create `EditorSlot.tsx`**, `SubmitExamDialog.tsx`, and `SessionEndedScreen.tsx`.
9. **Create `AssessmentPage.tsx`** — assemble the layout; gate the questions query on an active session; wire the timer, submit flow, ended state, and `beforeunload` guard.
10. **Add the route** to `App.tsx`, outside `AppShell`.
11. **Short-window end-to-end test:** with a 1–2 minute contest, run Start → refresh mid-exam → let it expire (verify auto-submit screen) → attempt Start again (verify blocked). See Definition of Done.

---

## 13. Role-Based UI Rules

| UI Element | Admin | Evaluator | Candidate |
|---|---|---|---|
| `ExamEntryCard` on Overview tab | ❌ Not shown | ❌ Not shown | ✅ Shown |
| Questions tab on `ContestDetailPage` | ✅ Always | ✅ Always | ❌ Hidden (reachable only via the Assessment page) |
| `/dashboard/contests/:contestId/assessment` | ❌ Redirect | ❌ Redirect | ✅ Accessible |
| Start / Resume / Submit controls | ❌ | ❌ | ✅ |

Admin/Evaluator get no session UI in this module — live monitoring of sessions is Module 13.

---

## 14. Definition of Done

- [ ] Candidate on an `ONGOING` contest with no session sees "Start Exam"; on a `PUBLISHED` contest sees a disabled "opens on…" state
- [ ] "Start Exam" requires confirmation, then lands on `AssessmentPage` with the timer running
- [ ] Refreshing `AssessmentPage` mid-exam returns to the **same** session with correct remaining time and does **not** call `start`
- [ ] Opening the assessment URL with no session redirects to the contest page instead of starting an exam
- [ ] With the system clock deliberately set wrong (minutes ahead/behind), the countdown still matches the server's `endsAt`
- [ ] Timer turns amber at ≤10 min and red at ≤2 min, with no animation; screen readers are notified only at thresholds
- [ ] Timer re-syncs against the server (30-second poll and on tab focus) — verified by observing a corrected value after a forced drift
- [ ] When time reaches zero, the page confirms with the server and shows the "submitted automatically" screen; the client never calls `submit` itself
- [ ] "Submit Exam" requires confirmation, ends the session, and shows the "You submitted" screen
- [ ] After any ended state, the contest page never offers Start again; a direct `start` attempt shows the server's message
- [ ] The candidate Questions tab is gone; questions are only visible inside `AssessmentPage`
- [ ] Questions and sample test cases are not requested before the session is confirmed `IN_PROGRESS`
- [ ] Question navigator switches the active question and marks current/visited
- [ ] Admin/Evaluator visiting the assessment route are redirected
- [ ] Losing network mid-exam does not blank the screen; a "Reconnecting…" indicator appears and recovers
- [ ] No TypeScript errors (`npm run build` passes)

---

## 15. Things to Watch Out For

| Pitfall | What to do |
|---|---|
| Timer counts down with `Date.now()` alone | Always apply `serverTime` offset, and recompute it on **every** response (Section 8). This is the one requirement the roadmap repeats. |
| Auto-starting the exam on page load | Only the confirmed button calls `start`; page load calls `GET` (Section 4.2) |
| Client calls `submit` when the timer hits zero | Don't. Refetch and display what the server decided (Section 8, step 4) |
| Treating the `GET` 404 as an error | It means "no session yet" — normal for a candidate who hasn't started. Disable retries on it. |
| `setInterval` left running after unmount or after the session ends | Clear it in cleanup; a leaked interval keeps mutating state and re-firing the expiry refetch |
| Refetch storm when the timer hits zero | Fire the expiry refetch **once** (guard with `isExpired`), not on every tick after zero |
| Showing a score on the ended screen | There isn't one — results are gated behind Admin publishing (Module 9). Don't add a placeholder score. |
| Leaving the candidate Questions tab visible | The backend now returns `403` for it before a session exists; a visible tab that errors looks like a bug |
| Building the editor now | Module 8 owns `CodeEditorPanel`. Keep `EditorSlot` empty so the swap is one file |
| Announcing every second to screen readers | Threshold announcements only (Section 3.2) |

---

## 16. Future Enhancements (carried over / new)

- Real "attempted / unattempted" indicators in `QuestionNavigator` once submissions exist (Module 8) — the status slot is already there
- Editor draft auto-save every N seconds so unsubmitted code survives a crash (roadmap future enhancement)
- Per-question time tracking display (roadmap)
- A `DashboardHome` "Resume your exam" banner for candidates with an `IN_PROGRESS` session
- Live-proctoring hooks (webcam capture, tab-switch detection) that mount inside `AssessmentPage` in Modules 12–13; the header and layout leave room for a small recording indicator
