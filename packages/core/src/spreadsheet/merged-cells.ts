import type { CellCoord, CellRange } from '../types';

export interface MergeRegistry {
  merge(range: CellRange): void;
  unmerge(range: CellRange): void;
  isMerged(row: number, col: number): boolean;
  getMergeRoot(row: number, col: number): CellCoord | undefined;
}

function toCellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function fromCellKey(key: string): CellCoord {
  const [rowPart, colPart] = key.split(':');
  const row = Number.parseInt(rowPart ?? '0', 10);
  const col = Number.parseInt(colPart ?? '0', 10);
  return { row, col };
}

function normalizeCellRange(range: CellRange): CellRange {
  return {
    start: {
      row: Math.min(range.start.row, range.end.row),
      col: Math.min(range.start.col, range.end.col)
    },
    end: {
      row: Math.max(range.start.row, range.end.row),
      col: Math.max(range.start.col, range.end.col)
    }
  };
}

function forEachCellInRange(range: CellRange, callback: (row: number, col: number) => void) {
  for (let row = range.start.row; row <= range.end.row; row += 1) {
    for (let col = range.start.col; col <= range.end.col; col += 1) {
      callback(row, col);
    }
  }
}

export function createMergeRegistry(): MergeRegistry {
  const rangesByRoot = new Map<string, CellRange>();
  const rootByCell = new Map<string, string>();

  const clearRoot = (rootKey: string) => {
    const range = rangesByRoot.get(rootKey);
    if (!range) {
      return;
    }

    forEachCellInRange(range, (row, col) => {
      rootByCell.delete(toCellKey(row, col));
    });
    rangesByRoot.delete(rootKey);
  };

  return {
    merge: (range) => {
      const normalizedRange = normalizeCellRange(range);

      forEachCellInRange(normalizedRange, (row, col) => {
        if (rootByCell.has(toCellKey(row, col))) {
          throw new Error('Cannot merge overlapping ranges');
        }
      });

      const rootKey = toCellKey(normalizedRange.start.row, normalizedRange.start.col);
      rangesByRoot.set(rootKey, normalizedRange);
      forEachCellInRange(normalizedRange, (row, col) => {
        rootByCell.set(toCellKey(row, col), rootKey);
      });
    },
    unmerge: (range) => {
      const normalizedRange = normalizeCellRange(range);
      const rootsToClear = new Set<string>();

      forEachCellInRange(normalizedRange, (row, col) => {
        const rootKey = rootByCell.get(toCellKey(row, col));
        if (rootKey) {
          rootsToClear.add(rootKey);
        }
      });

      for (const rootKey of rootsToClear) {
        clearRoot(rootKey);
      }
    },
    isMerged: (row, col) => rootByCell.has(toCellKey(row, col)),
    getMergeRoot: (row, col) => {
      const rootKey = rootByCell.get(toCellKey(row, col));
      if (!rootKey) {
        return undefined;
      }

      return fromCellKey(rootKey);
    }
  };
}
