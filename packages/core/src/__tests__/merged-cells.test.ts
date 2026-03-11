import { describe, expect, it } from 'vitest';
import { createGrid } from '../grid-engine';
import { createMergeRegistry } from '../spreadsheet/merged-cells';

describe('Merged cells integration', () => {
  it('stores canonical top-left owner for merged regions', () => {
    const registry = createMergeRegistry();

    registry.merge({
      start: { row: 2, col: 1 },
      end: { row: 3, col: 2 }
    });

    expect(registry.getMergeRoot(2, 1)).toEqual({ row: 2, col: 1 });
    expect(registry.getMergeRoot(2, 2)).toEqual({ row: 2, col: 1 });
    expect(registry.getMergeRoot(3, 2)).toEqual({ row: 2, col: 1 });
  });

  it('rejects overlapping merged ranges', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      data: [
        ['r1c1', 'r1c2', 'r1c3'],
        ['r2c1', 'r2c2', 'r2c3'],
        ['r3c1', 'r3c2', 'r3c3']
      ]
    });

    grid.mergeCells({
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 }
    });

    expect(() =>
      grid.mergeCells({
        start: { row: 1, col: 1 },
        end: { row: 2, col: 2 }
      })
    ).toThrow('Cannot merge overlapping ranges');
  });

  it('unmerge removes the merged region', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }],
      data: [
        ['r1c1', 'r1c2'],
        ['r2c1', 'r2c2']
      ]
    });

    const mergedRange = {
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 }
    };

    grid.mergeCells(mergedRange);
    grid.unmergeCells(mergedRange);

    expect(() =>
      grid.mergeCells({
        start: { row: 0, col: 1 },
        end: { row: 1, col: 1 }
      })
    ).not.toThrow();
  });
});
