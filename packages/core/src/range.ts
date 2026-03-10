import type { CellCoord, CellRange, SelectionModel } from './types';

export function clampIndex(index: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), max - 1);
}

export function normalizeCell(row: number, col: number, rowCount: number, columnCount: number): CellCoord {
  return {
    row: clampIndex(row, rowCount),
    col: clampIndex(col, columnCount)
  };
}

export function normalizeRange(range: CellRange, rowCount: number, columnCount: number): CellRange {
  const start = normalizeCell(range.start.row, range.start.col, rowCount, columnCount);
  const end = normalizeCell(range.end.row, range.end.col, rowCount, columnCount);

  return {
    start: {
      row: Math.min(start.row, end.row),
      col: Math.min(start.col, end.col)
    },
    end: {
      row: Math.max(start.row, end.row),
      col: Math.max(start.col, end.col)
    }
  };
}

export function createSelectionModel(range: CellRange): SelectionModel {
  return {
    kind: range.start.row === range.end.row && range.start.col === range.end.col ? 'cell' : 'range',
    anchor: range.start,
    focus: range.end,
    range
  };
}
