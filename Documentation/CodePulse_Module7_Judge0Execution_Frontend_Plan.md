# CodePulse Enterprise — Module 7: Frontend Plan
### Judge0 Code Execution Service — Frontend Layer

**Scope:** Frontend only. This module builds the **code editor panel**, the **"Run" execution UI**, and the **submission status tracking** components that plug into the `EditorSlot` placeholder from Module 6. The backend (Module 7) must be working — do not touch it.

**Important:** Module 7 does not yet have a `POST /submissions/*` endpoint — those belong to Module 8. The editor and Run UI built here fire against Module 8's API. Module 7's frontend work is therefore: install Monaco, build the code editor component, and wire the Run flow UI so it is ready the moment Module 8's endpoints exist.

> **Implementation status (Oct 2026): built together with Module 8.** The plan below is kept for history. Where it disagrees with the backend that shipped, the code wins:
>
> - **No stdin.** `POST /api/submissions/run` has no stdin field; it runs the question's sample tests. Its body is `{ questionId, language, sourceCode }`, and it returns a summary with no per-test output. The UI then calls `GET /api/submissions/{id}` to show each sample's result.
> - **No `ApiResponse` wrapper.** `/api/submissions/*` return the DTO directly. Import `apiClient` from `src/lib/apiClient`, not `./apiClient`.
> - **No `RUNNING` status.** `PENDING` covers both queued and executing.
> - **Status names.** Time and memory verdicts are `TIME_LIMIT_EXCEEDED` and `MEMORY_LIMIT_EXCEEDED`.
> - **Allowed languages** come from `contest.allowedLanguages`, not from the question.
> - **Theme.** The app is light or dark, chosen by the user. The editor area is always dark, using the custom `codepulse-dark` Monaco theme.
> - **Editor placement.** The editor replaced `EditorSlot` (now deleted). Below `xl` it sits behind a Problem | Code switch rather than being hidden.
>
> See `CodePulse_Module8_Submission_Frontend_Plan.md` for what was actually built.

---

## 1. Purpose of This Document

This is the single reference for building the Module 7 frontend. It covers:
- What the `EditorSlot` placeholder from Module 6 is replaced with
- Monaco Editor installation and configuration
- The `CodeEditorPanel` component design and API
- The "Run" execution flow: request, polling state, output display
- Language selector behavior tied to `contest.allowedLanguages`
- The API layer (`submissionApi.ts`) skeleton that Module 8 will complete
- A strict build sequence

No code is written here — only specifications. Every decision below traces back to a constraint from either the backend plan or the Module 6 design.

---

## 2. What This Module Inherits (Do Not Rebuild)

| From | Component | How it's used here |
|---|---|---|
| Module 6 | `AssessmentPage` layout | `EditorSlot` is the right-region placeholder this module fills |
| Module 6 | `useAssessmentSession` | Editor is only mounted when `session.status === 'IN_PROGRESS'` |
| Module 6 | `useSessionTimer` | Timer continues independently; editor mounting does not reset it |
| Module 6 | `QuestionPanel` | Question description and sample test cases in the center panel |
| Module 6 | `SessionEndedScreen` | Shown when session ends; editor is unmounted |
| Module 4/5 | `QuestionCandidateRecord` | Typed question shape including `allowedLanguages` (from contest) |
| All modules | TanStack Query (`useQuery`, `useMutation`) | Run code, poll status — same pattern as all prior hooks |
| Module 0 | `sonner` toast | Error toasts on Run failure |
| Module 0 | `framer-motion` | Panel transitions only — no animation inside the editor |

**New dependency required:** Monaco Editor. See Section 4.

---

## 3. Design Direction

Module 7's UI is the most technically dense part of the app — the code editor, output panel, and status indicators coexist in a small space. The design priority is **focus, not decoration**.

### 3.1 Color palette (no new colors)
The editor uses Monaco's `vs-dark` theme, which uses `#1e1e1e` as its background. This must harmonize with the existing dark surface colors (`--surface`, `--background`). Match Monaco's background to the design system's `--surface` color so there is no visible border between the editor chrome and the panel background.

| State | Indicator color |
|---|---|
| Idle / not yet run | No indicator |
| Running / pending | `accent-compile` (green) spinner |
| ACCEPTED / all passed | `accent-compile` (green) badge |
| WRONG_ANSWER | `accent-error` (red) badge |
| TIME_LIMIT_EXCEEDED | `accent-syntax` (amber) badge |
| MEMORY_LIMIT_EXCEEDED | `accent-syntax` (amber) badge |
| RUNTIME_ERROR | `accent-error` (red) badge |
| COMPILATION_ERROR | `accent-error` (red) badge |
| SYSTEM_ERROR | Neutral gray badge |

### 3.2 Typography
- Editor font: **JetBrains Mono** — already used for `CountdownTimer` in Module 6. Consistent monospace family throughout the exam interface.
- Output panel: **JetBrains Mono**, `text-sm`. Never a proportional font for program output.
- Line numbers, Monaco chrome: Monaco's defaults are acceptable; do not override.

### 3.3 Layout of the right panel (`EditorSlot` replacement)

```
┌────────────────────────────────────────────────┐
│ Language selector   [Run ▶]   [status badge]   │  ← Toolbar: ~40px
├────────────────────────────────────────────────┤
│                                                │
│   Monaco Editor                                │  ← Fills remaining height
│   (js/py/java/cpp/c — matches contest langs)   │
│                                                │
├────────────────────────────────────────────────┤
│ Output Panel (collapsible)                     │  ← ~200px, expandable
│  STDIN  │  STDOUT  │  STDERR / compile error   │
└────────────────────────────────────────────────┘
```

The output panel starts collapsed (0 height) and expands on first Run. It has tab navigation for STDIN / STDOUT / STDERR. STDIN is editable (candidate can test custom input for sample runs). STDOUT and STDERR are read-only.

### 3.4 Accessibility
- The "Run" button must have `id="run-code-button"` for browser testing.
- Language selector must have `id="language-selector"` and an associated `<label>`.
- Monaco renders its own accessible editor; do not wrap it in additional ARIA roles.
- The output panel's tab navigation must be keyboard-navigable.

### 3.5 Responsiveness
The three-column layout from Module 6 is intentionally not mobile-optimized. On narrow viewports (< 1024px), the editor panel and output panel stack below the question panel. This is a graceful degradation, not a supported use case.

---

## 4. New Dependency: Monaco Editor

**Package:** `@monaco-editor/react`

This is the officially maintained React wrapper around Monaco. It provides:
- A `<Editor />` component with language, theme, value, and onChange props.
- Lazy-loading of Monaco's web workers (critical for performance — without this, Monaco blocks the main thread on load).
- TypeScript type definitions included.

```bash
npm install @monaco-editor/react
```

**Size impact:** Monaco is a large dependency (~2–4 MB in the bundle). Mitigate with:
- Dynamic import: `const Editor = React.lazy(() => import('@monaco-editor/react'))` — Monaco only loads when `AssessmentPage` is rendered (candidate exam only).
- The existing `vite build` warning about chunks > 500KB will appear. This is expected for Monaco and is noted in the build output from Module 6's clean build. Do not add `build.chunkSizeWarningLimit` suppression — the warning is useful for other chunks.

**Do not install** `monaco-editor` (the core package) separately — `@monaco-editor/react` handles this.

---

## 5. Site Map for Module 7

No new pages are added. All work is within `AssessmentPage`.

```
/dashboard/contests/:contestId/assessment   (existing — Module 6)
  └── AssessmentPage
        ├── Header (unchanged)
        ├── QuestionNavigator (unchanged)
        ├── QuestionPanel (unchanged)
        └── EditorSlot         ← REPLACED by CodeEditorPanel (this module)
              ├── EditorToolbar
              │     ├── LanguageSelector
              │     ├── RunButton
              │     └── RunStatusBadge
              ├── MonacoEditor  (dynamic import)
              └── OutputPanel
                    ├── StdinTab (editable)
                    ├── StdoutTab (read-only)
                    └── StderrTab (read-only)
```

---

## 6. API Layer

### 6.1 `submissionApi.ts` — skeleton (completed in Module 8)

**File:** `src/api/submissionApi.ts`

This file is created here as a skeleton — the actual endpoint implementations are added in Module 8 when `POST /api/submissions/run` and `POST /api/submissions/submit` exist. Creating the file now ensures the types are importable by `CodeEditorPanel` without a compilation error.

```typescript
import apiClient from './apiClient';

// ── Types ────────────────────────────────────────────────────────────────────

export type SubmissionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILATION_ERROR'
  | 'SYSTEM_ERROR';

export type TestCaseResultStatus =
  | 'PASSED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILATION_ERROR'
  | 'SYSTEM_ERROR';

export interface RunCodeRequest {
  questionId: string;
  contestId: string;
  sourceCode: string;
  languageName: string;
  stdin?: string;        // optional custom input
}

export interface RunCodeResult {
  status: TestCaseResultStatus;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  executionTimeMs: number | null;
  memoryUsedKb: number | null;
  // sample test case results array (Module 8 defines the exact shape)
  testCaseResults?: SampleTestCaseResult[];
}

export interface SampleTestCaseResult {
  testCaseId: string;
  status: TestCaseResultStatus;
  stdout: string | null;
  executionTimeMs: number | null;
}

export interface SubmitCodeRequest {
  questionId: string;
  contestId: string;
  sourceCode: string;
  languageName: string;
}

export interface SubmitCodeResponse {
  submissionId: string;
  status: SubmissionStatus;  // PENDING initially
  message: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Run code against sample test cases only.
 * Synchronous — blocks until Judge0 completes (Module 8 implements).
 * Stub: throws NotImplementedError until Module 8 is wired.
 */
export async function runCode(request: RunCodeRequest): Promise<RunCodeResult> {
  // TODO Module 8: POST /api/submissions/run
  throw new Error('runCode not yet implemented — available in Module 8');
}

/**
 * Submit code for final scoring against all test cases.
 * Returns immediately with PENDING status (Module 8 implements async queue).
 * Stub: throws NotImplementedError until Module 8 is wired.
 */
export async function submitCode(request: SubmitCodeRequest): Promise<SubmitCodeResponse> {
  // TODO Module 8: POST /api/submissions/submit
  throw new Error('submitCode not yet implemented — available in Module 8');
}
```

### 6.2 `useRunCode` hook skeleton

**File:** `src/hooks/useRunCode.ts`

```typescript
import { useState, useCallback } from 'react';
import type { RunCodeRequest, RunCodeResult } from '../api/submissionApi';
import { runCode } from '../api/submissionApi';

interface UseRunCodeReturn {
  run: (request: RunCodeRequest) => Promise<void>;
  result: RunCodeResult | null;
  isRunning: boolean;
  error: string | null;
  clear: () => void;
}

/**
 * Manages the Run Code flow for the CodeEditorPanel.
 * Module 8 wires the actual API call; this hook handles UI state.
 *
 * NOT a TanStack Query mutation — Run is imperative, not declarative.
 * The candidate explicitly clicks "Run"; there is no retry, no cache.
 */
export function useRunCode(): UseRunCodeReturn {
  const [result, setResult] = useState<RunCodeResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (request: RunCodeRequest) => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const outcome = await runCode(request);
      setResult(outcome);
    } catch (err: unknown) {
      // Module 8 stub throws — show a friendly message during development.
      const message = (err as Error)?.message ?? 'Failed to run code';
      if (message.includes('not yet implemented')) {
        setError('Run is not yet available (Module 8 pending)');
      } else {
        setError(message);
      }
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { run, result, isRunning, error, clear };
}
```

---

## 7. Component Specifications

### 7.1 `LanguageSelector`

**File:** `src/components/editor/LanguageSelector.tsx`

**Props:**
```typescript
interface LanguageSelectorProps {
  allowedLanguages: string[];     // from contest.allowedLanguages
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  disabled?: boolean;             // true when session is not IN_PROGRESS
}
```

**Behaviour:**
- Renders a styled `<select>` element (not a custom dropdown — native is more accessible and faster to build).
- `allowedLanguages` comes directly from `contest.allowedLanguages` (the list set in Module 3).
- The backend's `SupportedLanguage` enum defines which names are valid. Frontend must send exactly the same string (case-sensitive). Display name mapping is owned by this component — a `DISPLAY_NAMES` map from language string to human-readable label (e.g., `"CPP"` → `"C++17"`, `"PYTHON"` → `"Python 3"`).
- Default selection: first language in `allowedLanguages` on initial render. Persist the candidate's selection in component state — do **not** use `localStorage` or session storage (no persistence needed across page refresh in Module 7; Module 8's draft auto-save is a future enhancement).
- When `disabled`, the select is visually dimmed and non-interactive.
- `id="language-selector"` on the `<select>` element.

**Language display name map** (centralize here, not in the editor component):
```typescript
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  JAVA: 'Java',
  PYTHON: 'Python 3',
  CPP: 'C++17',
  C: 'C (GCC)',
  JAVASCRIPT: 'JavaScript',
};
```

**Monaco language ID map** (used by `CodeEditorPanel` to set Monaco's syntax highlight):
```typescript
const MONACO_LANGUAGE_MAP: Record<string, string> = {
  JAVA: 'java',
  PYTHON: 'python',
  CPP: 'cpp',
  C: 'c',
  JAVASCRIPT: 'javascript',
};
```

---

### 7.2 `CodeEditorPanel`

**File:** `src/components/editor/CodeEditorPanel.tsx`

**Purpose:** Replaces `EditorSlot` in `AssessmentPage`. Contains the Monaco editor, toolbar, and output panel as an integrated unit.

**Props:**
```typescript
interface CodeEditorPanelProps {
  contestId: string;
  questionId: string;               // active question from QuestionNavigator
  allowedLanguages: string[];       // from contest
  sessionActive: boolean;           // false → read-only mode
  onCodeChange?: (code: string) => void;  // for future draft save (Module 8)
}
```

**Internal state:**
```typescript
const [code, setCode] = useState<string>(DEFAULT_CODE_TEMPLATES[selectedLanguage] ?? '');
const [selectedLanguage, setSelectedLanguage] = useState<string>(allowedLanguages[0] ?? 'PYTHON');
const [stdin, setStdin] = useState<string>('');
const [outputTab, setOutputTab] = useState<'stdout' | 'stderr' | 'stdin'>('stdout');
const [outputOpen, setOutputOpen] = useState<boolean>(false);
```

**Monaco `<Editor />` configuration:**
```typescript
<Editor
  height="100%"
  language={MONACO_LANGUAGE_MAP[selectedLanguage]}
  theme="vs-dark"
  value={code}
  onChange={(value) => setCode(value ?? '')}
  options={{
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 14,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,       // IMPORTANT: reflows on panel resize
    readOnly: !sessionActive,
    wordWrap: 'off',
    tabSize: 4,
    renderWhitespace: 'selection',
  }}
  loading={<EditorLoadingState />}
/>
```

**Key decisions:**
- `automaticLayout: true` is required — the three-column layout resizes Monaco dynamically. Without it, the editor does not respond to panel width changes.
- `minimap.enabled: false` — the minimap wastes horizontal space in a 1/3-width panel.
- `scrollBeyondLastLine: false` — prevents empty whitespace at the bottom for short programs.
- `readOnly: !sessionActive` — if the session has ended, the editor is still shown (candidate can see their code) but is non-editable.

**Code templates:** Each language gets a starter template so the editor is never blank on load. Store in a `DEFAULT_CODE_TEMPLATES` map:
```typescript
const DEFAULT_CODE_TEMPLATES: Record<string, string> = {
  PYTHON: 'import sys\n\ndef solve():\n    pass\n\nsolve()\n',
  JAVA: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}\n',
  CPP: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    return 0;\n}\n',
  C: '#include <stdio.h>\n\nint main() {\n    return 0;\n}\n',
  JAVASCRIPT: 'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on("line", l => lines.push(l));\nrl.on("close", () => {\n    // solve here\n});\n',
};
```

**Language change behaviour:** When the candidate changes language, the editor resets to that language's template **only if the current code exactly matches the previous language's template**. If the candidate has typed anything custom, show a confirmation: "Change language? Your current code will be replaced with a starter template." Use a `window.confirm()` for simplicity — no dialog component needed here.

**Question change behaviour:** When `questionId` changes (candidate navigates to a different question), the code editor resets to the new question's starting code. Store per-question code in a `Map<questionId, { code, language }>` ref so navigating back restores the candidate's work. This is in-memory only (not persisted).

---

### 7.3 `RunButton`

**File:** Inline in `EditorToolbar` (no separate file needed).

**States:**
- Idle: green "Run" button with ▶ icon, `id="run-code-button"`
- Running: spinner, disabled, label "Running…"
- Disabled (session not active): grayed out, not clickable

**onClick flow:**
```
candidate clicks Run
  → clear previous output
  → setOutputOpen(true)
  → setOutputTab('stdout')
  → call useRunCode().run({ contestId, questionId, sourceCode: code, languageName: selectedLanguage, stdin })
  → result updates → output panel populates
```

---

### 7.4 `RunStatusBadge`

**File:** Inline in `EditorToolbar`.

Renders only after at least one run. Shows the aggregate status using the color table from Section 3.1. Disappears when the editor is cleared or a new run starts.

```typescript
// Status to display label map
const RUN_STATUS_LABELS: Record<TestCaseResultStatus, string> = {
  PASSED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT_EXCEEDED: 'Time Limit',
  MEMORY_LIMIT_EXCEEDED: 'Memory Limit',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILATION_ERROR: 'Compile Error',
  SYSTEM_ERROR: 'System Error',
};
```

---

### 7.5 `OutputPanel`

**File:** `src/components/editor/OutputPanel.tsx`

**Props:**
```typescript
interface OutputPanelProps {
  result: RunCodeResult | null;
  error: string | null;
  isRunning: boolean;
  stdin: string;
  onStdinChange: (val: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}
```

**Layout:** Collapsible panel at the bottom of the right column. Collapsed → 40px header bar ("Output ▼"). Expanded → 200px (resizable via CSS `resize: vertical` on the inner container).

**Tabs:**

| Tab | Content | Editable? |
|---|---|---|
| STDIN | `<textarea>` with candidate's custom input | Yes |
| STDOUT | Program's actual output | No |
| STDERR / Error | Runtime error or compile error | No |

**STDOUT display rules:**
- If `result.stdout` is null or empty and status is `PASSED` → show `"(no output)"` in muted text.
- If `result.stdout` ends with `"\n... [truncated]"` → show a notice below the output.
- Render in `<pre>` with `font-family: JetBrains Mono` to preserve whitespace.

**STDERR display rules:**
- If status is `COMPILATION_ERROR` → show `result.compileOutput` (not `stderr`) in the STDERR tab, with the tab label changed to "Compile Error".
- Otherwise show `result.stderr`.
- Render in `<pre>` with `color: accent-error`.

**Running state:** While `isRunning === true`, show a spinner in the STDOUT tab body and disable the STDIN textarea (input during execution is meaningless).

**Empty state:** Before any run, show a muted message: `"Click Run to see output here"` in the STDOUT tab body.

---

### 7.6 `EditorLoadingState`

**File:** Inline in `CodeEditorPanel`.

Monaco loads asynchronously. While loading, show:
```
┌──────────────────────────────────┐
│  [spinner]  Loading editor…      │
│  (same height as the editor)     │
└──────────────────────────────────┘
```
Use `motion.div` from Framer Motion for a fade-in when Monaco finishes loading (replace the loader with the editor via `AnimatePresence`).

---

## 8. `AssessmentPage` Changes

`AssessmentPage.tsx` from Module 6 renders `<EditorSlot />` in the right panel. Replace it with `<CodeEditorPanel />`:

```typescript
// Before (Module 6):
import { EditorSlot } from '../components/session/EditorSlot';

// After (Module 7):
import { CodeEditorPanel } from '../components/editor/CodeEditorPanel';
```

Pass the active question ID and session state:
```typescript
{sessionIsActive && selectedQuestion && (
  <CodeEditorPanel
    contestId={contestId!}
    questionId={selectedQuestion.id}
    allowedLanguages={contest?.allowedLanguages ?? []}
    sessionActive={sessionIsActive}
  />
)}
```

When `session.status` is `SUBMITTED` or `AUTO_SUBMITTED`, the `SessionEndedScreen` (Module 6) replaces the entire right panel — `CodeEditorPanel` is not shown.

**`EditorSlot.tsx` file:** Keep the file but update it to simply re-export `CodeEditorPanel` (for any future use), or delete it if nothing else imports it. Check with `grep -r "EditorSlot" src/` before deleting.

---

## 9. Code Persistence Strategy (In-Memory Only)

Per Module 6's decision (Section 4.6 of the Module 6 frontend plan): **unsaved editor text is not persisted.** Module 7 implements in-memory per-question persistence only:

- A `useRef<Map<string, { code: string; language: string }>>` in `CodeEditorPanel` stores `{ code, language }` keyed by `questionId`.
- When `questionId` changes, the ref is read to restore prior code; if absent, the default template is used.
- On page refresh, all in-memory state is lost. The session (clock) restores, but code does not.

This is explicitly documented in the Assessment page near the `beforeunload` warning from Module 6:
> "Your code is not saved automatically. Refreshing the page will restart the editor."

---

## 10. `beforeunload` Warning Update

Module 6 added a `beforeunload` event listener to warn candidates before closing the tab. Module 7 extends the condition: the warning fires if `sessionIsActive` OR if the editor has non-template code (candidate has typed something worth preserving):

```typescript
useEffect(() => {
  const hasCustomCode = code !== DEFAULT_CODE_TEMPLATES[selectedLanguage];
  const shouldWarn = sessionIsActive || hasCustomCode;

  const handler = (e: BeforeUnloadEvent) => {
    if (shouldWarn) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [sessionIsActive, code, selectedLanguage]);
```

---

## 11. Build Sequence

Follow this order strictly. Each step is independently verifiable before the next.

**Step 1 — Install Monaco**
```bash
npm install @monaco-editor/react
npm run build    # must still succeed (Monaco adds to bundle; warning about chunk size is expected)
```

**Step 2 — Create `submissionApi.ts` skeleton**
- Create the file with stub functions that throw `"not yet implemented"`.
- Create `useRunCode.ts` hook that calls the stub.
- Run `tsc -b` — must compile cleanly.

**Step 3 — `LanguageSelector` component**
- Create `src/components/editor/LanguageSelector.tsx`.
- Test in isolation: render with `allowedLanguages={['PYTHON', 'JAVA', 'CPP']}` and verify all three appear, display names are correct, and `onLanguageChange` fires on selection.

**Step 4 — `OutputPanel` component**
- Create `src/components/editor/OutputPanel.tsx`.
- Test in isolation with mock props: `result={null}` (empty state), `isRunning={true}` (running state), and `result={...}` with STDOUT / COMPILATION_ERROR / RUNTIME_ERROR cases.

**Step 5 — `CodeEditorPanel` component (Monaco integration)**
- Create `src/components/editor/CodeEditorPanel.tsx`.
- Use `React.lazy` + `Suspense` for the Monaco `<Editor />` import.
- Verify Monaco loads (loading state → editor appears) in the browser.
- Verify language change: switching language changes syntax highlight.
- Verify question change: navigating questions restores per-question code from ref.
- Verify `automaticLayout: true` works by resizing the browser window.

**Step 6 — Wire into `AssessmentPage`**
- Replace `<EditorSlot />` with `<CodeEditorPanel />` in `AssessmentPage.tsx`.
- Pass `contestId`, `questionId`, `allowedLanguages`, `sessionActive`.
- Verify end-to-end: open a contest in ONGOING state, start a session, navigate questions, type code.

**Step 7 — Run button flow (with stub)**
- Click Run → expect the "not yet implemented" error toast (from `useRunCode`'s catch block).
- Verify the output panel opens, the spinner appears briefly, and the error message is shown.
- This confirms the UI flow is correct even before Module 8's API exists.

**Step 8 — `beforeunload` update**
- Add the extended warning from Section 10.
- Manually verify: type code → try closing tab → confirm the browser dialog appears.

**Step 9 — TypeScript build**
```bash
npm run build
```
Must succeed with no TypeScript errors. The chunk size warning is expected.

---

## 12. TypeScript Considerations

### 12.1 Monaco types
`@monaco-editor/react` ships its own types. Import the `Editor` component as:
```typescript
import Editor from '@monaco-editor/react';
```
The `options` prop is typed against `monaco.editor.IStandaloneEditorConstructionOptions`. If TypeScript complains about a specific option, wrap it in `as monaco.editor.IStandaloneEditorConstructionOptions`.

### 12.2 `submissionApi.ts` type exports
`TestCaseResultStatus` and `SubmissionStatus` from `submissionApi.ts` are imported by `CodeEditorPanel`, `OutputPanel`, and `RunStatusBadge`. Export them from `submissionApi.ts` (not re-exported from an index) to keep the import path explicit:
```typescript
import type { TestCaseResultStatus } from '../../api/submissionApi';
```

### 12.3 No new global types
Do not add `TestCaseResultStatus` or `SubmissionStatus` to a shared global types file. They belong in `submissionApi.ts` as per the pattern established in all prior modules (types live with their API file).

---

## 13. Definition of Done

- [ ] `npm install @monaco-editor/react` — installed, no peer dependency warnings
- [ ] `npm run build` — BUILD SUCCESS (chunk warning expected; no TypeScript errors)
- [ ] `submissionApi.ts` + `useRunCode.ts` created with stub implementations
- [ ] `LanguageSelector` renders all `allowedLanguages` with correct display names
- [ ] `LanguageSelector` fires `onLanguageChange` correctly
- [ ] Monaco editor loads in `CodeEditorPanel`; language switching changes syntax highlight
- [ ] `automaticLayout: true` works — editor reflows on window resize without visual glitch
- [ ] Default code templates appear for each supported language
- [ ] Per-question code is preserved in-memory when navigating between questions
- [ ] Language change with custom code shows a confirmation dialog
- [ ] Output panel opens on Run click, shows spinner during running state
- [ ] Run stub → error toast appears with "Module 8 pending" message (not a crash)
- [ ] STDOUT / STDERR / STDIN tabs are keyboard-navigable
- [ ] `id="run-code-button"` present on the Run button
- [ ] `id="language-selector"` present on the language `<select>`
- [ ] `beforeunload` warning fires when session is active or custom code exists
- [ ] `EditorSlot` is removed or updated — no broken imports
- [ ] No source code is stored in `localStorage` or `sessionStorage`

---

## 14. What Module 8 Will Add to the Frontend

Module 8 (Submission Service — Frontend) will:
- Replace the `runCode` stub in `submissionApi.ts` with a real `POST /api/submissions/run` call.
- Replace the `submitCode` stub with a real `POST /api/submissions/submit` call.
- Add `useSubmitCode` hook (TanStack Query mutation) for the "Submit for scoring" flow on `AssessmentPage`.
- Wire the existing "Submit" button in `AssessmentPage`'s header (Module 6) to the `useSubmitCode` mutation.
- Add a `SubmissionHistoryPanel` component (accessible after session ends).
- Add per-sample-test-case result display in `OutputPanel` (currently `testCaseResults` in `RunCodeResult` is typed but not rendered).
- Add `SubmissionHistoryPage` for candidates to review past runs.

Module 7's frontend work is complete when the editor works in the exam shell and the Run button fires the correct function (even if the function stubs for now). Module 8 completes the loop.

---

## 15. File Summary

| File | Action | Notes |
|---|---|---|
| `package.json` | **Modified** | Added `@monaco-editor/react` |
| `src/api/submissionApi.ts` | **New** | Stub `runCode` / `submitCode` + types |
| `src/hooks/useRunCode.ts` | **New** | Run code UI state hook |
| `src/components/editor/LanguageSelector.tsx` | **New** | Language `<select>` with display names |
| `src/components/editor/CodeEditorPanel.tsx` | **New** | Monaco + toolbar + output panel assembly |
| `src/components/editor/OutputPanel.tsx` | **New** | STDIN / STDOUT / STDERR tabbed output |
| `src/components/session/EditorSlot.tsx` | **Removed or updated** | Replaced by `CodeEditorPanel` |
| `src/pages/AssessmentPage.tsx` | **Modified** | Replace `EditorSlot` with `CodeEditorPanel`; extend `beforeunload` |

