# CodePulse Enterprise — Module 8: Frontend
### Submissions, Run/Submit UI and evaluator review (built together with Module 7)

**Status:** implemented on `feature/ui-remaster-mod7-8`. This document describes what shipped, so the next modules (9: results, 11: live updates) can build on it.

The same branch also moved the whole app to a new design system. It is covered in §6.

---

## 1. Backend contract the UI relies on

| Endpoint | Who | Notes |
|---|---|---|
| `POST /api/submissions/run` | candidate with an active session | Synchronous. Runs **sample** tests only and returns `SubmissionSummary`, with no per-test output. |
| `POST /api/submissions/submit` | candidate | `202` with status `PENDING`. Poll the detail endpoint until it settles. |
| `GET /api/submissions/{id}` | owner, evaluator, admin | The owner gets `SubmissionCandidateView`: sample results plus `hiddenSummary {passed,total}`, with no hidden output. Evaluators and admins get `SubmissionEvaluatorView`, which has every test's input, expected output, weight and the sample flag. Anyone else gets 404. |
| `GET /api/questions/{qid}/submissions/me` | candidate | Paged history. `counted: true` marks the best-scoring SUBMIT. |
| `GET /api/contests/{cid}/submissions` | evaluator, admin | Paged list with optional filters `candidateId`, `questionId`, `type` and `status`. Each row carries `candidateName`, `candidateEmail` and `candidateRollNumber`. Newest first. |
| `POST /api/submissions/{id}/rejudge` | evaluator, admin | Only for a finished SUBMIT. The row returns to `PENDING`. |

- **No wrapper:** `/api/submissions/*` return the DTO itself, with no `ApiResponse`.
- **Errors** arrive as `{ message: "INVALID_STATE: <CODE>" }`, usually with HTTP 422. `src/lib/apiError.ts` turns each code into a message that says what to do. Examples: `SUBMISSION_LIMIT_REACHED`, `SUBMISSION_IN_PROGRESS`, `EXECUTION_BUSY`, `LANGUAGE_NOT_ALLOWED`, and `SESSION_DEADLINE_PASSED`.
- **Limits** per question per session: 100 Runs and 30 Submits. The toolbar warns when 5 or fewer remain.

## 2. Files

```
src/api/submissionApi.ts            types + API calls
src/hooks/useSubmissions.ts         run/submit mutations, polling detail, history, progress, evaluator list, rejudge
src/lib/verdicts.ts                 status → label, short code (AC/WA/TLE/…), tone, hint
src/lib/languages.ts                enum ↔ label ↔ Monaco id, starter templates (Java uses class Main)
src/lib/drafts.ts                   localStorage drafts per contest/question/language
src/lib/apiError.ts                 backend error code → message
src/components/editor/
  CodeEditorPanel.tsx               toolbar, editor, results; replaces EditorSlot
  MonacoEditor.tsx                  lazy chunk, codepulse-dark theme, keyboard shortcuts
  ResultsPanel.tsx                  "Test results" and "Submissions" tabs
  VerdictBadge.tsx                  VerdictBadge, OutputBlock
src/components/submission/
  ContestSubmissionsPanel.tsx       evaluator table with URL-backed filters
  SubmissionDetailSheet.tsx         full evaluator view and rejudge
```

## 3. Candidate flow (AssessmentPage)

- **Layout:** header, then question navigator, then problem, then editor (52% width at `xl` and above). Below `xl`, a **Problem | Code** switch toggles between them. The editor stays mounted, so switching never loses state.
- **Languages:** the dropdown offers only `contest.allowedLanguages`. Each question remembers its last language, and each language keeps its own draft. Switching language never loses code.
- **Drafts:** saved 400 ms after typing stops and restored after a refresh. "Reset to starter code" asks for confirmation first.
- **Run** (Ctrl/⌘+Enter): runs the code, then fetches the detail. Each sample shows its verdict, input, actual output, stderr, time and memory. The first failing sample opens automatically.
- **Submit** (Ctrl/⌘+Shift+Enter):
  - Polls `GET /submissions/{id}` every 1.5 s.
  - Gives up after 90 s and shows "Still judging… Check again". The backend has no recovery job for stuck rows.
  - The result shows verdict, score out of points, tests passed and the hidden-test summary.
  - Submit is disabled while a previous SUBMIT is `PENDING`.
- **History tab:** each row shows verdict code, type, language, score, relative time and a "Best" marker. Expanding a row loads its detail, with a button to load that code into the editor.
- **Navigator:** a green tick means accepted, "Attempted" means a SUBMIT exists but none was accepted, and "Judging" means a SUBMIT is pending. This comes from each question's history, and only SUBMITs count.
- **Run/Submit errors** show inline in the results panel, not as toasts.

## 4. Evaluator and admin flow (ContestDetailPage → Submissions tab)

- **Filters:** question, candidate, type and verdict. They live in the URL (`?tab=submissions&sq=…&sc=…&st=…&ss=…&sp=…`), and so does the open submission (`&submission=<id>`), so a link opens straight to it.
- **Table:** 20 per page, refreshed every 3 s while any row on the page is `PENDING`.
- **Row detail:** clicking a row (or pressing Enter on it) opens a sheet with:
  - verdict, score and tests passed;
  - source code and compiler output;
  - every test case: Sample/Hidden, weight, verdict, time, memory, and input, expected and actual output.
- **Rejudge:** available for finished SUBMITs after a confirmation. The sheet polls until the new verdict arrives.

## 5. Not done / next

- **Module 9:** candidates' results stay hidden after the exam until they are published. `SubmissionMapper.toCandidateView(…, resultsVisible)` already supports this, but the controller always passes `true`.
- **Module 11:** WebSocket push could replace polling. Keep the `submissionKeys` query keys when doing that.
- **Rate limiting:** `RateLimitingFilter` is still a TODO on the backend.

## 6. Design system (applies to all modules from here on)

- **Tokens** live in `src/index.css` as CSS variables, with a dark theme under `[data-theme="dark"]`.
  - Navy text with a cobalt primary (`--primary`).
  - Green, amber and red are **reserved for status**: verdicts, live and expired states.
  - Use semantic utilities such as `bg-surface`, `text-fg-muted`, `border-line`, `bg-primary-soft`, `text-danger-text` and `bg-editor-bg`. Never hard-code hex or use the `gray-*` palette.
- **Primitives** are in `src/components/ui/` (import from `components/ui`):
  - `Button`, `ButtonLink`, `IconButton`
  - `Field`, `Input`, `Select`, `Textarea`
  - `Card`, `PageHeader`, `Badge`
  - `Dialog`, `Sheet` (Radix: focus trap and Escape)
  - `Menu`, `Tooltip`, `Tabs`, `Segmented`
  - `Skeleton`, `Kbd`, `BrandMark`, `ThemeToggle`
- **Motion** follows `.claude/skills/interface-craft`:
  - Hover effects go through `hover-fine:`.
  - Press feedback uses the `press` utility.
  - No `transition-all`.
  - Frequent actions (tab switches, question navigation) are instant.
  - Reduced motion is respected through `MotionConfig`.
- **Theme:** the preference (system, light or dark) is stored in `localStorage` under `cp:theme` and applied before first paint by `index.html`.
- **The editor is always dark:** any subtree with `data-theme="dark"` resolves dark tokens, which is how the editor stays dark inside light mode.
