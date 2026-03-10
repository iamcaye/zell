import { createSelectionModel, normalizeRange } from './range';
import type { CellCoord, CellRange, SelectionModel } from './types';

export function createRangeFromCells(anchor: CellCoord, focus: CellCoord): CellRange {
  return {
    start: anchor,
    end: focus
  };
}

export function extendSelection(anchor: CellCoord, focus: CellCoord, rowCount: number, columnCount: number): SelectionModel {
  const range = normalizeRange(createRangeFromCells(anchor, focus), rowCount, columnCount);
  return createSelectionModel(range, anchor, focus);
}
