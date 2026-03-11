# Spreadsheet Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a spreadsheet-capable core layer (formulas, autofill, history, workbook sheets, formatting, merged cells) on top of the existing grid engine with deterministic behavior and test coverage.

**Architecture:** Keep `packages/core/src/grid-engine.ts` focused on grid orchestration and add a new `packages/core/src/spreadsheet/` module tree for feature logic. Integrate only through explicit APIs on `GridInstance` and pure utility modules so behavior stays testable without React. Implement features in small, additive slices with TDD and backwards-compatible defaults.

**Tech Stack:** TypeScript, Vitest, existing `@zell/grid-core` architecture.

---

## Chunk 1: Spreadsheet core primitives and engine integration

### Task 1: Introduce spreadsheet domain types and workbook model

**Files:**
- Create: `packages/core/src/spreadsheet/types.ts`
- Create: `packages/core/src/spreadsheet/workbook.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/grid-engine.ts`
- Test: `packages/core/src/__tests__/workbook.test.ts`

- [ ] **Step 1: Write failing workbook tests**

```ts
import { describe, expect, it } from 'vitest';
import { createWorkbook } from '../spreadsheet/workbook';

describe('createWorkbook', () => {
  it('creates a default sheet and exposes active sheet getters', () => {
    const workbook = createWorkbook();
    expect(workbook.getActiveSheet().name).toBe('Sheet1');
    expect(workbook.getSheets()).toHaveLength(1);
  });

  it('adds and activates sheets predictably', () => {
    const workbook = createWorkbook();
    const id = workbook.addSheet('Plan');
    workbook.setActiveSheet(id);
    expect(workbook.getActiveSheet().name).toBe('Plan');
  });
});
```

- [ ] **Step 2: Run targeted test and verify it fails**

Run: `bun run vitest run packages/core/src/__tests__/workbook.test.ts`
Expected: FAIL with missing workbook/types exports.

- [ ] **Step 3: Implement minimal workbook/types module**

Implement:
- `SpreadsheetCell`, `SheetModel`, `WorkbookModel`, `SheetId` types.
- `createWorkbook()` with `getSheets`, `getActiveSheet`, `addSheet`, `setActiveSheet`, `removeSheet`.
- Grid sheet-scoped APIs on `GridInstance`: `addSheet`, `setActiveSheet`, `getActiveSheet`, `getSheets`, `removeSheet`.
- Route `getCell`/`setCell` through the active sheet data source.
- Export new types from `packages/core/src/types.ts` and `packages/core/src/index.ts`.

- [ ] **Step 4: Re-run workbook tests**

Run: `bun run vitest run packages/core/src/__tests__/workbook.test.ts`
Expected: PASS.


### Task 2: Add formula parser and evaluator utilities

**Files:**
- Create: `packages/core/src/spreadsheet/formula-parser.ts`
- Create: `packages/core/src/spreadsheet/formula-evaluator.ts`
- Modify: `packages/core/src/spreadsheet/types.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/__tests__/formula-evaluator.test.ts`

- [ ] **Step 1: Write failing formula tests**

Cover:
- binary expression: `=A1+B1`
- range function: `=SUM(A1:A3)`
- average function: `=AVG(B1:B3)`
- dependency extraction (references parsed from expression)

- [ ] **Step 2: Run targeted test and verify it fails**

Run: `bun run vitest run packages/core/src/__tests__/formula-evaluator.test.ts`
Expected: FAIL with missing parser/evaluator.

- [ ] **Step 3: Implement parser/evaluator minimally**

Implement:
- Cell address parse/format helpers (`A1` <-> row/col).
- Expression tokenizer for `+ - * /`, refs, numeric literals, `SUM`, `AVG`.
- Evaluator that resolves references via callback and supports range aggregation.
- Dependency collector function returning referenced cells.

- [ ] **Step 4: Re-run targeted tests**

Run: `bun run vitest run packages/core/src/__tests__/formula-evaluator.test.ts`
Expected: PASS.


### Task 3: Integrate formula recalculation in grid edits

**Files:**
- Create: `packages/core/src/spreadsheet/formula-engine.ts`
- Modify: `packages/core/src/grid-engine.ts`
- Modify: `packages/core/src/types.ts`
- Test: `packages/core/src/__tests__/formula-engine.test.ts`

- [ ] **Step 1: Write failing integration tests**

Cover:
- setting `=A1+B1` in a cell updates computed value.
- editing dependency cell recalculates dependent formula cell.
- circular dependency throws deterministic error.
- dependencies stay isolated per active sheet.

- [ ] **Step 2: Run targeted tests and verify failure**

Run: `bun run vitest run packages/core/src/__tests__/formula-engine.test.ts`
Expected: FAIL due missing formula integration.

- [ ] **Step 3: Implement formula engine and connect to `setCell` path**

Implement:
- Per-sheet dependency graph map.
- Formula storage (raw formula + computed value).
- Topological recalculation from edited cell.
- Grid API methods: `setFormula`, `getFormula`, `recalculate`.

- [ ] **Step 4: Re-run formula tests**

Run: `bun run vitest run packages/core/src/__tests__/formula-engine.test.ts`
Expected: PASS.


### Task 4: Add undo/redo history stack for edit and paste operations

**Files:**
- Create: `packages/core/src/spreadsheet/history.ts`
- Modify: `packages/core/src/grid-engine.ts`
- Modify: `packages/core/src/types.ts`
- Test: `packages/core/src/__tests__/history.test.ts`

- [ ] **Step 1: Write failing history tests**

Cover:
- single cell edit undo/redo.
- paste operation undo/redo restoring previous range.
- stack truncation on new edit after undo.
- `insertRows` operation undo/redo with row count restoration.

- [ ] **Step 2: Run targeted tests and verify failure**

Run: `bun run vitest run packages/core/src/__tests__/history.test.ts`
Expected: FAIL because history API is missing.

- [ ] **Step 3: Implement operation history and grid bindings**

Implement:
- bounded undo/redo stacks.
- operation payloads for `edit`, `paste`, and concrete `insertRows` operations.
- Grid API methods: `undo`, `redo`, `canUndo`, `canRedo`.

- [ ] **Step 4: Re-run targeted history tests**

Run: `bun run vitest run packages/core/src/__tests__/history.test.ts`
Expected: PASS.


### Task 5: Add autofill pattern generation and apply API

**Files:**
- Create: `packages/core/src/spreadsheet/autofill.ts`
- Modify: `packages/core/src/grid-engine.ts`
- Modify: `packages/core/src/types.ts`
- Test: `packages/core/src/__tests__/autofill.test.ts`

- [ ] **Step 1: Write failing autofill tests**

Cover:
- linear numeric series (`1,2,3` -> `4,5`).
- copy pattern for non-numeric values.
- vertical and horizontal fill ranges.

- [ ] **Step 2: Run targeted tests and verify failure**

Run: `bun run vitest run packages/core/src/__tests__/autofill.test.ts`
Expected: FAIL due missing autofill module/API.

- [ ] **Step 3: Implement autofill generator and grid method**

Implement:
- source range extraction helper.
- numeric delta detection for arithmetic sequences.
- fallback repeat copy for text/date/boolean.
- Grid API method: `autofill(sourceRange, targetRange)`.

- [ ] **Step 4: Re-run targeted autofill tests**

Run: `bun run vitest run packages/core/src/__tests__/autofill.test.ts`
Expected: PASS.


### Task 6: Cell formatting and merged-cell state support

**Files:**
- Create: `packages/core/src/spreadsheet/formatting.ts`
- Create: `packages/core/src/spreadsheet/merged-cells.ts`
- Modify: `packages/core/src/grid-engine.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/__tests__/formatting.test.ts`
- Test: `packages/core/src/__tests__/merged-cells.test.ts`

- [ ] **Step 1: Write failing formatting/merge tests**

Cover:
- `currency`, `percentage`, `date`, and custom formatter behavior.
- merge stores canonical top-left owner and rejects overlapping merges.
- unmerge removes region and exposes normal addressing.

- [ ] **Step 2: Run targeted tests and verify failure**

Run: `bun run vitest run packages/core/src/__tests__/formatting.test.ts packages/core/src/__tests__/merged-cells.test.ts`
Expected: FAIL due missing modules/apis.

- [ ] **Step 3: Implement formatting + merged cells and wire to grid APIs**

Implement:
- `formatCellValue` and reusable format descriptors.
- merge registry with `merge`, `unmerge`, `isMerged`, `getMergeRoot`.
- Grid API methods: `setCellFormat`, `getCellFormat`, `formatCell`, `mergeCells`, `unmergeCells`.

- [ ] **Step 4: Re-run targeted tests**

Run: `bun run vitest run packages/core/src/__tests__/formatting.test.ts packages/core/src/__tests__/merged-cells.test.ts`
Expected: PASS.


### Task 7: Full regression verification and docs update

**Files:**
- Modify: `README.md`
- Modify: `packages/core/src/__tests__/performance.test.ts`
- Create: `packages/core/src/__tests__/spreadsheet-e2e.test.ts`
- Test: `packages/core/src/__tests__/*.test.ts`

- [ ] **Step 1: Add concise spreadsheet API section to README**

Document:
- formula methods
- workbook/multi-sheet methods
- undo/redo
- autofill
- formatting
- merged cells

- [ ] **Step 2: Run full automated verification**

Run: `bun run test && bun run typecheck && bun run build`
Expected: PASS with no new failures.

- [ ] **Step 3: Final smoke verification for formula performance target**

Run: `bun run vitest run packages/core/src/__tests__/performance.test.ts packages/core/src/__tests__/formula-engine.test.ts`
Expected: PASS and formula recalculation test completes quickly (<50ms assertion in test).

- [ ] **Step 4: Cross-feature spreadsheet behavior verification**

Run: `bun run vitest run packages/core/src/__tests__/spreadsheet-e2e.test.ts`
Expected: PASS for scenario combining sheet switching, formulas, autofill, undo/redo, formatting, merge/unmerge.
