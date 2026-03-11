import type { CellRange, CellValue } from '../types';

type FillDirection = 'horizontal' | 'vertical';

interface AutofillOptions {
  sourceRange: CellRange;
  targetRange: CellRange;
  getCell(row: number, col: number): CellValue;
}

interface ApplyAutofillOptions extends AutofillOptions {
  setCell(row: number, col: number, value: CellValue): void;
}

interface CellPosition {
  row: number;
  col: number;
}

export interface AutofillChange {
  row: number;
  col: number;
  value: CellValue;
}

function getDirection(sourceRange: CellRange, targetRange: CellRange): FillDirection {
  const sourceRowSpan = sourceRange.end.row - sourceRange.start.row + 1;
  const sourceColSpan = sourceRange.end.col - sourceRange.start.col + 1;
  const targetRowSpan = targetRange.end.row - targetRange.start.row + 1;
  const targetColSpan = targetRange.end.col - targetRange.start.col + 1;

  if (targetRowSpan === 1 && targetColSpan > 1) {
    return 'horizontal';
  }

  if (targetColSpan === 1 && targetRowSpan > 1) {
    return 'vertical';
  }

  if (sourceColSpan > sourceRowSpan) {
    return 'horizontal';
  }

  if (sourceRowSpan > sourceColSpan) {
    return 'vertical';
  }

  return 'horizontal';
}

function getCellsForDirection(range: CellRange, direction: FillDirection): CellPosition[] {
  const cells: CellPosition[] = [];

  if (direction === 'horizontal') {
    for (let row = range.start.row; row <= range.end.row; row += 1) {
      for (let col = range.start.col; col <= range.end.col; col += 1) {
        cells.push({ row, col });
      }
    }
    return cells;
  }

  for (let col = range.start.col; col <= range.end.col; col += 1) {
    for (let row = range.start.row; row <= range.end.row; row += 1) {
      cells.push({ row, col });
    }
  }

  return cells;
}

function getNumericDelta(values: CellValue[]): number | null {
  if (values.length < 2 || values.some((value) => typeof value !== 'number' || Number.isNaN(value))) {
    return null;
  }

  const numericValues = values as number[];
  const first = numericValues[0];
  const second = numericValues[1];
  if (first === undefined || second === undefined) {
    return null;
  }

  const delta = second - first;
  for (let index = 2; index < numericValues.length; index += 1) {
    const previous = numericValues[index - 1];
    const current = numericValues[index];
    if (previous === undefined || current === undefined) {
      return null;
    }

    if (current - previous !== delta) {
      return null;
    }
  }

  return delta;
}

function isWithinRange(cell: CellPosition, range: CellRange) {
  return (
    cell.row >= range.start.row &&
    cell.row <= range.end.row &&
    cell.col >= range.start.col &&
    cell.col <= range.end.col
  );
}

export function getAutofillChanges({ sourceRange, targetRange, getCell }: AutofillOptions): AutofillChange[] {
  const direction = getDirection(sourceRange, targetRange);
  const sourceCells = getCellsForDirection(sourceRange, direction);
  const targetCells = getCellsForDirection(targetRange, direction).filter(
    (cell) => !isWithinRange(cell, sourceRange)
  );

  if (sourceCells.length === 0 || targetCells.length === 0) {
    return [];
  }

  const sourceValues = sourceCells.map((cell) => getCell(cell.row, cell.col));
  const numericDelta = getNumericDelta(sourceValues);
  const changes: AutofillChange[] = [];

  if (numericDelta !== null) {
    const lastValue = sourceValues[sourceValues.length - 1] as number;
    for (let index = 0; index < targetCells.length; index += 1) {
      const cell = targetCells[index];
      if (!cell) {
        continue;
      }

      changes.push({
        row: cell.row,
        col: cell.col,
        value: lastValue + numericDelta * (index + 1)
      });
    }
    return changes;
  }

  for (let index = 0; index < targetCells.length; index += 1) {
    const cell = targetCells[index];
    if (!cell) {
      continue;
    }

    changes.push({
      row: cell.row,
      col: cell.col,
      value: sourceValues[index % sourceValues.length]
    });
  }

  return changes;
}

export function applyAutofill({ sourceRange, targetRange, getCell, setCell }: ApplyAutofillOptions) {
  const changes = getAutofillChanges({ sourceRange, targetRange, getCell });
  for (const change of changes) {
    setCell(change.row, change.col, change.value);
  }
}
