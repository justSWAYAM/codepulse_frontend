# CodePulse Enterprise — Module 5: Frontend Plan
**Scope: Frontend only. No new pages/routes — this module extends the existing `QuestionEditPage` (Module 4) with test case management, and extends `QuestionDetailCard` (Module 4) to display sample test cases. Backend (Module 5) must be working — do not touch it.**

---

## 1. Purpose of This Document

This is the single reference for building Module 5 of the frontend. It contains:
- What's being added to Module 4's existing files, and what's genuinely new
- The full component inventory with rationale
- A note on where this module deliberately reuses Module 2's bulk-upload component instead of rebuilding it
- API layer specification and hooks
- A strict build sequence

No code is written here — only specifications.

---

## 2. Tech Stack for Module 5

**No new dependencies.** Everything this module needs already exists:

| Need | Already have it from | Reused as |
|---|---|---|
| Drag-and-drop CSV upload with client-side preview | Module 2 (`react-dropzone`, Papa Parse, the Aceternity-derived `CsvUploadInput`) | `CsvUploadInput` itself, reconfigured for test-case CSV columns — not rebuilt |
| Forms + validation | Module 1/2 (React Hook Form + Zod) | `TestCaseForm` |
| Data fetching/caching | All prior modules (TanStack Query) | `useTestCases`, mutations |
| Monospace rendering for input/output text | Module 1 (JetBrains Mono token) | `TestCaseTable` cell content, `TestCasePreviewDialog` |
| Tabs | Module 3 introduced the `Tabs` pattern for `ContestDetailPage` | Reused for the new "Test Cases" tab on `QuestionEditPage` |
| Toasts, dialogs, badges | Modules 1–4 | Unchanged |

This is worth stating plainly: if you find yourself reaching for `npm install` anything in this module, stop and check whether Module 2 or Module 4 already built it.

---

## 3. Design Direction (Continuation of Module 4)

No new colors, fonts, or motion rules. Two reused patterns, applied to new content:

### 3.1 Sample / Hidden chip
Follows the same visual grammar Module 2 established for status chips:

| Flag | Style | Rationale |
|---|---|---|
| `isSample: true` → **"Sample"** | `accent-compile` green pill | Green already means "visible / passing / safe" across the app (Active users, EASY difficulty) |
| `isSample: false` → **"Hidden"** | `hairline`-bordered neutral pill | Neutral, not red — hidden isn't an error state, it's a normal and expected majority of test cases |

### 3.2 Input / expected-output display
Rendered in JetBrains Mono inside a `surface`-colored, `hairline`-bordered block — the same visual treatment Module 1's design system reserves for technical/code content (point values, IDs). Long values are truncated in the table with a "View full" affordance rather than wrapping the row height open, to keep `TestCaseTable` scannable.

---

## 4. Decisions Carried Over From the Backend Plan

These aren't new decisions — they're frontend consequences of choices already made in the Module 5 backend plan, called out here so nobody reinvents them differently on the frontend.

### 4.1 No edit action on test cases
The backend exposes `GET` / `POST` / `POST .../bulk` / `DELETE` — **no `PUT`**. `TestCaseTable`'s row actions are therefore **Delete only**, not Edit-then-Delete. To change a test case, delete it and add a new one. This is a real product gap, not a frontend oversight — worth a one-line note in the UI itself (see `TestCaseForm` below) so it doesn't look like a bug, and it's listed again in Future Enhancements as a natural spot for a `PUT` endpoint if this friction turns out to matter in practice.

### 4.2 Candidates never see `weight` or `expectedOutput`
`TestCaseSampleRecord` (the type this module adds to the API layer) only has `id`, `input`, `orderIndex` — mirroring the backend's `TestCaseSampleResponse` exactly. Don't "helpfully" surface weight in a candidate-facing tooltip or anywhere else; the backend plan was explicit that even partial hints defeat the purpose.

### 4.3 No weight-sum validation
`TestCaseForm` validates `weight >= 0` and nothing more. A running "Total weight: N" display in `TestCaseTable`'s footer is informational only — it never blocks submission, matching the backend's deliberate choice not to hardcode a scoring model into this module (Module 8 owns that).

---

## 5. Site Map for Module 5

No new routes. Test case management is reached exclusively through the existing:

```
/dashboard/contests/:contestId/questions/:id/edit   → QuestionEditPage (EXISTING, Module 4)
                                                        now with a "Test Cases" tab
```

**Why no route of its own:** a test case cannot exist without a question, and the question edit route already carries both `contestId` and `questionId` as params — reusing it avoids threading those same two IDs through a new URL for no benefit. This is the same reasoning Module 4 used to fold the question list into a `ContestDetailPage` tab instead of a standalone route.

---

## 6. Component Inventory

### 6.1 Extending an Existing Page — `QuestionEditPage`

`QuestionEditPage` currently renders `QuestionForm` directly. It now renders a `Tabs` component (the same primitive `ContestDetailPage` uses) with two tabs:

| Tab | Content | Notes |
|---|---|---|
| **Details** | The existing `QuestionForm` — unchanged | Default active tab |
| **Test Cases** | `TestCaseManagerPanel` (new) | **Only rendered once the question exists** — i.e., only on the Edit route, never on Create. `QuestionCreatePage` is untouched; it still has no Test Cases tab, since there's no `questionId` yet for test cases to attach to. |

### 6.2 New Components

#### `TestCaseManagerPanel`

| Property | Value |
|---|---|
| **Location** | `src/components/testcase/TestCaseManagerPanel.tsx` |
| **Purpose** | The full test-case management surface for one question — this is the roadmap's "TestCaseManagerPage," implemented as an embedded panel (same naming translation Module 4 did: roadmap's "page" became a panel once it was clear it nests inside an existing route, not a route of its own) |
| **Contents** | Header row ("Test Cases (N)" + "Add Test Case" button + "Bulk Upload" button), `TestCaseTable` |
| **Props** | `questionId: string`, `contestId: string` |
| **Empty state** | "No test cases yet. Add at least one hidden test case before this question can be scored." — nudges the admin toward the real requirement (a question with zero test cases can't be graded) rather than staying silent about it |

#### `TestCaseTable`

| Property | Value |
|---|---|
| **Location** | `src/components/testcase/TestCaseTable.tsx` |
| **Purpose** | Lists all test cases for a question — order, Sample/Hidden chip, truncated input/output preview, weight, delete action |
| **Not built on `DataTable`** | Unlike `UserTable`/`QuestionCard` lists, this is a small, non-paginated list (a question realistically has single-digit-to-low-tens of test cases) — a plain table is appropriate; don't force it through the paginated `DataTable` machinery built for large collections |
| **Row action** | Delete only (Section 4.1) — opens `DeleteTestCaseDialog` |
| **Row click (non-action area)** | Opens `TestCasePreviewDialog` with the full, untruncated input/expected output |
| **Footer** | Informational "Total weight: N" (Section 4.3) |

#### `TestCaseForm`

| Property | Value |
|---|---|
| **Location** | `src/components/testcase/TestCaseForm.tsx` |
| **Purpose** | React Hook Form + Zod form for creating a test case. There is no edit variant (Section 4.1) — this form is only ever used in "create" mode, so unlike `QuestionForm` it doesn't need a `defaultValues` prop for pre-population |
| **Inputs** | Input (textarea, monospace), Expected Output (textarea, monospace), Is Sample (switch, with helper text: "Visible to candidates before they submit — don't use for cases that reveal the intended approach"), Weight (number input, default `0`) |
| **Footer note** | Small muted text: "Test cases can't be edited after creation — delete and re-add if you need to change one." Surfaces the Section 4.1 limitation in the UI itself instead of letting the admin discover it by looking for a missing Edit button |
| **Props** | `onSubmit: (data: TestCaseFormData) => void`, `isPending: boolean` |

#### `CreateTestCaseDialog`

| Property | Value |
|---|---|
| **Location** | `src/components/testcase/CreateTestCaseDialog.tsx` |
| **Purpose** | Wraps `TestCaseForm` in a shadcn `Dialog`, triggered by `TestCaseManagerPanel`'s "Add Test Case" button |
| **On success** | Closes dialog, toast, table refreshes |

#### `DeleteTestCaseDialog`

| Property | Value |
|---|---|
| **Location** | `src/components/testcase/DeleteTestCaseDialog.tsx` |
| **Purpose** | Confirmation `AlertDialog` before deleting — same pattern as `DeleteQuestionDialog` from Module 4. Warns explicitly that deletion is permanent (reinforces Section 4.1 — there's no "edit" escape hatch, so make sure delete isn't a misclick) |

#### `TestCasePreviewDialog`

| Property | Value |
|---|---|
| **Location** | `src/components/testcase/TestCasePreviewDialog.tsx` |
| **Purpose** | Read-only modal showing the untruncated Input and Expected Output for one test case, monospace, scrollable for long values |
| **Trigger** | Clicking a `TestCaseTable` row outside the delete-action area |

#### `BulkUploadTestCasesDialog`

| Property | Value |
|---|---|
| **Location** | `src/components/testcase/BulkUploadTestCasesDialog.tsx` |
| **Purpose** | Wraps the **existing** `CsvUploadInput` from Module 2 — this is the roadmap's "BulkUploadDropzone," and it is explicitly **not** a new dropzone component. Reconfigure `CsvUploadInput`'s expected headers to `input, expected_output, is_sample, weight` and its Papa Parse preview validation to flag non-boolean `is_sample` values and non-numeric `weight` values, the same way Module 2 flagged malformed CSV rows for user import |
| **Flow** | Drop/select file → Papa Parse client-side preview (row count + flagged rows) → confirm → `POST .../test-cases/bulk` → `TestCaseBulkUploadResultReport` |
| **Template link** | A small "Download CSV template" link pointing to a static 4-column sample file — trivial to add, meaningfully reduces malformed first attempts |

#### `TestCaseBulkUploadResultReport`

| Property | Value |
|---|---|
| **Location** | `src/components/testcase/TestCaseBulkUploadResultReport.tsx` |
| **Purpose** | Renders `{ totalRows, succeededCount, failedCount, errors }` as a clear per-row report after upload — same "never just a toast" rule Module 2's `BulkImportResult` display followed |
| **Props** | `result: TestCaseBulkUploadResult` |

### 6.3 Extending `QuestionDetailCard` (Module 4)

`QuestionDetailCard` currently renders title, markdown description, and the metadata bar. It gains one new conditional block:

| Viewer | New block |
|---|---|
| Admin / Evaluator | A compact summary — "N test cases (X sample, Y hidden)" — with a link into the Test Cases tab. **Not** a duplicate of `TestCaseTable`; full management stays in `TestCaseManagerPanel` only |
| Candidate | A "Sample Test Cases" section listing each sample's `input` only (no expected output — Section 4.2). This is what a candidate sees pre-submission; their own actual output appears only after a Run, which is Module 6's concern |

**This is the frontend's version of the backend plan's Section 8** — Module 4 left a comment (`// Module 5 will add: testCases` / `sampleTestCases`) in its type definitions specifically for this module to fill in. Extending `QuestionDetailCard` is that fill-in on the UI side.

**Scope boundary, same as Module 4 drew for itself:** this module makes `QuestionDetailCard` correctly *display* sample test cases wherever that card is already used. It does not build the Assessment Session UI, the "Run" button, or any output-comparison view — that's Module 6, same deferral Module 4 already made for the rest of the candidate exam experience.

---

## 7. API Layer

### 7.1 Types (`src/api/testCaseApi.ts`)

```typescript
import type { RowError } from './common';  // reused from Module 2's bulk-import types — don't redefine

export interface TestCaseAdminRecord {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  weight: number;
  orderIndex: number;
}

// Candidate view — no expectedOutput, no weight (Section 4.2)
export interface TestCaseSampleRecord {
  id: string;
  input: string;
  orderIndex: number;
}

export interface CreateTestCasePayload {
  input: string;
  expectedOutput: string;
  isSample: boolean;
  weight: number;
}

export interface TestCaseBulkUploadResult {
  totalRows: number;
  succeededCount: number;
  failedCount: number;
  errors: RowError[];
}
```

**Also update `src/api/questionApi.ts`** — replace the two placeholder comments Module 4 left:

```typescript
export interface QuestionAdminRecord {
  // ...unchanged fields...
  testCases: TestCaseAdminRecord[];        // was: // Module 5 will add: testCases: TestCaseAdminRecord[]
}

export interface QuestionCandidateRecord {
  // ...unchanged fields...
  sampleTestCases: TestCaseSampleRecord[]; // was: // Module 5 will add: sampleTestCases: TestCaseSampleRecord[]
}
```

### 7.2 API Functions (`src/api/testCaseApi.ts`)

```typescript
export const testCaseApi = {

  // Returns TestCaseAdminRecord[] (admin/evaluator) or TestCaseSampleRecord[] (candidate)
  getTestCases: async (questionId: string): Promise<TestCaseAdminRecord[] | TestCaseSampleRecord[]> => {
    const { data } = await apiClient.get<ApiWrapper<TestCaseAdminRecord[] | TestCaseSampleRecord[]>>(
      `/questions/${questionId}/test-cases`
    );
    return data.data;
  },

  createTestCase: async (
    questionId: string,
    payload: CreateTestCasePayload
  ): Promise<TestCaseAdminRecord> => {
    const { data } = await apiClient.post<ApiWrapper<TestCaseAdminRecord>>(
      `/questions/${questionId}/test-cases`,
      payload
    );
    return data.data;
  },

  bulkUploadTestCases: async (
    questionId: string,
    file: File
  ): Promise<TestCaseBulkUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiWrapper<TestCaseBulkUploadResult>>(
      `/questions/${questionId}/test-cases/bulk`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  // Note the URL shape: NOT nested under /questions/{questionId}/ like the three
  // calls above — this one endpoint lives at /api/test-cases/{id} on the backend
  // (Module 5 backend plan, Section 4 — a deliberate second controller). Easy to
  // get wrong if you pattern-match the other three calls without checking.
  deleteTestCase: async (testCaseId: string): Promise<void> => {
    await apiClient.delete(`/test-cases/${testCaseId}`);
  },
};
```

---

## 8. Hooks

**File:** `src/hooks/useTestCases.ts`

```typescript
export const testCaseKeys = {
  all: (questionId: string) => ['testCases', questionId] as const,
};

export const useTestCases = (questionId: string) =>
  useQuery({
    queryKey: testCaseKeys.all(questionId),
    queryFn: () => testCaseApi.getTestCases(questionId),
    enabled: !!questionId,
  });

export const useCreateTestCase = (contestId: string, questionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTestCasePayload) =>
      testCaseApi.createTestCase(questionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(questionId) });
      // Test cases are embedded inside QuestionAdminResponse/QuestionCandidateResponse
      // (backend Section 8), so the question detail AND the question list for this
      // contest both now hold stale data — invalidate both, not just testCaseKeys.
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(contestId, questionId) });
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      toast.success('Test case added');
    },
  });
};

export const useDeleteTestCase = (contestId: string, questionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testCaseId: string) => testCaseApi.deleteTestCase(testCaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(questionId) });
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(contestId, questionId) });
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      toast.success('Test case deleted');
    },
  });
};

export const useBulkUploadTestCases = (contestId: string, questionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => testCaseApi.bulkUploadTestCases(questionId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(questionId) });
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(contestId, questionId) });
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      // No success toast here — TestCaseBulkUploadResultReport already gives a
      // detailed per-row outcome, same reasoning Module 2 used for BulkImportResult.
    },
  });
};
```

**The three-way cache invalidation above is the one easy-to-miss detail in this whole module.** Every mutation that touches a test case must invalidate `testCaseKeys`, the specific question's detail query, *and* that contest's question list query — because the backend embeds test cases directly into both question DTOs. Invalidating only `testCaseKeys` will leave `TestCaseManagerPanel` correct but `QuestionDetailCard`'s summary and the Questions tab's list stale until a manual refresh.

---

## 9. Zod Schema

```typescript
// src/components/testcase/TestCaseForm.tsx

const testCaseSchema = z.object({
  input: z.string().min(1, 'Input is required'),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  isSample: z.boolean().default(false),
  weight: z
    .number({ required_error: 'Weight is required' })
    .min(0, 'Weight cannot be negative'),
});

type TestCaseFormData = z.infer<typeof testCaseSchema>;
```

---

## 10. Build Sequence

1. **Update `src/api/testCaseApi.ts`** — types and API functions. No UI yet.
2. **Update `src/api/questionApi.ts`** — fill in the two Module-5 placeholder fields (Section 7.1).
3. **Create `src/hooks/useTestCases.ts`** — all four hooks, with the three-way invalidation from Section 8.
4. **Create `TestCaseForm.tsx`** — validate it standalone with a hardcoded `onSubmit` before wiring to a real mutation.
5. **Create `CreateTestCaseDialog.tsx`** — wraps the form, wires `useCreateTestCase`.
6. **Create `TestCasePreviewDialog.tsx`** and `DeleteTestCaseDialog.tsx`.
7. **Create `TestCaseTable.tsx`** — wire it to real `useTestCases` data; verify Sample/Hidden chips and truncation before adding row actions.
8. **Create `TestCaseManagerPanel.tsx`** — header, table, empty state, "Add Test Case" and "Bulk Upload" buttons.
9. **Reconfigure `CsvUploadInput` for test cases** as `BulkUploadTestCasesDialog` — new headers, new Papa Parse validation rules, new template file. Do not copy `CsvUploadInput`'s source into a second component; import and reconfigure it.
10. **Create `TestCaseBulkUploadResultReport.tsx`**.
11. **Add the "Test Cases" tab to `QuestionEditPage`** — gate it so it only renders when a `questionId` exists (i.e., never on the Create route, which doesn't render this tab set at all).
12. **Extend `QuestionDetailCard.tsx`** — admin summary block and candidate sample-list block, branching on which record type it received.
13. **End-to-end test** (see Definition of Done below).

---

## 11. Role-Based UI Rules

| UI Element | Admin | Evaluator | Candidate |
|---|---|---|---|
| "Test Cases" tab on `QuestionEditPage` | ✅ Visible | N/A — route is Admin-only per Module 4, Evaluator never reaches this page | N/A — same |
| Add / Bulk Upload / Delete test case | ✅ Visible | — | — |
| `QuestionDetailCard` admin summary block | ✅ Shown (wherever the card is used) | ✅ Shown | ❌ Not shown |
| `QuestionDetailCard` sample test case list | ❌ Not shown | ❌ Not shown | ✅ Shown (input only, no expected output) |

Evaluators get no dedicated test-case UI in this module — their read access to full test-case data (per the backend's security rules) surfaces later, through submission detail views in Module 9, not through a management screen here.

---

## 12. Definition of Done

- [ ] `QuestionEditPage` shows a "Details" / "Test Cases" tab pair; `QuestionCreatePage` shows no such tabs
- [ ] Admin can add a test case (sample or hidden) and see it appear in `TestCaseTable` immediately
- [ ] `TestCaseTable` shows correct Sample/Hidden chips and a truncated input/output preview
- [ ] Clicking a table row (outside the delete action) opens `TestCasePreviewDialog` with the full text
- [ ] There is no Edit action anywhere on a test case — only Add and Delete
- [ ] Deleting a test case asks for confirmation and removes it from the table without a manual refresh
- [ ] Bulk CSV upload shows a client-side row-count/error preview before the admin confirms
- [ ] After bulk upload, a per-row success/failure report is visible on screen, not just a toast
- [ ] Creating, deleting, or bulk-uploading a test case correctly refreshes `QuestionDetailCard`'s summary and the Questions tab list, with no stale count until manual refresh (verifies the three-way cache invalidation in Section 8)
- [ ] A Candidate viewing `QuestionDetailCard` on an `ONGOING`, assigned contest sees a "Sample Test Cases" section with inputs only — confirmed no `expectedOutput` or `weight` key anywhere in the rendered data, not just visually absent
- [ ] An Admin/Evaluator viewing `QuestionDetailCard` sees the test case count summary, including hidden cases
- [ ] No TypeScript errors (`npm run build` passes)

---

## 13. Things to Watch Out For

| Pitfall | What to do |
|---|---|
| Building a new dropzone instead of reusing `CsvUploadInput` | Check Module 2's component before writing any `react-dropzone` code — the whole point of Section 6.2's `BulkUploadTestCasesDialog` note is that this is a reconfiguration, not a new build |
| Adding an Edit button "for convenience" | There's no backend endpoint for it (Section 4.1). An Edit button that silently 404s or has to fake it via delete+recreate behind the scenes is worse than not having one — surface the limitation in the UI instead (the `TestCaseForm` footer note) |
| Only invalidating `testCaseKeys` after a mutation | Leaves `QuestionDetailCard` and the Questions tab showing a stale test-case count — see the three-way invalidation note in Section 8 |
| Rendering `weight` anywhere in a candidate-facing view | `TestCaseSampleRecord` shouldn't even have the field, but double-check any component that destructures a union type (`TestCaseAdminRecord | TestCaseSampleRecord`) isn't accidentally reading `.weight` off a value that's actually a sample record at runtime |
| Showing the "Test Cases" tab on `QuestionCreatePage` | Guard on `questionId` existing, not just on the route name — a copy-pasted tab config is an easy way to leak this in |

---

## 14. Future Enhancements (carried over / new)

- A `PUT /api/test-cases/{id}` endpoint and matching Edit UI, if delete-and-recreate proves annoying in real use (Section 4.1)
- Live "weights sum to N%" feedback in `TestCaseForm`/`TestCaseManagerPanel` once `ScoringService` (Module 8) settles on a normalization model (Section 4.3, and the backend plan's own Future Enhancements)
- Zip-of-file-pairs bulk upload for large I/O, alongside the CSV path
- Drag-and-drop reordering of test cases (mirroring `QuestionCard`'s `@hello-pangea/dnd` reordering from Module 4) — not built now since `order_index` has no unique constraint or functional consequence beyond display order (backend plan, Section 2.4)
