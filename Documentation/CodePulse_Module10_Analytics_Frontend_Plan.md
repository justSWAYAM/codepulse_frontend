# CodePulse Enterprise — Module 10: Frontend Plan
### Analytics Service — Frontend Layer

**Scope: Frontend only.** In scope: a new **Analytics** tab on `ContestDetailPage` (Admin and Evaluator) containing:
- summary tiles;
- three charts (score distribution, question outcomes, time taken);
- a per-question stats table;
- a per-question drill-down sheet with verdict mix, languages and test-case pass rates.

The Module 10 backend must be working (see `codepulse_backend/Documentation/CodePulse_Module10_Analytics_Backend_Plan.md`). Do not touch it.

**Status:** built on branch `feature/module-10-analytics` (2026-10-03), stacked on `feature/module-9-results`. Plan written against `1bcae64`.

> **As built:**
> - Recharts `3.10.1`. The Analytics tab is lazy-loaded, so the build emits a separate `AnalyticsPanel` chunk (372 kB, 108 kB gzipped). The tab content only mounts while the tab is active.
> - `ScoreDistributionChart` and `TimeAnalysisChart` share one file, `DistributionCharts.tsx`, because they use the same bucket bars. `ProvisionalBanner` is a small component inside `AnalyticsPanel.tsx`.
> - The "Open test cases" link on a suspicious test case is shown to admins only: the question edit page (`…/edit?tab=testcases`) is an admin route.
> - Tests stub `ResizeObserver`. `AnalyticsPanel` is imported statically in tests, because a dynamic import loads Recharts inside the test and runs past the 5 s timeout.

---

## 1. Purpose of This Document

This is the single reference for building Module 10 of the frontend. It contains:
- the one new dependency (Recharts) and how it is kept out of the main bundle;
- how charts follow the design system (tokens, dark mode, status colours, accessibility);
- the component inventory, API layer, hooks, routing, a strict build sequence and the Definition of Done.

No code is written here, only specifications. Code snippets show shapes and names, not finished implementations.

The roadmap's advice applies to the UI too: **three or four solid charts beat ten shallow ones**. This plan has three charts and one table, plus the drill-down sheet.

---

## 2. What This Module Inherits (Do Not Rebuild)

| Need | Already have it from | Reused as |
|---|---|---|
| Data fetching, polling, cache | TanStack Query | `useContestAnalytics`, `useQuestionAnalytics`, `useTestCaseAnalytics` |
| Wrapped API responses | `ApiWrapper<T>` from `src/api/auth.ts` | Every `analyticsApi` call unwraps `data.data` |
| Tabs with URL state | `ContestDetailPage` `?tab=` (Modules 8–9) | New `analytics` tab; drill-down question in `&aq=` |
| Sortable table, clickable rows | `components/DataTable.tsx` (`onRowClick`, `rowLabel`, `meta.className` added in Module 9) | `QuestionStatsTable` |
| Side sheet | `components/ui` `Sheet` | `QuestionAnalyticsSheet` |
| Stat tiles | The `StatCard` pattern in `pages/DashboardHome.tsx` (label, big tabular number, hint) | `AnalyticsSummaryCards` (same look, new component) |
| Difficulty chip | `components/DifficultyBadge.tsx` | Label vs observed difficulty |
| Verdict labels and tones | `src/lib/verdicts.ts` (`VERDICTS`, `verdictOf`) | Verdict mix segments |
| Score and time formatting | `src/lib/format.ts` (`formatScore`, `formatDuration`, from Module 9) | Tiles, tooltips, table |
| Leaderboard filters in the URL | Module 9 `ResultsPanel` (`?tab=results&rf=review\|adjusted\|absent`) | Attention links jump straight to the right list |
| Loading/empty/error states | `components/states/*`, `Skeleton` | Unchanged |
| Error copy | `src/lib/apiError.ts` | One new code (Section 10) |
| Design system | Module 8 frontend plan §6 | Everything here |

---

## 3. New Dependency: Recharts

The roadmap names Recharts for this module ("pairs cleanly with shadcn/ui"). It is the **only** new package.

```
npm install recharts@^3
```

- **Version:** use 3.x, which supports React 19. Check `npm ls react` after installing, so there's no duplicate React.
- **Bundle:** Recharts is large. Load the whole Analytics tab through `React.lazy(() => import('../components/analytics/AnalyticsPanel'))`, the same approach `CodeEditorPanel` uses for Monaco. Candidates and every other tab never download it. After building, check that `npm run build` shows a separate analytics chunk.
- **Allowed imports:** `ResponsiveContainer`, `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid` and `Cell`. Nothing else. All three charts are bar charts. No pie charts: they are harder to read and to make accessible.

---

## 4. Design Direction

No new colours, fonts or motion rules. Module 8 §6 applies in full.

### 4.1 Chart colours come from tokens
Recharts takes colour strings, so pass CSS variables. They switch with the theme automatically:

| Use | Value |
|---|---|
| Main series (score and time bars) | `var(--color-primary)` |
| Gridlines, axis lines | `var(--color-line)` |
| Axis ticks and labels | `var(--color-fg-subtle)`, 11–12 px, `tabular` |
| Tooltip | A custom `ChartTooltip` component styled like the `Tooltip` primitive (`bg-fg text-canvas`). Never Recharts' default white box |

**Status colours keep their meaning:**
- the outcome chart uses green for full marks, amber for partial, red for zero, and neutral (`var(--color-surface-3)`) for not attempted;
- verdict segments use each verdict's tone from `lib/verdicts.ts`.

Nothing else is green, amber or red. Never hard-code hex.

### 4.2 Typography and numbers
Tile values use the `StatCard` look (`font-display`, 28 px, `tabular`). Percentages come from a new `formatPercent(ratio)` helper: `0.425 → "42.5 %"`, at most 1 decimal, and `"—"` for null.

### 4.3 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Provisional banner (only while coverage.provisional)        │
├────────────┬────────────┬────────────┬────────────┬────────┤
│ Candidates │ Mean       │ Median     │ Median time│ Range  │   AnalyticsSummaryCards
├────────────┴────────────┴─────┬──────┴────────────┴────────┤
│ Score distribution (bars)     │ Attention summary           │
├───────────────────────────────┼─────────────────────────────┤
│ Question outcomes (stacked)   │ Time taken (bars)           │
├───────────────────────────────┴─────────────────────────────┤
│ QuestionStatsTable (row → QuestionAnalyticsSheet)           │
└─────────────────────────────────────────────────────────────┘
```
Two columns at `lg` and above; one column below. Charts are 240 px tall.

### 4.4 Accessibility: every chart has a table
An SVG chart says nothing to a screen reader. Each `ChartCard`:
- gives the chart `role="img"` with an `aria-label` summarising it ("Score distribution: most candidates scored 60–70 %");
- includes a visually hidden `<table>` with the same data;
- has a **"Show as table"** toggle that displays that table to everyone (also useful when copying numbers into a report).

Meaning never rests on colour alone: stacked segments have a legend with text labels, and the table carries the same numbers.

### 4.5 Responsiveness and motion
`ResponsiveContainer` with `width="100%"`. Below `md` the stat tiles wrap into two columns, and the question table hides its secondary columns (`meta.className`, Module 9). Recharts' entry animation is turned off (`isAnimationActive={false}`): charts appear instantly, like other data in the app, and nothing animates on poll refreshes.

---

## 5. Decisions Carried Over From the Backend Plan

### 5.1 Scores match the leaderboard
Scores come from Module 9's results, overrides included, so every number here can be cross-checked against the Results tab. Don't recompute any score on the client. The client only formats and arranges what the server sends.

### 5.2 Live contests are provisional
Every response carries `coverage`. While `coverage.provisional` is true, show a banner: "Provisional — {withResult} of {totalCandidates} candidates have a result. {inProgress} still writing, {judging} being judged." Poll while it lasts (Section 8). Once the contest is complete and everything is judged, the banner disappears and polling stops.

### 5.3 Not before the contest starts
The backend returns `409 ANALYTICS_NOT_AVAILABLE` for DRAFT and PUBLISHED contests. The UI never asks: the tab only exists for `ONGOING` and `COMPLETED` contests, the same rule as the Results tab.

### 5.4 Counts, never names
Analytics responses contain no candidate identities. The attention summary shows counts, each linking to the Module 9 leaderboard filter that lists the actual candidates. Don't add a second list of names here.

### 5.5 "Not enough data" is a real state
`observedDifficulty` is missing below 5 attempts. Show "Not enough data", not a guess. A `suspicious` test case is flagged by the server; the client only renders the flag.

### 5.6 Nullable fields may be missing
The backend omits null fields from JSON (`non_null`, as in Module 9). Type them as optional (`median?: number | null`) and read them with `?? null` / `!= null`.

---

## 6. Site Map for Module 10

```
/dashboard/contests/:id?tab=analytics            → ContestDetailPage, NEW Analytics tab (Admin, Evaluator; ONGOING/COMPLETED)
/dashboard/contests/:id?tab=analytics&aq=<qid>   → same, with QuestionAnalyticsSheet open on that question
```

**Why a tab and not the roadmap's separate `AnalyticsDashboardPage`:** it's the same reasoning as Module 9's Results tab. Every staff view of a contest lives on `ContestDetailPage`, and analytics only make sense in the context of one contest. The roadmap's `AnalyticsDashboardPage` is the `AnalyticsPanel` component inside that tab. No new routes, so `App.tsx` doesn't change.

---

## 7. Component Inventory

### 7.1 Extending Existing Screens

**`ContestDetailPage` (Modules 3/4/8/9)**

| Change | Detail |
|---|---|
| New tab `analytics` | Added to `Tab` and to `allowedTabs` for staff under the same `hasResults` condition as Results (`ONGOING` or `COMPLETED`). Icon `BarChart3` (lucide), label "Analytics", placed after "Results" |
| Tab content | `<Suspense fallback={<AnalyticsSkeleton />}><AnalyticsPanel contest={contest} /></Suspense>`, with `AnalyticsPanel` lazy-loaded (Section 3) |

`setActiveTab` already clears other query parameters when switching tabs, so `aq` never leaks into another tab.

### 7.2 New Components (all in `src/components/analytics/`)

#### `AnalyticsPanel`

| Property | Value |
|---|---|
| **Purpose** | The tab: banner, tiles, charts, table, sheet. This is the roadmap's `AnalyticsDashboardPage` |
| **Props** | `contest: ContestDetailRecord` |
| **Data** | `useContestAnalytics(contest.id)` and `useQuestionAnalytics(contest.id)`, in parallel |
| **States** | Loading → `AnalyticsSkeleton` (tile and chart-shaped skeletons). Error → `ErrorState` with Retry. `coverage.withResult === 0` → `EmptyState` "Analytics appear here as candidates finish." (still showing the provisional banner) |
| **Export** | `default` export, for `React.lazy` |

#### `ProvisionalBanner`
Info-toned strip (`bg-info-soft text-info-text`) with the text from 5.2. Rendered only while `coverage.provisional`.

#### `AnalyticsSummaryCards`

| Tile | Value | Hint |
|---|---|---|
| Candidates | `participants` / `totalCandidates` | "{absent} absent · {inProgress} in progress" |
| Mean score | `formatScore(mean)` / `maxScore` | `formatPercent(mean / maxScore)` |
| Median score | `formatScore(median)` | "σ {formatScore(stdDev)}" |
| Median time | `formatDuration(medianTimeSeconds)` | "of {durationMinutes} min" |
| Range | `min` – `max` | "lowest – highest" |

#### `ChartCard`

| Property | Value |
|---|---|
| **Purpose** | The shared frame: title, one-line description, optional legend, the chart, the sr-only table, and the "Show as table" toggle (4.4) |
| **Props** | `title`, `description`, `summary` (the `aria-label` text), `legend?: { label, color }[]`, `table: { columns: string[]; rows: (string \| number)[][] }`, `children` (the chart) |

#### `ChartTooltip`
A custom Recharts `content` renderer in the app's tooltip style. Shows the bucket or question label and the formatted value(s).

#### `ScoreDistributionChart`

| Property | Value |
|---|---|
| **Data** | `overview.scoreDistribution` (always 10 buckets) |
| **Chart** | `BarChart`. X = bucket label ("0–10 %" … "90–100 %"; the tooltip also shows points, `fromRatio × maxScore` to `toRatio × maxScore`). Y = candidates (integer ticks). Bars `var(--color-primary)` |
| **Summary** | "Score distribution: the largest group, {n} candidates, scored {range}." |

#### `QuestionOutcomeChart`

| Property | Value |
|---|---|
| **Purpose** | The roadmap's `QuestionPassRateChart`: per-question pass rate and difficulty at a glance |
| **Data** | `questions[]`: full marks, partial, attempted-but-zero, not attempted (computed as in the backend plan §9.2 note), as shares of `participants` |
| **Chart** | Horizontal stacked `BarChart`, one bar per question (`Q1`, `Q2`…; the tooltip shows the title), normalised to 100 %. Segments: full = `var(--color-success)`, partial = `var(--color-warning)`, zero = `var(--color-danger)`, not attempted = `var(--color-surface-3)` |
| **Legend** | "Full marks · Partial · Zero · Not attempted" (text, with swatches) |
| **Click** | A bar opens `QuestionAnalyticsSheet` for that question (`aq=`) |

#### `TimeAnalysisChart`

| Property | Value |
|---|---|
| **Purpose** | The roadmap's `TimeAnalysisChart` |
| **Data** | `overview.timeDistribution` + `noTimeCount` |
| **Chart** | `BarChart`. X = share of the contest duration ("0–10 %", tooltip "0–4 min" computed from `durationMinutes`). Y = candidates |
| **Footnote** | "{noTimeCount} candidate(s) had no scored submission and aren't shown." (only when > 0) |

#### `AttentionSummaryCard`

| Row | Count | Link |
|---|---|---|
| Need review | `needsReview` (+ reasons in the tooltip, using Module 9's `REVIEW_REASON_TEXT`) | `?tab=results&rf=review` |
| Adjusted by an evaluator | `adjusted` | `?tab=results&rf=adjusted` |
| Time ran out | `autoSubmitted` | none (informational) |
| Absent | `absent` | `?tab=results&rf=absent` |
| Finished with zero | `zeroScores` | none |

Rows with a count of 0 show in `text-fg-subtle` with no link. Module 13 adds a "Proctoring flags" row here.

#### `QuestionStatsTable`

| Property | Value |
|---|---|
| **Built on** | `DataTable` with `onRowClick` → open the sheet, and `rowLabel` "Open analytics for {title}" |
| **Columns** | `Q{n}` + title · `DifficultyCheck` · Avg score `avg / points` · Full marks `%` · Attempted `%` · Attempts per candidate · Median time to Accepted (`formatDuration`, "—" if nobody solved it) · Adjusted (count; hidden below `md`) |
| **Order** | `orderIndex` by default; every numeric column sortable |

#### `DifficultyCheck`

| Case | Renders |
|---|---|
| `observedDifficulty` missing | Label `DifficultyBadge` + "Not enough data" in `text-fg-subtle` |
| Matches | Label `DifficultyBadge` + "as expected" |
| Mismatch | Label `DifficultyBadge` → observed `DifficultyBadge`, with the text "Played as {observed}" and a tooltip: "Average score {avgRatio} — labelled {label}." |

#### `QuestionAnalyticsSheet`

| Property | Value |
|---|---|
| **Built on** | `Sheet` (`max-w-2xl`), open while `?aq=<questionId>` is set; closing removes `aq` |
| **Data** | The question's entry from `useQuestionAnalytics` (already loaded) + `useTestCaseAnalytics(contestId, questionId)` (fetched on open) |
| **Header** | `Q{n} · title`, `DifficultyCheck`, points |
| **Sections** | 1. Numbers: attempted, full marks, avg score, submits, runs, median time to Accepted. 2. `VerdictMixBar`. 3. Languages (`languageLabel` + count, sorted by count). 4. `TestCasePassRateList` |

#### `VerdictMixBar`
A single horizontal stacked bar (plain divs; it doesn't need Recharts) of SUBMIT verdicts, coloured by `verdictOf(status).tone`, with a text legend `VerdictBadge` + count. Sorted with Accepted first, then by count.

#### `TestCasePassRateList`

| Property | Value |
|---|---|
| **Row** | "Test {n}" · Sample/Hidden badge (same as Module 8's test rows) · weight · a pass-rate bar with `formatPercent(passRate)` · `{passed}/{evaluated}` · failure mix as small text ("3 WA · 1 TLE") |
| **Suspicious** | Warning-toned row with an `AlertTriangle`: "Nobody passed this test while most passed others. Check its expected output, then rejudge." The link goes to the question's Test cases tab (`/dashboard/contests/:id/questions/:qid/edit`; editing is locked while the contest is live, but viewing works) |
| **Empty** | "No scored submissions yet." |

---

## 8. API Layer and Hooks

### 8.1 Types (`src/api/analyticsApi.ts`)

These mirror the backend DTOs in backend plan §10. Ratios are `0..1`.

```typescript
import type { ApiWrapper } from './auth';
import type { ContestStatus } from './contestApi';
import type { SubmissionStatus } from './submissionApi';
import type { ReviewReason } from './resultApi';
import type { Difficulty } from '../components/DifficultyBadge';   // existing type, also used by questionApi.ts

export interface AnalyticsCoverage {
  totalCandidates: number;
  withResult: number;
  inProgress: number;
  judging: number;
  absent: number;
  contestCompleted: boolean;
  provisional: boolean;
}

export interface Bucket { index: number; fromRatio: number; toRatio: number; count: number; }

export interface ContestAnalytics {
  contestId: string;
  contestTitle: string;
  contestStatus: ContestStatus;
  durationMinutes: number;
  coverage: AnalyticsCoverage;
  scores: {
    maxScore: number;
    participants: number;
    mean?: number | null;
    median?: number | null;
    min?: number | null;
    max?: number | null;
    stdDev?: number | null;
    medianTimeSeconds?: number | null;
  };
  scoreDistribution: Bucket[];   // always 10
  timeDistribution: Bucket[];    // always 10
  noTimeCount: number;
  sessions: { submitted: number; autoSubmitted: number; inProgress: number; notStarted: number };
  attention: {
    needsReview: number;
    needsReviewByReason: Partial<Record<ReviewReason, number>>;
    adjusted: number;
    autoSubmitted: number;
    absent: number;
    zeroScores: number;
  };
}

export interface QuestionStats {
  questionId: string;
  title: string;
  orderIndex: number;
  points: number;
  difficulty: Difficulty;
  participants: number;
  attempted: number;
  fullMarks: number;
  partial: number;
  zero: number;
  averageScore?: number | null;
  averageRatio?: number | null;
  observedDifficulty?: Difficulty | null;   // missing = not enough data
  difficultyMatches: boolean;
  adjusted: number;
  submitCount: number;
  runCount: number;
  attemptsPerCandidate?: number | null;
  medianSecondsToAccepted?: number | null;
  solvers: number;
  verdicts: { status: SubmissionStatus; count: number }[];
  languages: { language: string; count: number }[];
}

export interface QuestionAnalytics { coverage: AnalyticsCoverage; questions: QuestionStats[]; }

export interface TestCaseStats {
  testCaseId: string;
  orderIndex: number;
  sample: boolean;
  weight: number;
  evaluated: number;
  passed: number;
  passRate: number;
  wrongAnswer: number;
  timeLimit: number;
  memoryLimit: number;
  runtimeError: number;
  compilationError: number;
  suspicious: boolean;
}

export interface TestCaseAnalytics {
  questionId: string;
  questionTitle: string;
  candidatesEvaluated: number;
  testCases: TestCaseStats[];
}

export const analyticsApi = {
  overview: async (contestId: string): Promise<ContestAnalytics> => {
    const { data } = await apiClient.get<ApiWrapper<ContestAnalytics>>(`/contests/${contestId}/analytics/overview`);
    return data.data;
  },
  questions: async (contestId: string): Promise<QuestionAnalytics> => { /* GET …/analytics/questions */ },
  testCases: async (contestId: string, questionId: string): Promise<TestCaseAnalytics> => {
    /* GET …/analytics/questions/{questionId}/test-cases */
  },
};
```

`Difficulty` is imported from `components/DifficultyBadge.tsx`, where `questionApi.ts` also gets it. Don't redeclare it.

### 8.2 Hooks (`src/hooks/useAnalytics.ts`)

```typescript
export const analyticsKeys = {
  contest: (contestId: string) => ['analytics', contestId] as const,
  overview: (contestId: string) => ['analytics', contestId, 'overview'] as const,
  questions: (contestId: string) => ['analytics', contestId, 'questions'] as const,
  testCases: (contestId: string, questionId: string) => ['analytics', contestId, 'testCases', questionId] as const,
};

export const ANALYTICS_POLL_MS = 15_000;
/** Poll only while the numbers can still change. */
export const analyticsPollInterval = (coverage?: AnalyticsCoverage) =>
  coverage?.provisional ? ANALYTICS_POLL_MS : false;
```

| Hook | Behaviour |
|---|---|
| `useContestAnalytics(contestId, enabled = true)` | The roadmap's hook. `staleTime: 30_000`, `placeholderData: (prev) => prev`, `refetchInterval: (q) => analyticsPollInterval(q.state.data?.coverage)` |
| `useQuestionAnalytics(contestId, enabled = true)` | Same options |
| `useTestCaseAnalytics(contestId, questionId \| null)` | `enabled: !!questionId`, `staleTime: 30_000`, no polling (the sheet is opened deliberately) |

**Cross-module invalidation:** a Module 9 override or rejudge changes analytics. Add `qc.invalidateQueries({ queryKey: analyticsKeys.contest(contestId) })` to the `onSuccess` of `useManualEvaluation`, `useRecomputeResults` and `useRejudge`. Then switching from the grading page back to Analytics shows fresh numbers without waiting for `staleTime`.

### 8.3 Pure helpers (`src/lib/analytics.ts`)
Keep component files exporting only components (the fast-refresh rule established in Module 9):
- `formatPercent(ratio)`
- `bucketLabel(bucket)`: "40–50 %"
- `bucketPointsLabel(bucket, maxScore)`: "40–50 pts"
- `bucketMinutesLabel(bucket, durationMinutes)`
- `outcomeShares(question)`: `{ full, partial, zero, notAttempted }`, as shares summing to 1
- `largestBucket(buckets)`: for the chart summary
- `verdictSegments(verdicts)`
- `failureMixText(testCase)`: "3 WA · 1 TLE"

---

## 9. Routing

No new routes. The tab lives on the existing `contests/:id` route (Section 6).

---

## 10. Error Mapping

Add to `FRIENDLY` in `src/lib/apiError.ts`:

| Code | Copy |
|---|---|
| `ANALYTICS_NOT_AVAILABLE` | "Analytics are available once the contest starts." |

| Situation | UI |
|---|---|
| `403` | Shouldn't happen (staff-only tab). Show `ErrorState` "You don't have access to analytics." |
| `404` on test cases | The question was removed or doesn't belong to the contest. Close the sheet and show a toast "That question isn't in this contest." |
| Network failure while polling | Keep the last data (`placeholderData`) and show a small "Couldn't refresh" note, the same as Module 9's leaderboard |

---

## 11. Build Sequence

1. **Install Recharts** (`recharts@^3`). Check `npm ls react` shows a single React.
2. **`src/api/analyticsApi.ts`:** types and three calls. Unit-test the unwrapping.
3. **`src/lib/analytics.ts`:** helpers with tests (bucket labels at 0 and 100 %, `outcomeShares` sums to 1, and `zero` minus not-attempted never goes negative).
4. **`src/hooks/useAnalytics.ts`:** keys, three queries, and the polling rule with a unit test. Add the Module 9 invalidations (8.2).
5. **`ChartCard`, `ChartTooltip`, `ProvisionalBanner`, `AnalyticsSummaryCards`** with hard-coded data.
6. **`ScoreDistributionChart`, `TimeAnalysisChart`, `QuestionOutcomeChart`:** check the token colours in light **and** dark theme, "Show as table", and the hidden table.
7. **`AttentionSummaryCard`** with its leaderboard links.
8. **`DifficultyCheck` + `QuestionStatsTable`.**
9. **`VerdictMixBar`, `TestCasePassRateList`, `QuestionAnalyticsSheet`** (opened by `aq`).
10. **`AnalyticsPanel`** (default export) + **the Analytics tab** in `ContestDetailPage` via `React.lazy`.
11. **End-to-end against the real backend** using the Module 9 browser-test contest:
    - every tile and bar matches the leaderboard;
    - adjusting a score on the grading page updates Analytics after switching back;
    - a deliberately broken hidden test case (expected output changed before the contest) shows as **suspicious**.
12. **`npx tsc -b --noEmit`, `npx vitest run`, `npm run build`:** all green, and the build output shows a separate analytics chunk.

---

## 12. Role-Based UI Rules

| UI Element | Admin | Evaluator | Candidate |
|---|---|---|---|
| Analytics tab (`ONGOING`/`COMPLETED`) | ✅ | ✅ | ❌ |
| Attention links to the Results tab | ✅ | ✅ | ❌ |
| Test-case drill-down | ✅ | ✅ | ❌ |
| Analytics JS chunk downloaded | When the tab opens | When the tab opens | Never |

---

## 13. Definition of Done

- [ ] Staff see an Analytics tab on `ONGOING` and `COMPLETED` contests only; candidates never see it or download its code
- [ ] Summary tiles, score distribution, question outcomes and time taken match the backend numbers and the Module 9 leaderboard for the browser-test contest
- [ ] Charts use theme tokens and read correctly in light and dark mode; green, amber and red appear only as status colours
- [ ] Every chart has an `aria-label` summary, a hidden data table and a working "Show as table" toggle
- [ ] While a contest is live or still judging, a provisional banner shows the coverage numbers and the data refreshes every 15 s; both stop once final
- [ ] The question table shows the difficulty check ("as expected", "Played as …" or "Not enough data") and opens the drill-down sheet on click or Enter, with the question in the URL (`aq`)
- [ ] The drill-down shows verdict mix, languages and per-test-case pass rates, and suspicious test cases are clearly flagged with what to do
- [ ] Attention counts link to the matching Results-tab filter; no candidate names appear in Analytics
- [ ] An override, rejudge or recompute in Module 9 is reflected in Analytics without a hard reload
- [ ] `npx tsc -b --noEmit` clean, `npx vitest run` green, `npm run build` passes with Recharts in its own lazy chunk

---

## 14. Things to Watch Out For

| Pitfall | What to do |
|---|---|
| Recharts in the main bundle | Lazy-load `AnalyticsPanel`; check the build output |
| Hard-coded hex or Recharts' default colours | Pass `var(--color-…)` everywhere; check dark mode |
| Recomputing scores on the client | Don't. Format what the server sends (5.1) |
| Charts animating on every poll | `isAnimationActive={false}` |
| `ResponsiveContainer` rendering 0×0 in tests (jsdom has no layout) | Test helpers and table output; mock `ResponsiveContainer` to fixed dimensions in component tests, and stub `ResizeObserver` |
| Missing fields read as `undefined` | Optional types and `?? null` (5.6) |
| Treating "not enough data" as matching or mismatching | Render it as its own state (5.5) |
| Showing candidate names in attention rows | Counts only; link to the leaderboard (5.4) |
| Stale analytics after grading | Invalidate `analyticsKeys.contest` in the Module 9 mutations (8.2) |
| Pie or donut charts | Bars only (Section 3) |

---

## 15. Future Enhancements (carried over / new)

- **Module 11 (WebSocket):** replace the 15 s poll with a push when results change.
- **Module 13 (analytics pass 2):** a "Proctoring flags" row in `AttentionSummaryCard`, and a proctoring breakdown in the drill-down.
- **Export:**
  - "Download CSV" for the question table;
  - "Download PNG" for each chart (Recharts SVG to canvas);
  - a printable analytics report.
- **Candidate trend view** across contests (backend future enhancement).
- **Per-branch / division / batch comparison** using Module 2's academic fields.
- **Compare two contests** side by side, e.g. this year's Mock Test 1 vs last year's.

---

## 16. File Summary

| File | Action | Notes |
|---|---|---|
| `package.json` | **Modified** | + `recharts@^3` |
| `src/api/analyticsApi.ts` | **New** | types + 3 calls, all wrapped |
| `src/hooks/useAnalytics.ts` | **New** | `analyticsKeys`, 3 queries, polling rule |
| `src/hooks/useResults.ts`, `src/hooks/useSubmissions.ts` | **Modified** | invalidate `analyticsKeys.contest` after override, recompute, rejudge |
| `src/lib/analytics.ts` | **New** | formatting and chart-data helpers |
| `src/lib/apiError.ts` | **Modified** | `ANALYTICS_NOT_AVAILABLE` |
| `src/components/analytics/AnalyticsPanel.tsx` | **New** | default export, lazy-loaded |
| `src/components/analytics/ProvisionalBanner.tsx` | **New** | |
| `src/components/analytics/AnalyticsSummaryCards.tsx` | **New** | |
| `src/components/analytics/ChartCard.tsx` | **New** | frame + accessible table + "Show as table" |
| `src/components/analytics/ChartTooltip.tsx` | **New** | |
| `src/components/analytics/ScoreDistributionChart.tsx` | **New** | |
| `src/components/analytics/QuestionOutcomeChart.tsx` | **New** | the roadmap's `QuestionPassRateChart` |
| `src/components/analytics/TimeAnalysisChart.tsx` | **New** | |
| `src/components/analytics/AttentionSummaryCard.tsx` | **New** | links to Results-tab filters |
| `src/components/analytics/QuestionStatsTable.tsx` | **New** | on `DataTable` |
| `src/components/analytics/DifficultyCheck.tsx` | **New** | |
| `src/components/analytics/QuestionAnalyticsSheet.tsx` | **New** | `?aq=` |
| `src/components/analytics/VerdictMixBar.tsx` | **New** | plain divs |
| `src/components/analytics/TestCasePassRateList.tsx` | **New** | suspicious flags |
| `src/pages/ContestDetailPage.tsx` | **Modified** | Analytics tab (lazy) |
| Tests (`*.test.ts(x)`) | **New** | `analyticsApi` unwrap, `lib/analytics` helpers, polling rule, `ChartCard` table toggle, `DifficultyCheck` states, `TestCasePassRateList` suspicious row, tab visibility by role and status |
