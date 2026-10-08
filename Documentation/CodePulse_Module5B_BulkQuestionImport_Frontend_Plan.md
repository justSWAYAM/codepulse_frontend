# CodePulse — Module 5B: Bulk Question Import (AI Prompt Workflow)
### Frontend-Only Implementation Plan — file by file, reference by reference

**Stack:** React 19 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query (+ TanStack Table via the shared `DataTable`) + Axios `apiClient`
**Backend counterpart:** `CodePulse_Module5B_BulkQuestionImport_Backend_Plan.md` (endpoints and error codes below come from it)
**Depends on:** Module 5A frontend (`QuestionLibraryPage`, folder tree), Module 5 frontend (`TestCaseManagerPage`), Module 2 (import-result table), Foundation frontend layer
**New npm packages:** none

---

## 0. Scope

### 0.1 What this covers

1. **Import Questions** button inside a library folder → 3-step dialog: choose type → copy AI prompt → paste LLM output → preview → confirm.
2. **Copy Prompt** (type-specific prompt text fetched from the backend).
3. **Test Case Prompt** button in `TestCaseManagerPage` (static template strings, DSA and SQL only).
4. Preview table, per-row errors, and the post-import report.

### 0.2 What this does NOT cover

No backend work. No new pages, routes, or sidebar items. The test-case CSV upload UI already exists (Module 5) and is untouched.

### 0.3 Decisions locked in this plan

| # | Decision | Why |
|---|---|---|
| F-D1 | The dialog is a **local state machine**, not a router flow | Nothing to deep-link; state dies with the dialog |
| F-D2 | **Preview is mandatory before Confirm**, and **editing the pasted text invalidates the preview** | Prevents confirming something other than what was previewed |
| F-D3 | Confirm is disabled while pending and after success | Backend has no duplicate detection; double-click = duplicate questions |
| F-D4 | Prompt for question import comes from `GET /api/library/import-template` (never hardcoded) | Prompt and parser stay in sync on the backend |
| F-D5 | Test Case Prompt templates **are** hardcoded strings in the frontend | Roadmap: "frontend strings" |
| F-D6 | One shared `copyText()` util with a **non-HTTPS fallback** and a manual-copy dialog | `navigator.clipboard` only exists on HTTPS/localhost, and your demo may run on a LAN IP over http |
| F-D7 | Import errors are shown **inline in the dialog**, not as global toasts | Avoids double messages from the global mutation error handler |
| F-D8 | All API calls go through `apiClient`, wrapped in typed hooks | Foundation rule |

---

## 1. Flow

```
QuestionLibraryPage ── [Import Questions] (only when a folder is selected) ──► QuestionImportDialog
   Step 1  Choose type (DSA / SQL / MCQ / THEORY)
   Step 2  Copy AI prompt         ◄── useImportTemplate(type) ◄── GET /library/import-template
   Step 3  Paste LLM output ──[Preview]──► POST /library/questions/import?dryRun=true
           preview table (valid / invalid rows, per-row errors)
           ──[Import N questions]──► POST …?dryRun=false ──► report + refresh library list

TestCaseManagerPage ── [Test Case Prompt] (DSA / SQL questions only) ──► copies static prompt filled with title/description/schemaSql
```

### 1.1 Reuse map

| Need | Reused from |
|---|---|
| HTTP + JWT + refresh | `apiClient` (Foundation) |
| Response unwrapping | existing `ApiResponse<T>` TS type |
| Table with sorting/paging | shared `DataTable` (Foundation) |
| Post-import failure report | Module 2's import-result table (CSV user import) |
| Dialog, Button, Textarea, Badge, Alert | shadcn/ui components already installed |
| Toasts | existing toast system (`sonner`/`toast`) |
| Query key factory and invalidation | Module 5A library hooks |
| Question type union | existing `QuestionType` TS type |

---

## 2. Step 0 — Pre-flight (lock these before coding)

I wrote this against the roadmap, not your repo. Look each up, fill the last column, and adjust the snippets.

| # | Fact | How to find it | Locked value |
|---|---|---|---|
| F1 | `apiClient` baseURL (is `/api` already prefixed?) | open `apiClient.ts` | |
| F2 | `ApiResponse<T>` and `ApiError` TS types; where Axios errors expose `code` / `message` (`error.response.data`) | grep types | |
| F3 | `BulkImportResult` TS type from Module 2 (field names for counts and the errors list) | open Module 2 `userApi` / types | |
| F4 | Module 2 import-result table component: name, props | grep in the users feature | |
| F5 | `QuestionType` type location and exact values | grep | |
| F6 | Library query-key factory / key used by `useLibraryQuestions` and `useSubjects` | open Module 5A hooks | |
| F7 | How `QuestionLibraryPage` stores the selected folder (id) | open the page | |
| F8 | Does the global `QueryClient` mutation `onError` toast? Is there an opt-out (e.g. `meta`)? | open `queryClient.ts` | |
| F9 | `TestCaseManagerPage`: which `question` object it has (`title`, `description`, `questionType`, `schemaSql` — exact camelCase names) | open the page + question type | |
| F10 | shadcn components installed: `dialog`, `button`, `textarea`, `badge`, `alert`, `radio-group` | `ls components/ui` | |
| F11 | Feature folder convention (`src/features/library/...`?) | look at 5A | |
| F12 | Test stack: Vitest + React Testing Library + MSW? | open `package.json` | |

**Baseline:** run lint, type-check and the existing test suite now and record the result.

---

## 3. File inventory

Paths assume `src/features/library/import/` (adjust per F11).

### 3.1 New files

| # | File | Purpose |
|---|---|---|
| 1 | `import/types.ts` | API types for this module |
| 2 | `import/importApi.ts` | `getTemplate`, `importQuestions` |
| 3 | `import/useImportTemplate.ts` | Query hook |
| 4 | `import/useImportQuestions.ts` | Preview + confirm mutations |
| 5 | `src/lib/copyText.ts` | Clipboard util with fallback |
| 6 | `import/CopyPromptButton.tsx` | Generic copy button (+ manual-copy dialog) |
| 7 | `import/testCasePrompts.ts` | Static DSA/SQL prompts + `buildTestCasePrompt()` |
| 8 | `import/TestCasePromptButton.tsx` | Button for `TestCaseManagerPage` |
| 9 | `import/ImportPreviewTable.tsx` | Preview rows on the shared `DataTable` |
| 10 | `import/QuestionImportDialog.tsx` | The 3-step dialog |

### 3.2 Modified files (small)

| File | Change |
|---|---|
| `QuestionLibraryPage.tsx` | Add **Import Questions** button + mount dialog |
| `TestCaseManagerPage.tsx` | Add `<TestCasePromptButton question={question} />` |
| `queryClient.ts` | Only if F8 has no opt-out: honor `meta.silent` in the global mutation error handler |

---

## 4. Implementation — step by step

> After each step: type-check, lint, run tests, commit.

### Step 1 — Types and API

**`types.ts`**

```ts
import type { QuestionType } from '@/types/question';      // F5
import type { BulkImportResult } from '@/features/users/types'; // F3

export interface ImportTemplate {
  type: QuestionType;
  prompt: string;
  maxQuestions: number;
  maxPayloadBytes: number;
}

export interface ImportRowPreview {
  rowNumber: number;
  valid: boolean;
  title: string | null;
  difficulty: string | null;
  points: number | null;
  descriptionPreview: string;
  detail: string;            // e.g. "4 options · correct: 2,3"
  errors: string[];
}

export interface QuestionImportResponse {
  dryRun: boolean;
  result: BulkImportResult;  // exactly Module 2's shape
  rows: ImportRowPreview[];
}

export interface ImportQuestionsBody {
  subjectId: string;
  type: QuestionType;
  payload: string;
}

export const IMPORT_TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: 'MCQ',    label: 'MCQ',    hint: 'Questions with options and correct answer(s)' },
  { value: 'DSA',    label: 'DSA',    hint: 'Coding problems (test cases added later)' },
  { value: 'SQL',    label: 'SQL',    hint: 'Schema + question (test cases added later)' },
  { value: 'THEORY', label: 'Theory', hint: 'Written-answer questions' },
];
```

**`importApi.ts`**

```ts
import { apiClient } from '@/lib/apiClient';                 // F1
import type { ApiResponse } from '@/types/api';              // F2
import type { QuestionType } from '@/types/question';
import type { ImportQuestionsBody, ImportTemplate, QuestionImportResponse } from './types';

export const importApi = {
  getTemplate: (type: QuestionType) =>
    apiClient
      .get<ApiResponse<ImportTemplate>>('/library/import-template', { params: { type } })
      .then((r) => r.data.data),

  importQuestions: (body: ImportQuestionsBody, dryRun: boolean) =>
    apiClient
      .post<ApiResponse<QuestionImportResponse>>('/library/questions/import', body, { params: { dryRun } })
      .then((r) => r.data.data),
};
```

`dryRun` is always passed explicitly (the backend default is `true`, but the frontend never relies on it).

**Checkpoint 1:** compiles.

---

### Step 2 — Hooks

**`useImportTemplate.ts`**

```ts
export function useImportTemplate(type: QuestionType | null, enabled = true) {
  return useQuery({
    queryKey: ['library', 'import-template', type],
    queryFn: () => importApi.getTemplate(type as QuestionType),
    enabled: enabled && type !== null,
    staleTime: 5 * 60 * 1000,
  });
}
```

**`useImportQuestions.ts`**

```ts
export function useImportQuestions() {
  const qc = useQueryClient();

  const preview = useMutation({
    mutationFn: (body: ImportQuestionsBody) => importApi.importQuestions(body, true),
    meta: { silent: true },                       // F-D7 (needs F8 support)
  });

  const confirm = useMutation({
    mutationFn: (body: ImportQuestionsBody) => importApi.importQuestions(body, false),
    meta: { silent: true },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: libraryKeys.all });   // F6: refreshes questions list and folder counts
    },
  });

  return { preview, confirm };
}
```

If F8 shows the global handler has no opt-out, add this to `queryClient.ts`'s mutation `onError`:

```ts
if ((mutation.meta as { silent?: boolean } | undefined)?.silent) return;
```

**Checkpoint 2:** compiles; failed preview does not trigger a global toast.

---

### Step 3 — Clipboard util and `CopyPromptButton`

**`src/lib/copyText.ts`** — shared, reusable anywhere.

```ts
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  document.body.removeChild(ta);
  return ok;
}
```

**`CopyPromptButton.tsx`** — takes a function so the text is built at click time. If copying fails, it opens a dialog with the text pre-selected so the user can copy manually.

```tsx
interface Props {
  getText: () => string;
  label?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
}

export function CopyPromptButton({ getText, label = 'Copy AI Prompt', disabled, variant = 'default' }: Props) {
  const [copied, setCopied] = useState(false);
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  async function onClick() {
    const text = getText();
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      toast.success('Prompt copied');
      setTimeout(() => setCopied(false), 2000);
    } else {
      setFallbackText(text);                 // manual copy
    }
  }

  return (
    <>
      <Button type="button" variant={variant} disabled={disabled} onClick={onClick}>
        {copied ? 'Copied ✓' : label}
      </Button>

      <Dialog open={fallbackText !== null} onOpenChange={(o) => !o && setFallbackText(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy manually</DialogTitle>
            <DialogDescription>Your browser blocked automatic copying. Select all and copy.</DialogDescription>
          </DialogHeader>
          <Textarea readOnly value={fallbackText ?? ''} className="h-64 font-mono text-xs"
                    onFocus={(e) => e.currentTarget.select()} autoFocus />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Checkpoint 3:** unit test `copyText` (secure context path, and fallback path with `navigator.clipboard` undefined and `document.execCommand` mocked).

---

### Step 4 — Test Case Prompt (static templates)

**`testCasePrompts.ts`** — copy the wording from the roadmap exactly; the CSV it asks for is the Module 5 format.

```ts
import type { QuestionType } from '@/types/question';

const DSA_TEMPLATE = `Write 8 test cases for this problem as a CSV in a code block, header exactly:
input,expected_output,is_sample,weight
Rules: quote any cell with commas or line breaks; input is the exact stdin; expected_output is the exact stdout;
first 2 rows is_sample=true, the rest false; weight=1; include edge cases (empty, minimum, maximum).
Problem: {title}
{description}`;

const SQL_TEMPLATE = `Write 6 test cases for this SQL question as a CSV in a code block, header exactly:
input,expected_output,is_sample,weight
Rules: input = extra INSERT statements for this case (blank for the base data); expected_output = JSON
{"columns":[...],"rows":[[...]]} for the correct query on schema + input; double the quotes inside CSV cells;
first 2 rows is_sample=true; weight=1; vary the data so hardcoded answers fail.
Question: {title}
{description}
Schema: {schema_sql}`;

export interface PromptSource {
  title: string;
  description: string;
  questionType: QuestionType;     // F9 names
  schemaSql?: string | null;
}

export function supportsTestCasePrompt(type: QuestionType): boolean {
  return type === 'DSA' || type === 'SQL';
}

/** Replaces ONLY {title}, {description}, {schema_sql}. The JSON braces in the SQL template are untouched. */
export function buildTestCasePrompt(q: PromptSource): string {
  const values: Record<string, string> = {
    title: q.title,
    description: q.description,
    schema_sql: q.schemaSql ?? '',
  };
  const template = q.questionType === 'SQL' ? SQL_TEMPLATE : DSA_TEMPLATE;
  return template.replace(/\{(title|description|schema_sql)\}/g, (_m, key: string) => values[key] ?? '');
}
```

Why a function replacer: a plain `replace(token, description)` treats `$&`, `$1` etc. in the description as special patterns and corrupts it (SQL and regex descriptions contain `$`).

**`TestCasePromptButton.tsx`**

```tsx
export function TestCasePromptButton({ question }: { question: PromptSource }) {
  if (!supportsTestCasePrompt(question.questionType)) return null;   // hidden for MCQ/THEORY
  return (
    <CopyPromptButton
      label="Test Case Prompt"
      variant="outline"
      getText={() => buildTestCasePrompt(question)}
    />
  );
}
```

**Wire into `TestCaseManagerPage`:** place it next to the existing bulk-upload control, passing the question already loaded on that page.

**Checkpoint 4 — tests (`testCasePrompts.test.ts`):**

| Case | Expected |
|---|---|
| DSA question | contains title and description; no `{title}` left; no `schema` line |
| SQL question | contains `Schema:` + schemaSql; the literal `{"columns":[...],"rows":[[...]]}` still present |
| Description contains `$&` and `$1` | appears verbatim in the output |
| `schemaSql` null on SQL | `Schema: ` with empty text, no `undefined`/`null` |
| MCQ / THEORY | `supportsTestCasePrompt` false; button renders nothing |

---

### Step 5 — `ImportPreviewTable`

Built on the shared `DataTable`. Columns: **#** (rowNumber), **Status** (badge), **Title**, **Difficulty**, **Points**, **Details** (`detail`), **Errors** (list). Invalid rows get a red status badge and their errors listed; do not hide valid rows.

```tsx
const columns: ColumnDef<ImportRowPreview>[] = [
  { accessorKey: 'rowNumber', header: '#' },
  { id: 'status', header: 'Status',
    cell: ({ row }) => row.original.valid
      ? <Badge variant="secondary">OK</Badge>
      : <Badge variant="destructive">Error</Badge> },
  { accessorKey: 'title', header: 'Title', cell: ({ getValue }) => getValue<string | null>() ?? '—' },
  { accessorKey: 'difficulty', header: 'Difficulty', cell: ({ getValue }) => getValue<string | null>() ?? '—' },
  { accessorKey: 'points', header: 'Points', cell: ({ getValue }) => getValue<number | null>() ?? '—' },
  { accessorKey: 'detail', header: 'Details' },
  { id: 'errors', header: 'Problems',
    cell: ({ row }) => row.original.errors.length === 0 ? null : (
      <ul className="list-disc pl-4 text-sm text-destructive">
        {row.original.errors.map((e, i) => <li key={i}>{e}</li>)}
      </ul>) },
];

export function ImportPreviewTable({ rows }: { rows: ImportRowPreview[] }) {
  return <DataTable columns={columns} data={rows} /* use the shared table's existing props (client-side paging) */ />;
}
```

Adapt the `DataTable` props to its real signature. Rows can be up to 200, so enable client-side pagination (e.g. 10 per page) if the shared table supports it.

**Checkpoint 5:** renders with a mixed fixture; invalid rows show their messages.

---

### Step 6 — `QuestionImportDialog`

**Props:** `{ open: boolean; onOpenChange(open): void; subjectId: string; subjectName: string }`

**State**

```ts
const [step, setStep] = useState<1 | 2 | 3>(1);
const [type, setType] = useState<QuestionType | null>(null);
const [payload, setPayload] = useState('');
const [previewedPayload, setPreviewedPayload] = useState<string | null>(null);
const { preview, confirm } = useImportQuestions();
const template = useImportTemplate(type, step >= 2);
```

**Derived values**

```ts
const bytes = useMemo(() => new TextEncoder().encode(payload).length, [payload]);
const maxBytes = template.data?.maxPayloadBytes ?? 1_048_576;
const tooLarge = bytes > maxBytes;
const previewData = preview.data;
const previewIsCurrent = previewData !== undefined && previewedPayload === payload;   // F-D2
const validCount = previewData?.rows.filter((r) => r.valid).length ?? 0;
const invalidCount = (previewData?.rows.length ?? 0) - validCount;
const imported = confirm.isSuccess;                                                    // F-D3
```

**Behaviour**

| Moment | Behaviour |
|---|---|
| Step 1 | Radio cards from `IMPORT_TYPES`. **Next** disabled until a type is chosen. Changing type later resets payload, preview and confirm state. |
| Step 2 | Shows the prompt in a read-only textarea (so manual copy always works) + `CopyPromptButton getText={() => template.data!.prompt}` disabled while loading. Short instructions: "1. Copy the prompt. 2. Paste it into your AI together with your PDF/question list. 3. Paste the AI's full answer in the next step." Shows loading/error via the shared `LoadingState`/`ErrorState`. |
| Step 3 | Large textarea for the AI output. Live size indicator (`bytes / maxBytes`); over limit → red text and **Preview** disabled. **Preview** disabled when payload is blank. |
| Preview clicked | `preview.mutate({subjectId, type, payload})`; on success `setPreviewedPayload(payload)`. |
| Payload edited after preview | `previewIsCurrent` becomes false → table is hidden, a hint says "Text changed — preview again", **Import** disabled. |
| Preview result | Summary badges: *N valid*, *M with errors*. `ImportPreviewTable`. If `validCount === 0`, show an alert "Nothing can be imported — fix the AI output or ask it to correct these rows." |
| Import clicked | Disabled unless `previewIsCurrent && validCount > 0 && !confirm.isPending && !imported`. `confirm.mutate(body)`. Button label: `Import ${validCount} question(s)`; while pending: spinner + "Importing…". |
| After import | Replace the table with: success summary using `result` counts, then **only the failed rows** using Module 2's import-result table (F4) if the failure count > 0. Primary button becomes **Done** (closes dialog). |
| Request-level errors | Inline `Alert` mapped from `error.response.data.code` (below). Not a toast. |
| Closing | Reset all state when the dialog closes (`onOpenChange(false)` → reset). If a confirm is pending, ignore close attempts. |

**Error message map**

```ts
function importErrorMessage(err: unknown): string {
  const data = (err as AxiosError<{ code?: string; message?: string }>)?.response?.data;   // F2
  switch (data?.code) {
    case 'IMPORT_PAYLOAD_TOO_LARGE': return 'The pasted text is too large. Import fewer questions at a time.';
    case 'IMPORT_LIMIT_EXCEEDED':    return data.message ?? 'Too many questions in one import. Split the list into batches.';
    case 'IMPORT_PAYLOAD_INVALID':   return data.message ?? 'That is not valid JSON. Paste the exact output of the AI.';
    case 'SUBJECT_NOT_FOUND':        return 'This folder no longer exists. Close the dialog and refresh the library.';
    default:                         return data?.message ?? 'Something went wrong. Please try again.';
  }
}
```

Show `preview.error` or `confirm.error` through this function in one `Alert` at the bottom of step 3.

**Layout skeleton**

```tsx
<Dialog open={open} onOpenChange={(o) => (confirm.isPending ? undefined : handleOpenChange(o))}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Import questions into “{subjectName}”</DialogTitle>
      <DialogDescription>Step {step} of 3</DialogDescription>
    </DialogHeader>

    {step === 1 && <TypeStep value={type} onChange={onTypeChange} />}
    {step === 2 && <PromptStep template={template} />}
    {step === 3 && (
      <PasteStep
        payload={payload} onPayloadChange={setPayload}
        bytes={bytes} maxBytes={maxBytes} tooLarge={tooLarge}
        preview={previewIsCurrent ? previewData : undefined}
        confirmResult={confirm.data}
        error={preview.error ?? confirm.error}
      />
    )}

    <DialogFooter> {/* Back / Next / Preview / Import / Done, per the table above */} </DialogFooter>
  </DialogContent>
</Dialog>
```

`TypeStep`, `PromptStep`, `PasteStep` can be small components in the same file.

**Checkpoint 6:** the dialog runs end to end against the real backend with a 3-row MCQ sample.

---

### Step 7 — Entry points

**`QuestionLibraryPage.tsx`**

```tsx
const [importOpen, setImportOpen] = useState(false);
// selectedSubject comes from the folder tree state (F7)

<Button disabled={!selectedSubject} onClick={() => setImportOpen(true)}>Import Questions</Button>

{selectedSubject && (
  <QuestionImportDialog
    open={importOpen}
    onOpenChange={setImportOpen}
    subjectId={selectedSubject.id}
    subjectName={selectedSubject.name}
  />
)}
```

- Disabled with a tooltip ("Select a folder first") when no folder is selected.
- Visible to Evaluator/Admin only. The library page is already evaluator/admin-only via `ProtectedRoute`; don't add a second role check.

**`TestCaseManagerPage.tsx`:** add `<TestCasePromptButton question={question} />` beside the bulk-upload dropzone/button.

**Checkpoint 7:** both buttons visible where expected; Test Case Prompt hidden on MCQ and THEORY questions.

---

## 5. Tests

Use whatever F12 shows (Vitest + RTL + MSW is assumed).

| Test | Checks |
|---|---|
| `copyText.test.ts` | clipboard path, fallback path, failure returns `false` |
| `testCasePrompts.test.ts` | table in Step 4 |
| `CopyPromptButton.test.tsx` | success shows "Copied ✓"; failure opens manual-copy dialog with the text |
| `QuestionImportDialog.test.tsx` (MSW) | see below |

**Dialog scenarios**

1. Step navigation: Next disabled until a type is chosen; Back returns without losing the chosen type.
2. Step 2 shows the prompt text returned by the template endpoint; Copy button copies exactly that text.
3. Paste → Preview calls the endpoint with `dryRun=true` and the right body; table shows valid and invalid rows with messages.
4. Editing the textarea after preview hides the table and disables Import.
5. Import calls `dryRun=false` **exactly once** even on double-click; shows the report; invalidates the library queries; **Done** closes.
6. Payload over the limit disables Preview and shows the size warning.
7. Backend errors (`IMPORT_PAYLOAD_INVALID`, `IMPORT_LIMIT_EXCEEDED`, `IMPORT_PAYLOAD_TOO_LARGE`) show the mapped inline message and no global toast.
8. Closing and reopening the dialog starts clean at step 1.
9. All-invalid preview: Import stays disabled and the alert shows.

---

## 6. Manual verification checklist

- [ ] Real flow with MCQ: copy prompt → paste into two real LLMs with a short question list → paste each reply untouched → preview shows no errors → import → questions appear in the folder.
- [ ] Same for SQL and DSA; imported DSA/SQL questions show the **No test cases** badge in the list.
- [ ] Open **Test Case Prompt** on a DSA and an SQL question; paste the prompts into an LLM; upload the resulting CSVs with the existing bulk-upload control with no manual edits.
- [ ] Open the app over plain `http://<LAN-IP>` and confirm copy still works (fallback path).
- [ ] Candidate account cannot reach the library page (existing `ProtectedRoute`).
- [ ] Keyboard: dialog is operable with Tab/Enter/Esc; Esc is ignored while an import is pending.

---

## 7. Pitfalls

| # | Pitfall | Prevention |
|---|---|---|
| P1 | `navigator.clipboard` is `undefined` on http LAN deployments | `copyText` fallback + manual-copy dialog |
| P2 | `String.replace` with `$` in descriptions corrupts prompts | Function replacer, tested |
| P3 | Confirming text different from what was previewed | `previewedPayload === payload` gate |
| P4 | Double import on double-click (backend does not de-duplicate) | Disabled while pending and after success |
| P5 | Global error toast **and** inline error both appearing | `meta.silent` + inline `Alert` |
| P6 | Stale library list after import | Invalidate `libraryKeys.all` on confirm success |
| P7 | Prompt hardcoded in the UI drifting from the parser | Question-import prompt always fetched from the backend |
| P8 | Preview table with 200 rows freezing the UI | Client-side pagination in `DataTable` |
| P9 | Dialog state leaking between folders/types | Reset on close and on type change |
| P10 | Test Case Prompt shown for MCQ/THEORY | `supportsTestCasePrompt` guard + test |

---

## 8. Definition of Done (frontend side)

- [ ] **Import Questions** opens a 3-step dialog: type → copy prompt → paste output
- [ ] Prompt text comes from the backend and the Copy button copies exactly it (also works over plain http)
- [ ] Preview shows parsed rows and per-row errors; nothing is stored until **Import**
- [ ] Editing the pasted text invalidates the preview; Import cannot be clicked twice
- [ ] Valid rows import and invalid rows are reported by row number and reason, using Module 2's result table
- [ ] Imported DSA/SQL questions show the **No test cases** badge; imported MCQ keeps options and correct answers
- [ ] **Test Case Prompt** appears only for DSA/SQL questions, fills title/description/schema, and its output uploads through the existing CSV importer unchanged
- [ ] Request-level errors appear inline with friendly text
- [ ] Type-check, lint and the full existing test suite are green
- [ ] Roadmap consistency checklist: API calls through `apiClient` in typed hooks, list view uses the shared `DataTable`

---

## 9. Out of scope / future

- CSV/Excel direct import; import straight into a contest.
- Client-side duplicate-title warning in the preview.
- Remembering the last chosen type per user.
