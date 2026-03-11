import { describe, expect, it } from 'vitest';
import { createGrid } from '../grid-engine';

describe('Autofill integration', () => {
  it('extends linear numeric series 1,2,3 into 4,5', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }],
      data: [[1, 2, 3, null, null]]
    });

    grid.autofill(
      {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 2 }
      },
      {
        start: { row: 0, col: 3 },
        end: { row: 0, col: 4 }
      }
    );

    expect(grid.getCell(0, 3)).toBe(4);
    expect(grid.getCell(0, 4)).toBe(5);
  });

  it('falls back to copy pattern for non-numeric values', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }],
      data: [['Q1', 'Q2', null, null, null, null]]
    });

    grid.autofill(
      {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 1 }
      },
      {
        start: { row: 0, col: 2 },
        end: { row: 0, col: 5 }
      }
    );

    expect(grid.getCell(0, 2)).toBe('Q1');
    expect(grid.getCell(0, 3)).toBe('Q2');
    expect(grid.getCell(0, 4)).toBe('Q1');
    expect(grid.getCell(0, 5)).toBe('Q2');
  });

  it('fills both vertical and horizontal target ranges', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      data: [
        [1, 10, null, null],
        [2, null, null, null],
        [3, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
      ]
    });

    grid.autofill(
      {
        start: { row: 0, col: 0 },
        end: { row: 2, col: 0 }
      },
      {
        start: { row: 3, col: 0 },
        end: { row: 4, col: 0 }
      }
    );

    grid.autofill(
      {
        start: { row: 0, col: 1 },
        end: { row: 0, col: 1 }
      },
      {
        start: { row: 0, col: 2 },
        end: { row: 0, col: 3 }
      }
    );

    expect(grid.getCell(3, 0)).toBe(4);
    expect(grid.getCell(4, 0)).toBe(5);
    expect(grid.getCell(0, 2)).toBe(10);
    expect(grid.getCell(0, 3)).toBe(10);
  });

  it('records autofill as a single undoable history operation', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }],
      data: [[1, 2, 3, null, null]]
    });

    grid.autofill(
      {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 2 }
      },
      {
        start: { row: 0, col: 3 },
        end: { row: 0, col: 4 }
      }
    );

    expect(grid.getCell(0, 3)).toBe(4);
    expect(grid.getCell(0, 4)).toBe(5);
    expect(grid.canUndo()).toBe(true);

    grid.undo();
    expect(grid.getCell(0, 3)).toBeNull();
    expect(grid.getCell(0, 4)).toBeNull();
    expect(grid.canRedo()).toBe(true);

    grid.redo();
    expect(grid.getCell(0, 3)).toBe(4);
    expect(grid.getCell(0, 4)).toBe(5);
  });

  it('preserves source cells when target range overlaps source', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }],
      data: [[1, 2, 3, null, null]]
    });

    grid.autofill(
      {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 2 }
      },
      {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 4 }
      }
    );

    expect(grid.getCell(0, 0)).toBe(1);
    expect(grid.getCell(0, 1)).toBe(2);
    expect(grid.getCell(0, 2)).toBe(3);
    expect(grid.getCell(0, 3)).toBe(4);
    expect(grid.getCell(0, 4)).toBe(5);
  });
});
