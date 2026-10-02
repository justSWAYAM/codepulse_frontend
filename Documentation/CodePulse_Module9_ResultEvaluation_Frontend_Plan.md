# CodePulse Enterprise — Module 9: Frontend Plan
### Result & Evaluation Service — Frontend Layer

**Scope: Frontend only.** In scope:
- a new **Results** tab on `ContestDetailPage` (leaderboard plus publish control, for Admin and Evaluator);
- a new `EvaluationPage` where an Evaluator reviews one candidate and adjusts question scores;
- a new `MyResultPage`, and a result summary on the candidate's contest page.

The Module 9 backend must be working (see `codepulse_backend/Documentation/CodePulse_Module9_ResultEvaluation_Backend_Plan.md`). Do not touch it.

**Status:** plan, not yet built (written 2026-10-03 against frontend `main` @ `bfd9b4e`).

---

## 1. Purpose of This Document

This is the single reference for building Module 9 of the frontend. It contains:
- the backend decisions this UI must respect, chiefly the **publish boundary**: candidates see nothing until an Admin publishes;
- the changes to existing Module 3, 6 and 8 screens (`ContestDetailPage`, `ExamEntryCard`, `SubmissionDetailSheet`, `ContestCard`);
- the component inventory, API layer, hooks, routing, a strict build sequence and the Definition of Done.

No code is written here, only specifications. Code snippets show shapes and names, not finished implementations.

---

## 2. What This Module Inherits (Do Not Rebuild)

**No new dependencies.** If you find yourself running `npm install`, stop and check whether an earlier module already built it.

| Need | Already have it from | Reused as |
|---|---|---|
| Data fetching, polling, cache | TanStack Query (all modules) | `useResults`, `useCandidateResult`, `useMyResult`, mutations |
| Wrapped API responses | `ApiWrapper<T>` exported from `src/api/auth.ts` (used by `sessionApi.ts`) | Every `resultApi` call unwraps `data.data` |
| Client-side sortable/paged table | `components/DataTable.tsx` (TanStack Table) | `LeaderboardTable` |
| Forms + validation | React Hook Form + Zod (Modules 1–5) | `ScoreOverrideForm`, unpublish reason |
| Dialogs and side sheets | `components/ui` `Dialog`, `Sheet` (Radix) | `PublishConfirmDialog`, `UnpublishDialog` |
| Tabs with URL state | `ContestDetailPage` `?tab=` pattern (Module 8 Submissions tab) | New `results` tab, URL-backed filters |
| Verdict chips, output blocks | `components/editor/VerdictBadge.tsx` (`VerdictBadge`, `OutputBlock`) | Per-question verdicts, compile output |
| Evaluator test-case rows | `TestRow` inside `components/submission/SubmissionDetailSheet.tsx` | **Extracted** into a shared component (Section 6.3) |
| Read-only code view | `components/editor/MonacoEditor.tsx` (`readOnly` prop, always dark) | Counted submission code on `EvaluationPage` |
| Candidate submission detail | `useSubmissionDetail(id)` (Module 8) | "View my code" on `MyResultPage` |
| Evaluator submission detail and list | `useEvaluatorSubmission(id)`, `ContestSubmissionsPanel` URL filters (`sc`, `sq`) | `EvaluationPage` code and tests; "All attempts" deep link |
| Error copy | `src/lib/apiError.ts` (`getErrorCode`, `getErrorMessage`, `FRIENDLY`) | New codes added (Section 10) |
| Loading/empty/error states | `components/states/*`, `Skeleton` | Unchanged |
| Role-gated routes | `ProtectedRoute roles={[…]}` (wrong role → toast + `/dashboard`) | New routes |
| Design system | Module 8 frontend plan §6 (tokens, primitives, motion rules) | Everything here |

---

## 3. Design Direction

No new colors, fonts or motion rules. Module 8 §6 applies in full: semantic tokens only (`bg-surface`, `text-fg-muted`, `border-line`, `bg-primary-soft`…), **green, amber and red are reserved for status**, no `transition-all`, hover through `hover-fine:`, and instant tab or question switches.

### 3.1 Status colors on results

| Thing | Style | Why |
|---|---|---|
| `SCORED` | neutral `Badge` (or no badge) | The normal case shouldn't shout |
| `NEEDS_REVIEW` | `warning` `Badge` with the reason as a tooltip | Same "caution" meaning amber has everywhere else |
| `ABSENT` | neutral `Badge` "Absent", row text `text-fg-subtle` | Not an error, just no attempt |
| Adjusted score | `primary` dot after the number + "Adjusted" in the tooltip | Informational, not a verdict |
| Published | `success` `Badge` "Published" | A completed state, like `COMPLETED` |
| Unpublished | neutral `Badge` "Not published" | |

**No gold, silver or bronze medals.** Top ranks get no special color: the palette reserves color for status, and a podium look invites screenshots of a provisional leaderboard. Rank is a plain tabular number.

### 3.2 Typography
Scores, ranks and times use `tabular` (and `font-mono` for scores inside tables) so columns line up. Show scores as `42.5 / 60`, formatted with up to 2 decimals and no trailing zeros (`42.5`, not `42.50`). Add `formatScore()` to `src/lib/format.ts`.

### 3.3 Layout

**Results tab (`ResultsPanel`):**
```
┌───────────────────────────────────────────────────────────────┐
│ ResultsStatusCard: Published? · readiness checklist · actions │
├───────────────────────────────────────────────────────────────┤
│ Filters: search · All | Needs review | Adjusted | Absent      │
├───────────────────────────────────────────────────────────────┤
│ LeaderboardTable                                              │
│ #  Candidate          Q1     Q2     Q3     Total    Time  St. │
│ 1  Asha · 22CS041     30/30  20/20  10/10  60/60    41m       │
│ 2  Ravi · 22CS017     30/30  20/20  0/10   50/60    38m   ⚠   │
└───────────────────────────────────────────────────────────────┘
```

**`EvaluationPage` (≥ `xl`, two columns; one column below):**
```
┌───────────────────────────────────────────────────────────────┐
│ ← Results · Candidate name · roll · status · 50/60 · Rank 2   │
│ Session: started · submitted · time taken                     │
├───────────────────────────────────────────────────────────────┤
│ Q1 30/30 │ Q2 20/20 │ Q3 0/10 •                  (Segmented)  │
├──────────────────────────────┬────────────────────────────────┤
│ Counted submission           │ Score                          │
│ language · verdict · when    │ auto 0 → final [ 5 ] / 10      │
│ ┌──────────────────────────┐ │ comment [............]         │
│ │ read-only Monaco (dark)  │ │ [Save adjusted score] [Revert] │
│ └──────────────────────────┘ │ History (newest first)         │
│ compile output               │ Test results (all cases)       │
└──────────────────────────────┴────────────────────────────────┘
```

**`MyResultPage`:** one centered column, max width `3xl`. A score card (total / max, "Rank 3 of 41", published date), then one row per question.

### 3.4 Accessibility
- The leaderboard is a real `<table>` (through `DataTable`), with the rank column header "Rank" and sortable headers announced by TanStack's sort buttons.
- The adjusted dot always has text (`sr-only` "adjusted") and the warning badge has a visible label, so meaning never rests on color alone.
- `ScoreOverrideForm` fields have labels and inline error text tied with `aria-describedby` (the `Field` primitive already does this).
- Publish and unpublish dialogs trap focus and close on Escape (Radix `Dialog`).

### 3.5 Responsiveness
Below `md`, the leaderboard hides per-question columns and shows Rank, Candidate, Total and Status; the per-question detail is one click away on `EvaluationPage`. `EvaluationPage` stacks code above scoring below `xl`. Grading on a phone isn't a target, but nothing may overflow horizontally except the table's own scroll container.

---

## 4. Decisions Carried Over From the Backend Plan

These are frontend consequences of choices already made in the Module 9 backend plan, called out so nobody reinvents them differently here.

### 4.1 Every Module 9 response is wrapped, including `/submissions/{id}/evaluate`
Module 8's `/api/submissions/*` endpoints return bare DTOs (see `submissionApi.ts`). **Module 9 returns `ApiResponse<T>` everywhere**, and that includes `POST /submissions/{id}/evaluate`. Put that call in `resultApi.ts`, not `submissionApi.ts`, so the "unwrap or not" rule stays per file.

### 4.2 Publish state comes from the contest
The contest itself carries `resultsPublished` and `resultsPublishedAt` (added to `ContestResponse` / `ContestDetailResponse`). The candidate's contest page decides what to show from `useContest(id)`, which it already loads. It never needs a separate "is it published?" request.

### 4.3 "Not published" is a normal answer, not an error
`GET /contests/{id}/results/me` returns `200` with `published: false` and every result field `null` before publishing. Render it as a calm state, never as an `ErrorState`. A `404` here means "not assigned to this contest", the same as everywhere else.

### 4.4 Candidates never see more than their own numbers
After publishing, a candidate sees: total, max, rank and "of N ranked", plus per question the final score, counted verdict, tests passed and an "Adjusted" flag. **Never** the evaluator's comment, who adjusted it, the automatic score before adjustment, or anyone else's result. The backend already omits these fields. Don't add UI that implies they exist ("see evaluator's note").

### 4.5 An override sets a question's score, and it must target the counted submission
The backend accepts an evaluation only on the **counted** SUBMIT (`counted: true` / `ResultResponse.questions[].countedSubmission.id`). `EvaluationPage` therefore always evaluates `countedSubmission.id`. It never offers "evaluate" on other attempts. A question with no counted submission shows "No scored submission — this question scores 0" and no form.

### 4.6 Published results are frozen
While published, the backend refuses evaluations and rejudges (`RESULTS_PUBLISHED_LOCKED`). The UI disables those controls and says why, rather than letting the user hit the error. The way to change anything is **Unpublish** (Admin, with a reason), fix, then **Publish** again.

### 4.7 Readiness drives the publish button
The leaderboard response carries `readiness` (`inProgress`, `judging`, `missing`, `needsReview`, `readyToPublish`…). The publish button's enabled state and its explanation come **only** from `readiness`. Don't re-derive "is the contest done?" from times on the client.

### 4.8 Ranking and tie-break are the server's
Rank comes from the server: competition ranking (1, 2, 2, 4), ties broken by time taken from each candidate's own start, absentees unranked. The table may **sort** by other columns for browsing, but the Rank column always shows the server's rank and never re-numbers on sort.

---

## 5. Site Map for Module 9

```
/dashboard/contests/:id?tab=results                      → ContestDetailPage, NEW Results tab (Admin, Evaluator)
                                                            URL filters: &rq=<search>&rf=<all|review|adjusted|absent>
/dashboard/contests/:contestId/results/:candidateId      → EvaluationPage (NEW, Admin + Evaluator, inside AppShell)
                                                            &q=<questionId> selects the question
/dashboard/contests/:contestId/result                    → MyResultPage (NEW, Candidate, inside AppShell)
```

**Why a tab and not the roadmap's separate `ResultsPage`:** every staff view of a contest already lives as a tab on `ContestDetailPage` (Candidates, Questions, Submissions). A tab keeps the contest header, status and navigation in one place. The roadmap's `ResultsPage` is the `ResultsPanel` component inside that tab.

**Why `EvaluationPage` is a page and not a sheet:** side-by-side code, test results and a scoring form need the full width, and the URL (`…/results/:candidateId?q=…`) must be shareable between evaluators. Module 8's `SubmissionDetailSheet` stays as it is for quick looks.

**Why `result` (singular) for the candidate:** a candidate has exactly one result per contest; `results` is the staff list.

---

## 6. Component Inventory

### 6.1 Extending Existing Screens

**`ContestDetailPage` (Modules 3/4/8)**

| Change | Detail |
|---|---|
| New tab `results` | Added to `Tab` and to `allowedTabs` for staff **only when `contest.status` is `ONGOING` or `COMPLETED`**. Before that there is nothing to show. Icon `Trophy` or `Medal` (lucide), label "Results", rendered after "Submissions" |
| Tab content | `<ResultsPanel contest={contest} />` |
| Header badge | When `contest.resultsPublished`, show a `success` "Results published" badge beside the contest status for every role |

**`ExamEntryCard` (Module 6), candidate only**

| State | Today | Module 9 |
|---|---|---|
| Session `SUBMITTED` / `AUTO_SUBMITTED`, results **not** published | "You have already submitted… Results appear here once the administrator publishes them." | Unchanged |
| Session ended, results **published** | Same text | Render `<MyResultCard contestId=… />` instead |
| `COMPLETED`, no session, published | "You didn't take this exam" | Unchanged (absent candidates get no score card) |

**`SubmissionDetailSheet` (Module 8)**
- Extract `TestRow` into the shared `EvaluatorTestResults` component (Section 6.3); the sheet imports it. No visual change.
- Rejudge: pass `canRejudge={isStaff && !contest.resultsPublished}`. When published, show the disabled button with the tooltip "Unpublish results to rejudge".

**`ContestCard` (Module 3)**
- Candidate role: when `contest.resultsPublished`, show a small `success` "Results out" badge. Staff role: "Results published". No other change.

**`src/api/contestApi.ts`**
- `ContestRecord` gains `resultsPublished: boolean` and `resultsPublishedAt: string | null`.

### 6.2 New Components

#### `ResultsPanel`

| Property | Value |
|---|---|
| **Location** | `src/components/result/ResultsPanel.tsx` |
| **Purpose** | The staff Results tab: status and actions on top, leaderboard below. This is the roadmap's `ResultsPage` |
| **Props** | `contest: ContestDetailRecord` |
| **Data** | `useResults(contest.id)` |
| **States** | Loading → `Skeleton` card and rows. Error → `ErrorState` with Retry. `ONGOING` with no results yet → `EmptyState` "Results appear here as candidates finish." plus the readiness card (it still shows "4 in progress") |

#### `ResultsStatusCard`

| Property | Value |
|---|---|
| **Location** | `src/components/result/ResultsStatusCard.tsx` |
| **Props** | `leaderboard: LeaderboardResponse`, `isAdmin: boolean` |
| **Shows** | Published badge + "Published {date} by {name}", or "Not published". A readiness checklist (below). Max score. Counts: scored / needs review / absent |
| **Actions (Admin only)** | **Recompute** (secondary, always available before publish) → `useRecomputeResults`. **Publish** (primary) → `PublishConfirmDialog`. **Unpublish** (secondary, only when published) → `UnpublishDialog` |
| **Evaluator** | Sees the same card without actions, plus the line "An administrator publishes results." |

#### Readiness checklist (inside `ResultsStatusCard`)

| Row | Done when | Text when not done |
|---|---|---|
| Contest finished | `readiness.contestCompleted` | "The contest is still running. Results can be published after it ends." |
| No exams in progress | `inProgress === 0` | "{n} candidate(s) still taking the exam" |
| Judging finished | `judging === 0` | "{n} candidate(s) still being judged" |
| Every candidate has a result | `missing === 0` | "{n} result(s) missing. Press Recompute." |
| Flagged results reviewed | `needsReview === 0` | "{n} result(s) need review" (warning, **not blocking**; acknowledged in the publish dialog) |

The publish button is enabled iff `readiness.readyToPublish`. When disabled, its tooltip repeats the first unmet row.

#### `LeaderboardTable`

| Property | Value |
|---|---|
| **Location** | `src/components/result/LeaderboardTable.tsx` |
| **Purpose** | The roadmap's `LeaderboardTable`, built on the shared `DataTable` |
| **Props** | `leaderboard: LeaderboardResponse`, `onOpen: (candidateId: string) => void` |
| **Columns** | Rank (server rank; `–` for absent) · Candidate (name, then roll number or email in `text-fg-subtle`) · one column per `leaderboard.questions` entry (`Q{orderIndex+1}`, header tooltip shows title and points; cell `final/max`, `text-fg-subtle` "—" if not attempted, primary dot if adjusted) · Total (`total / max`, bold) · Time (`timeTakenSeconds` as `1h 02m` / `41m`; `–` if null) · Status (`ResultStatusBadge`) |
| **Default order** | As returned (rank ascending, absent last). Sorting other columns is allowed; Rank values never change (4.8) |
| **Row action** | Whole row is clickable and keyboard-activatable (Enter), and opens `EvaluationPage` (`onOpen`). Absent rows open too (they show the empty state) |
| **Filtering** | Done in `ResultsPanel` before passing rows: search matches name, email or roll (case-insensitive); filter `review` = `NEEDS_REVIEW`, `adjusted` = `adjusted`, `absent` = `ABSENT`. Both live in the URL (`rq`, `rf`) |
| **Page size** | 25 (the `DataTable` `pageSize` prop) |

#### `ResultStatusBadge`

| Property | Value |
|---|---|
| **Location** | `src/components/result/ResultStatusBadge.tsx` |
| **Props** | `status: ResultStatus`, `reviewReasons?: ReviewReason[]` |
| **Behavior** | `SCORED` → nothing, or a neutral "Scored" in detail headers; `NEEDS_REVIEW` → warning "Needs review" + tooltip listing reasons in plain words (`UNRESOLVED_SYSTEM_ERROR` → "A submission hit a judge error. Rejudge it."; `OVERRIDE_OUTDATED` → "An adjusted score was made on a submission that no longer counts."); `ABSENT` → neutral "Absent" |

#### `PublishConfirmDialog`

| Property | Value |
|---|---|
| **Location** | `src/components/result/PublishConfirmDialog.tsx` |
| **Props** | `open`, `onOpenChange`, `leaderboard: LeaderboardResponse` |
| **Copy** | Title "Publish results?" Body: "{scored + needsReview} candidates will immediately see their score and rank for {contest title}. Absent candidates see that they didn't take part. While results are published, scores can't be adjusted and submissions can't be rejudged." |
| **Flagged** | If `readiness.needsReview > 0`: a warning box listing the count, plus a required checkbox "I've reviewed the {n} flagged result(s) and want to publish anyway". Confirm stays disabled until it's ticked; the box value is sent as `acknowledgeFlagged` |
| **On confirm** | `usePublishResults` → success toast "Results published" → close |
| **On error** | Inline in the dialog (not a toast), using `getErrorMessage`. `RESULTS_NOT_READY` shows the **server's** message (it has the counts), so it has no `FRIENDLY` entry (Section 10) |

#### `UnpublishDialog`

| Property | Value |
|---|---|
| **Location** | `src/components/result/UnpublishDialog.tsx` |
| **Form** | RHF + Zod: `reason` required, 3–500 characters |
| **Copy** | "Unpublish results? Candidates lose access to their scores until you publish again. Use this to correct a mistake. The reason is recorded in the audit log." |
| **On confirm** | `useUnpublishResults` → toast "Results unpublished" |

#### `EvaluationPage`

| Property | Value |
|---|---|
| **Location** | `src/pages/EvaluationPage.tsx` |
| **Route** | `/dashboard/contests/:contestId/results/:candidateId` (`?q=<questionId>`) |
| **Access** | `ProtectedRoute roles={['ADMIN','EVALUATOR']}` |
| **Data** | `useContest(contestId)` (title, `resultsPublished`), `useCandidateResult(contestId, candidateId)`, and for the selected question `useEvaluatorSubmission(countedSubmission?.id ?? null)` |
| **Header** | "← Results" `ButtonLink` to `/dashboard/contests/:contestId?tab=results`. Candidate name, roll number, email, `ResultStatusBadge`, `total / max`, "Rank {n} of {rankedCount}" (or "Absent"), and a session strip (started, submitted, time taken, `AUTO_SUBMITTED` noted as "time ran out") |
| **Question switcher** | `Segmented` with `Q1…Qn`, each with `final/max` and a dot if adjusted or outdated. Selection lives in `?q=`; it defaults to the first question needing attention (outdated override → judge error → first) |
| **Left column** | `EvaluationPanel` code half: language, `VerdictBadge`, "submitted {time}", "{submitAttempts} attempts" with link **All attempts** → `/dashboard/contests/:contestId?tab=submissions&sc=<candidateId>&sq=<questionId>` (Module 8 filters). Read-only `MonacoEditor` with the counted code. Compile output via `OutputBlock` when present |
| **Right column** | `ScoreOverrideForm`, `EvaluationHistoryList`, `EvaluatorTestResults` (every test case, from the evaluator submission view) |
| **Empty question** | No counted submission → `EmptyState` "No scored submission — this question scores 0." If `systemErrorCount > 0`, add a warning: "{n} submission(s) hit a judge error. Rejudge them from the Submissions tab." with that deep link |
| **Absent candidate** | Header + `EmptyState` "This candidate didn't take the exam." No switcher |
| **Not found** | `404 RESULT_NOT_FOUND` (still in progress, or not assigned) → `ErrorState` "No result yet. This candidate may still be taking the exam or being judged." + back link |

#### `EvaluationPanel`

| Property | Value |
|---|---|
| **Location** | `src/components/result/EvaluationPanel.tsx` |
| **Purpose** | The roadmap's `EvaluationPanel`: side-by-side code, test results and score override for **one question** |
| **Props** | `contestId`, `candidateId`, `question: QuestionResultView`, `published: boolean` |

#### `ScoreOverrideForm`

| Property | Value |
|---|---|
| **Location** | `src/components/result/ScoreOverrideForm.tsx` |
| **Props** | `contestId`, `candidateId`, `question: QuestionResultView`, `disabled: boolean`, `disabledReason?: string` |
| **Shows** | "Automatic score: {auto}/{max}". If an override is active: "Adjusted to {final} by {evaluatorName}, {relative time}" and its comment. If `overrideOutdated`: a warning "This adjustment was made on an earlier submission. Review it against the counted one." |
| **Fields** | `adjustedScore`: number, `0 ≤ x ≤ question.maxPoints`, at most 2 decimals, prefilled with the current final score. `comments`: required, 1–2000 characters, placeholder "Why are you adjusting this score? (internal, not shown to the candidate)" |
| **Zod** | `z.object({ adjustedScore: z.number().min(0).max(maxPoints).refine(twoDecimals), comments: z.string().trim().min(1).max(2000) })`, built per question because `max` depends on it. `valueAsNumber` on the input; an empty input is a validation error, not `0` |
| **Buttons** | **Save adjusted score** (primary). **Revert to automatic score** (secondary, only when an override is active); it opens a small inline confirm with its own required comment, then sends `adjustedScore: null` |
| **Submit** | `useManualEvaluation(contestId, candidateId)` with `{ submissionId: question.countedSubmission.id, adjustedScore, comments }` → toast "Score updated" → reset comment |
| **Disabled** | When published (`disabledReason` "Results are published. Unpublish them to change scores." For an evaluator: "…Ask an administrator to unpublish."), when there is no counted submission, or while the mutation is pending |

#### `EvaluationHistoryList`

| Property | Value |
|---|---|
| **Location** | `src/components/result/EvaluationHistoryList.tsx` |
| **Props** | `history: ManualEvaluationResponse[]` (newest first, from the server) |
| **Row** | `{evaluatorName}` set to `{adjustedScore}` (or "reverted to automatic") · relative time with the absolute time in a tooltip · comment. Collapsed to the latest 3 with "Show all ({n})" |
| **Empty** | Not rendered when there is no history |

#### `MyResultCard`

| Property | Value |
|---|---|
| **Location** | `src/components/result/MyResultCard.tsx` |
| **Props** | `contestId: string` |
| **Data** | `useMyResult(contestId)` (only mounted when the contest says published, so it never asks early) |
| **Shows** | Total `total / max` (large, tabular), "Rank {rank} of {rankedCount}", a "Some scores were adjusted by an evaluator" note if `adjusted`, and the **View breakdown** button → `/dashboard/contests/:contestId/result` |
| **Edge** | `published: false` (unpublished between page load and fetch) → fall back to the "Results appear here once…" copy |

#### `MyResultPage`

| Property | Value |
|---|---|
| **Location** | `src/pages/MyResultPage.tsx` |
| **Route** | `/dashboard/contests/:contestId/result` |
| **Access** | `ProtectedRoute roles={['CANDIDATE']}` |
| **Data** | `useMyResult(contestId)`, `useContest(contestId)` (title) |
| **Not published** | Calm card "Results for this contest haven't been published yet." + "Back to contest" (4.3). Never an error |
| **Published** | Score card (as `MyResultCard`, plus published date), then `MyQuestionScoreList` |
| **Absent** | "You didn't take this exam, so there is no score." |

#### `MyQuestionScoreList`

| Property | Value |
|---|---|
| **Location** | `src/components/result/MyQuestionScoreList.tsx` |
| **Row** | `Q{n}` title · `VerdictBadge` of the counted verdict (or "Not attempted") · tests passed `passed/total` · score `final / max` · "Adjusted" `primary` badge if `adjusted` |
| **Expand** | "View my code" (only when `countedSubmissionId`) loads `useSubmissionDetail(countedSubmissionId)` (Module 8 candidate view): read-only code, sample results, hidden summary. Hidden tests stay a `passed/total` summary; that's a Module 8 rule |

### 6.3 Shared Extraction: `EvaluatorTestResults`

| Property | Value |
|---|---|
| **Location** | `src/components/submission/EvaluatorTestResults.tsx` |
| **Exports** | `EvaluatorTestRow` (today's `TestRow`, unchanged) and `EvaluatorTestResults` (`results: EvaluatorTestCaseResult[]` → the `<ul>` of rows) |
| **Used by** | `SubmissionDetailSheet` (Module 8) and `EvaluationPanel` |
| **Rule** | A pure move. The Module 8 sheet must look and behave identically afterwards (`ContestSubmissionsPanel.test.tsx` stays green) |

---

## 7. API Layer

### 7.1 Types (`src/api/resultApi.ts`)

These mirror the backend DTOs in backend plan §10 exactly. Scores arrive as JSON numbers (Jackson serializes `BigDecimal` as a number), and times as ISO 8601 strings.

```typescript
import type { ApiWrapper } from './auth';
import type { ContestStatus } from './contestApi';
import type { SubmissionStatus } from './submissionApi';
import type { SessionStatus } from './sessionApi';

export type ResultStatus = 'SCORED' | 'NEEDS_REVIEW' | 'ABSENT';
export type ReviewReason = 'UNRESOLVED_SYSTEM_ERROR' | 'OVERRIDE_OUTDATED';

export interface ResultReadiness {
  totalCandidates: number;
  inProgress: number;
  judging: number;
  missing: number;
  scored: number;
  needsReview: number;
  absent: number;
  contestCompleted: boolean;
  published: boolean;
  readyToPublish: boolean;
}

export interface QuestionColumn { questionId: string; title: string; orderIndex: number; points: number; }

export interface QuestionScoreCell {
  questionId: string;
  finalScore: number;
  maxPoints: number;
  attempted: boolean;
  adjusted: boolean;
}

export interface LeaderboardEntry {
  resultId: string;
  rank: number | null;              // null = ABSENT
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateRollNumber: string | null;
  status: ResultStatus;
  reviewReasons: ReviewReason[];
  totalScore: number;
  autoScore: number;
  maxScore: number;
  adjusted: boolean;
  timeTakenSeconds: number | null;
  questionScores: QuestionScoreCell[];
}

export interface LeaderboardResponse {
  contestId: string;
  contestTitle: string;
  contestStatus: ContestStatus;
  published: boolean;
  publishedAt: string | null;
  publishedByName: string | null;
  maxScore: number;
  questions: QuestionColumn[];
  readiness: ResultReadiness;
  entries: LeaderboardEntry[];
}

export interface ManualEvaluationResponse {
  id: string;
  submissionId: string;
  questionId: string;
  adjustedScore: number | null;     // null = reverted to the automatic score
  comments: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatedAt: string;
}

export interface CountedSubmissionView {
  id: string;
  language: string;
  status: SubmissionStatus;
  passedCount: number | null;
  totalCount: number | null;
  submittedAt: string;
}

export interface QuestionResultView {
  questionId: string;
  title: string;
  orderIndex: number;
  maxPoints: number;
  autoScore: number;
  finalScore: number;
  countedSubmission: CountedSubmissionView | null;
  submitAttempts: number;
  systemErrorCount: number;
  activeOverride: ManualEvaluationResponse | null;
  overrideOutdated: boolean;
  history: ManualEvaluationResponse[];
}

/** Staff view of one candidate's result. */
export interface ResultResponse {
  resultId: string;
  contestId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateRollNumber: string | null;
  sessionId: string | null;         // null = ABSENT
  sessionStatus: SessionStatus | null;
  startedAt: string | null;
  submittedAt: string | null;
  status: ResultStatus;
  reviewReasons: ReviewReason[];
  totalScore: number;
  autoScore: number;
  maxScore: number;
  rank: number | null;
  rankedCount: number;
  timeTakenSeconds: number | null;
  published: boolean;
  computedAt: string;
  questions: QuestionResultView[];
}

export interface MyQuestionResult {
  questionId: string;
  title: string;
  orderIndex: number;
  maxPoints: number;
  finalScore: number;
  verdict: SubmissionStatus | null; // null = not attempted
  passedCount: number | null;
  totalCount: number | null;
  countedSubmissionId: string | null;
  adjusted: boolean;
}

/** Candidate view. Everything after publishedAt is null (questions: empty) until published. */
export interface MyResultResponse {
  contestId: string;
  contestTitle: string;
  published: boolean;
  publishedAt: string | null;
  status: ResultStatus | null;
  totalScore: number | null;
  maxScore: number | null;
  rank: number | null;
  rankedCount: number | null;
  adjusted: boolean | null;
  questions: MyQuestionResult[];
}

export interface ManualEvaluationPayload {
  adjustedScore: number | null;     // null = revert
  comments: string;
}
```

`SessionStatus` is already exported from `sessionApi.ts`; import it rather than redeclaring it.

### 7.2 API Functions (`src/api/resultApi.ts`)

```typescript
export const resultApi = {
  leaderboard: async (contestId: string): Promise<LeaderboardResponse> => {
    const { data } = await apiClient.get<ApiWrapper<LeaderboardResponse>>(`/contests/${contestId}/results`);
    return data.data;
  },

  candidate: async (contestId: string, candidateId: string): Promise<ResultResponse> => {
    const { data } = await apiClient.get<ApiWrapper<ResultResponse>>(
      `/contests/${contestId}/results/candidates/${candidateId}`,
    );
    return data.data;
  },

  // 200 with published:false before publishing — not an error (Section 4.3)
  mine: async (contestId: string): Promise<MyResultResponse> => {
    const { data } = await apiClient.get<ApiWrapper<MyResultResponse>>(`/contests/${contestId}/results/me`);
    return data.data;
  },

  recompute: async (contestId: string): Promise<LeaderboardResponse> => { /* POST …/results/recompute */ },
  publish:   async (contestId: string, acknowledgeFlagged: boolean): Promise<LeaderboardResponse> => { /* POST …/publish */ },
  unpublish: async (contestId: string, reason: string): Promise<LeaderboardResponse> => { /* POST …/unpublish */ },

  // Wrapped, unlike the rest of /submissions/* (Section 4.1)
  evaluate: async (submissionId: string, payload: ManualEvaluationPayload): Promise<ResultResponse> => {
    const { data } = await apiClient.post<ApiWrapper<ResultResponse>>(`/submissions/${submissionId}/evaluate`, payload);
    return data.data;
  },
};
```

Paths follow the existing convention: no `/api` prefix, because `apiClient`'s base URL supplies it.

---

## 8. Hooks

**File:** `src/hooks/useResults.ts`

```typescript
export const resultKeys = {
  all: ['results'] as const,
  contest: (contestId: string) => ['results', contestId] as const,                        // invalidate this for "everything in a contest"
  leaderboard: (contestId: string) => ['results', contestId, 'leaderboard'] as const,
  candidate: (contestId: string, candidateId: string) => ['results', contestId, 'candidate', candidateId] as const,
  mine: (contestId: string) => ['results', contestId, 'me'] as const,
};
```

| Hook | Behavior |
|---|---|
| `useResults(contestId, enabled = true)` | `useQuery(leaderboard)`. `staleTime: 10_000`. **Polls every 5 s while `!published && (readiness.inProgress > 0 \|\| readiness.judging > 0)`**, so the Admin watches results arrive without reloading (this closes the "admin pages don't auto-refresh" gap for this screen). `placeholderData: (prev) => prev` |
| `useCandidateResult(contestId, candidateId)` | `useQuery(candidate)`, with `retry` off for 404 (`RESULT_NOT_FOUND` is an answer). `staleTime: 10_000` |
| `useMyResult(contestId, enabled)` | `useQuery(mine)`. `staleTime: 60_000`. No polling; it only mounts when the contest is published |
| `useRecomputeResults(contestId)` | Mutation → `setQueryData(leaderboard, data)` + invalidate `resultKeys.contest(contestId)` → toast "Results recomputed" |
| `usePublishResults(contestId)` | Mutation `(acknowledgeFlagged: boolean)` → `setQueryData(leaderboard, data)` + invalidate `resultKeys.contest`, `contestKeys.detail(contestId)` and `contestKeys.all` (contest cards show the badge) |
| `useUnpublishResults(contestId)` | Same invalidations as publish |
| `useManualEvaluation(contestId, candidateId)` | Mutation `({ submissionId, adjustedScore, comments })` → `setQueryData(candidate, data)` (the response is the updated `ResultResponse`) + invalidate `resultKeys.leaderboard(contestId)` (ranks moved) |

Mutation errors are shown by the calling component (inline in dialogs and forms), not by a global toast, matching how Run/Submit errors are shown inline in Module 8.

---

## 9. Routing

Add inside the `/dashboard` `AppShell` route in `App.tsx`, next to the other contest routes:

```tsx
<Route
  path="contests/:contestId/results/:candidateId"
  element={
    <ProtectedRoute roles={['ADMIN', 'EVALUATOR']}>
      <EvaluationPage />
    </ProtectedRoute>
  }
/>
<Route
  path="contests/:contestId/result"
  element={
    <ProtectedRoute roles={['CANDIDATE']}>
      <MyResultPage />
    </ProtectedRoute>
  }
/>
```

A wrong role gets the existing `ProtectedRoute` behavior: the toast "You don't have access to that page." and a redirect to `/dashboard`. No sidebar item is added; results are reached from the contest.

---

## 10. Error Mapping

Add to `FRIENDLY` in `src/lib/apiError.ts`. Codes arrive as `"<CODE>: <message>"`, and `getErrorCode` already extracts them.

| Code | Copy |
|---|---|
| `RESULTS_NEED_REVIEW` | "Some results are flagged for review. Tick the acknowledgement to publish anyway, or resolve them first." |
| `RESULTS_ALREADY_PUBLISHED` | "These results are already published." |
| `RESULTS_NOT_PUBLISHED` | "These results aren't published." |
| `RESULTS_PUBLISHED_LOCKED` | "Results are published, so scores are locked. Unpublish them to make changes." |
| `SUBMISSION_NOT_EVALUABLE` | "This submission can't be scored by hand. Only finished SUBMITs from an ended exam can." |
| `SUBMISSION_NOT_COUNTED` | "This isn't the submission that counts for this question. Refresh and evaluate the counted one." |
| `ADJUSTED_SCORE_OUT_OF_RANGE` | "The score must be between 0 and the question's points, with at most 2 decimals." |
| `RESULT_NOT_FOUND` | "No result yet. This candidate may still be taking the exam or being judged." |

**Deliberately not in `FRIENDLY`:** `RESULTS_NOT_READY`. The server's message carries the counts ("2 candidates still taking the exam, 1 being judged"), which is more useful than any fixed copy, and `getErrorMessage` falls through to it.

| Situation | UI |
|---|---|
| `404` on `/results/me` | Candidate isn't assigned → `ErrorState` "You don't have access to this contest." |
| `404` on candidate detail | `EvaluationPage` not-found state (Section 6.2) |
| `409` on evaluate | Inline under the form; then refetch the candidate result (the counted submission or publish state may have changed) |
| `409` on publish | Inline in the dialog; refetch the leaderboard (readiness changed) |
| Network failure while polling | Keep the last leaderboard on screen (`placeholderData`), with a small "Couldn't refresh" note; never blank the table |

---

## 11. Build Sequence

1. **Types first.** Add `resultsPublished` and `resultsPublishedAt` to `ContestRecord`; create `src/api/resultApi.ts` (types + functions). Unit-test that each function unwraps `data.data`, including `evaluate` (Section 4.1).
2. **`src/hooks/useResults.ts`**: keys, queries and mutations. Test the leaderboard polling rule with a mocked response (polls while judging, stops once published).
3. **Extract `EvaluatorTestResults`** from `SubmissionDetailSheet`. Run the Module 8 tests: green, no visual change.
4. **`formatScore`** in `lib/format.ts`, plus a `formatDuration` (seconds → `1h 02m`) helper, with tests.
5. **`ResultStatusBadge`** and **`LeaderboardTable`** with hard-coded data: ranks shared and skipped (1, 2, 2, 4), absent rows last with `–`, adjusted dots, sorting keeps server ranks.
6. **`ResultsStatusCard`** + readiness checklist: every row's text for every unmet condition; publish disabled unless `readyToPublish`.
7. **`PublishConfirmDialog`** (acknowledgement gating) and **`UnpublishDialog`** (reason validation).
8. **`ResultsPanel`** + the **Results tab** on `ContestDetailPage` (staff only, `ONGOING`/`COMPLETED` only), with URL filters `rq`/`rf`.
9. **`ScoreOverrideForm`** and **`EvaluationHistoryList`**: validation (max points, 2 decimals, required comment, empty ≠ 0), revert flow, disabled-when-published.
10. **`EvaluationPanel`** + **`EvaluationPage`** + route: question switcher in `?q=`, read-only Monaco, empty/absent/not-found states, "All attempts" deep link.
11. **Candidate side:** `MyResultCard` in `ExamEntryCard` (published state only), `MyQuestionScoreList`, `MyResultPage` + route. "Not published" is a calm state.
12. **Module 8 touch-ups:** rejudge disabled while published (`SubmissionDetailSheet`); "Results published"/"Results out" badges on `ContestCard` and the contest header.
13. **Error copy** in `apiError.ts` (Section 10).
14. **End-to-end against the real backend**, using the backend plan's Step 9 scenario (3 candidates, short contest): watch results arrive live, adjust a score, publish with and without flagged results, check each candidate's view, unpublish, check that everything hides again.
15. **`npx tsc -b --noEmit`, `npx vitest run`, `npm run build`**: all green.

---

## 12. Role-Based UI Rules

| UI Element | Admin | Evaluator | Candidate |
|---|---|---|---|
| Results tab on `ContestDetailPage` | ✅ (`ONGOING`/`COMPLETED`) | ✅ (`ONGOING`/`COMPLETED`) | ❌ |
| Leaderboard + readiness | ✅ | ✅ | ❌ |
| Recompute / Publish / Unpublish | ✅ | ❌ (read-only card) | ❌ |
| `EvaluationPage` + score override | ✅ | ✅ | ❌ (route redirects) |
| Rejudge in `SubmissionDetailSheet` | ✅ unless published | ✅ unless published | ❌ |
| `MyResultCard` / `MyResultPage` | ❌ | ❌ | ✅ (own, after publish) |
| "Results published" badges | ✅ | ✅ | ✅ ("Results out") |

---

## 13. Definition of Done

- [ ] Staff see a Results tab on `ONGOING` and `COMPLETED` contests only; candidates never see it
- [ ] The leaderboard shows server ranks (shared and skipped on ties), per-question scores, total, time taken and status; absentees are listed last and unranked
- [ ] Sorting by any column never changes the Rank values; search and filters persist in the URL
- [ ] While candidates are still in progress or being judged, the leaderboard refreshes on its own and stops once everything has settled or results are published
- [ ] The readiness checklist explains exactly why Publish is disabled; Publish enables only when `readyToPublish`
- [ ] Publishing with flagged results requires ticking the acknowledgement; errors show inline in the dialog with the server's counts
- [ ] Unpublish requires a reason and hides candidates' results again
- [ ] `EvaluationPage` shows the counted submission's code (read-only), every test case, the score form and the override history, per question, with the question in the URL
- [ ] Score overrides validate 0…points, at most 2 decimals and a required comment; the total and rank update without a reload; revert restores the automatic score
- [ ] Questions with no counted submission show "scores 0" and no form; judge errors link to the Submissions tab filtered to that candidate and question
- [ ] Score form and rejudge are disabled (with the reason shown) while results are published
- [ ] Before publishing, a candidate sees only "Results appear here once the administrator publishes them", and `/result` shows a calm "not published yet" state
- [ ] After publishing, a candidate sees their total, rank of N, per-question score, verdict, tests passed and an "Adjusted" flag, and can view their own counted code, with no comment, evaluator name or other candidate visible anywhere
- [ ] Contest cards and the contest header show the published state for every role
- [ ] Module 8's `SubmissionDetailSheet` looks and behaves the same after the `EvaluatorTestResults` extraction
- [ ] Wrong-role visits to the new routes toast and redirect to `/dashboard`
- [ ] `npx tsc -b --noEmit` clean, `npx vitest run` green (existing + new tests), `npm run build` passes

---

## 14. Things to Watch Out For

| Pitfall | What to do |
|---|---|
| Treating `/evaluate` like the other `/submissions/*` calls (no unwrap) | It's wrapped. Keep it in `resultApi.ts` and unwrap `data.data` (Section 4.1) |
| Showing an error for "not published yet" | `published: false` is a normal 200. Render the calm state (Section 4.3) |
| Re-numbering ranks on client-side sort | Show `entry.rank` as given. The table sorts rows, not ranks (Section 4.8) |
| Coloring top ranks gold/green | Green, amber and red are status colors only (Section 3.1) |
| Evaluating a non-counted attempt | Always send `countedSubmission.id`; there is no "evaluate this attempt" button anywhere else |
| `valueAsNumber` turning an empty field into `NaN`, or the code coercing it to `0` | Empty is a validation error; never submit `0` by accident |
| Floating-point display (`42.50000001`) | Always render through `formatScore` (max 2 decimals, trims zeros) |
| Leaving the score form enabled after publish | Disable it from `contest.resultsPublished` / `result.published` and say why; don't wait for the 409 |
| Fetching `/results/me` before publish "just to check" | Mount `MyResultCard` only when `contest.resultsPublished`; the contest already says so |
| Polling the leaderboard forever | Poll only while `!published && (inProgress > 0 \|\| judging > 0)` |
| Showing the evaluator's comment to the candidate | The candidate DTO has no comment field; don't add one. Comments are internal (Section 4.4) |
| Breaking Module 8's sheet while extracting `TestRow` | Pure move, then run `ContestSubmissionsPanel.test.tsx` |

---

## 15. Future Enhancements (carried over / new)

- **Module 10 (Analytics):** score distribution and per-question pass-rate charts can sit beside the leaderboard; `LeaderboardResponse.questions` and `questionScores` already carry the data for a simple per-question average row.
- **Module 11 (WebSocket):** replace leaderboard polling with pushes, and notify candidates live when results are published. Keep `resultKeys` so a push only has to invalidate them.
- **Export:** "Download CSV" on the leaderboard (backend `GET …/results/export` is a listed future enhancement).
- **Candidate-facing feedback** separate from internal comments, shown on `MyResultPage`.
- **Keyboard grading flow** on `EvaluationPage`: `J`/`K` to move between questions and `]`/`[` between candidates, for large cohorts.
- **Dashboard tile** for candidates: "Results are out for {contest}" on `DashboardHome`.

---

## 16. File Summary

| File | Action | Notes |
|---|---|---|
| `src/api/resultApi.ts` | **New** | types + 7 calls, all wrapped |
| `src/api/contestApi.ts` | **Modified** | `resultsPublished`, `resultsPublishedAt` on `ContestRecord` |
| `src/hooks/useResults.ts` | **New** | `resultKeys`, 3 queries, 4 mutations |
| `src/lib/format.ts` | **Modified** | `formatScore`, `formatDuration` |
| `src/lib/apiError.ts` | **Modified** | Section 10 codes |
| `src/components/result/ResultsPanel.tsx` | **New** | Results tab content |
| `src/components/result/ResultsStatusCard.tsx` | **New** | publish state, readiness, actions |
| `src/components/result/LeaderboardTable.tsx` | **New** | on shared `DataTable` |
| `src/components/result/ResultStatusBadge.tsx` | **New** | |
| `src/components/result/PublishConfirmDialog.tsx` | **New** | acknowledgement gating |
| `src/components/result/UnpublishDialog.tsx` | **New** | reason form |
| `src/components/result/EvaluationPanel.tsx` | **New** | code + tests + scoring for one question |
| `src/components/result/ScoreOverrideForm.tsx` | **New** | RHF + Zod |
| `src/components/result/EvaluationHistoryList.tsx` | **New** | |
| `src/components/result/MyResultCard.tsx` | **New** | candidate summary in `ExamEntryCard` |
| `src/components/result/MyQuestionScoreList.tsx` | **New** | |
| `src/components/submission/EvaluatorTestResults.tsx` | **New (extracted)** | from `SubmissionDetailSheet`'s `TestRow` |
| `src/components/submission/SubmissionDetailSheet.tsx` | **Modified** | uses the extraction; rejudge disabled while published |
| `src/components/session/ExamEntryCard.tsx` | **Modified** | `MyResultCard` when published |
| `src/components/contest/ContestCard.tsx` | **Modified** | published badge |
| `src/pages/ContestDetailPage.tsx` | **Modified** | Results tab, header badge |
| `src/pages/EvaluationPage.tsx` | **New** | `/dashboard/contests/:contestId/results/:candidateId` |
| `src/pages/MyResultPage.tsx` | **New** | `/dashboard/contests/:contestId/result` |
| `src/App.tsx` | **Modified** | 2 routes |
| Tests (`*.test.ts(x)`) | **New** | `resultApi` unwrap, `useResults` polling, `LeaderboardTable` ranks, `ScoreOverrideForm` validation, `PublishConfirmDialog` gating, `ExamEntryCard` published state, `MyResultPage` unpublished state, new routes' role guard |
