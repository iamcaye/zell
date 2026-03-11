# Zell Grid Engine

Headless grid engine in TypeScript with a React adapter, typed public APIs, and a 100k-row demo.

## Workspace

- `packages/core`: headless grid instance, data sources, viewport math, selection, editing, and clipboard logic
- `packages/react`: React hook and virtualized grid component
- `apps/demo`: Vite demo with a 100k-row dataset
- `plans`: original product requirement documents

## Implemented MVP

- Vertical virtualization with configurable overscan
- Cell and rectangular range selection
- Keyboard navigation with spreadsheet-style bindings
- Inline editing for `text`, `number`, `date`, and `boolean`
- TSV copy/paste with typed coercion on commit
- Typed events for focus, selection, editing, copy, and paste
- React adapter with DOM integration for keyboard, mouse, and clipboard flows

## Core API

```ts
import { createGrid } from '@zell/grid-core';

const grid = createGrid({
  columns: [
    { id: 'name', kind: 'text' },
    { id: 'revenue', kind: 'number' }
  ],
  data: [
    ['Ada Ventures', 1200],
    ['Linus Labs', 980]
  ],
  rowHeight: 40,
  overscan: 6
});

grid.focusCell(0, 0);
grid.handleKeyDown('ArrowRight');
grid.startEdit(0, 1);
grid.updateEditDraft('1400');
grid.stopEdit();
```

## Spreadsheet API

`@zell/grid-core` now includes spreadsheet-focused methods on `GridInstance`:

- formulas: `setFormula(row, col, formula)`, `getFormula(row, col)`, `recalculate()`
- workbook sheets: `addSheet(name?)`, `setActiveSheet(sheetId)`, `getActiveSheet()`, `getSheets()`, `removeSheet(sheetId)`
- history: `undo()`, `redo()`, `canUndo()`, `canRedo()`
- autofill: `autofill(sourceRange, targetRange)`
- formatting: `setCellFormat(row, col, format)`, `getCellFormat(row, col)`, `formatCell(row, col)`
- merges: `mergeCells(range)`, `unmergeCells(range)`

## React API

```tsx
import { Grid } from '@zell/grid-react';

export function Example() {
  return (
    <Grid
      height={520}
      rowHeight={40}
      overscan={6}
      columns={[
        { id: 'company', header: 'Company', width: 220, kind: 'text' },
        { id: 'region', header: 'Region', width: 140, kind: 'text' },
        { id: 'revenue', header: 'Revenue', width: 140, kind: 'number' }
      ]}
      data={[
        ['Portfolio 00001', 'Madrid', 2500],
        ['Portfolio 00002', 'Berlin', 2517]
      ]}
    />
  );
}
```

## Commands

```bash
bun install
bun run test
bun run typecheck
bun run build
bun run dev
```

## Quality Gates

- `bun run test`: unit, integration, performance, and type assertions
- `bun run build`: bundles `core`, `react`, and the demo, then enforces the core bundle budget (`< 40kb` gzip)
- `react-doctor`: React adapter and demo validation pass

## Demo Interactions

- Click a cell to select it
- Drag across cells to extend the selection
- Use arrow keys, Tab, Enter, Home/End, and PageUp/PageDown to move focus
- Hold Shift while navigating to extend the selection
- Double-click or type to enter edit mode
- Copy and paste TSV directly inside the grid
