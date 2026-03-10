import { describe, expect, it } from 'vitest';
import { extendSelection } from '../selection';
import { createGrid } from '../grid-engine';

describe('extendSelection', () => {
  it('builds a normalized rectangular selection from anchor and focus', () => {
    const selection = extendSelection({ row: 4, col: 3 }, { row: 1, col: 1 }, 10, 5);
    expect(selection.range).toEqual({
      start: { row: 1, col: 1 },
      end: { row: 4, col: 3 }
    });
    expect(selection.anchor).toEqual({ row: 4, col: 3 });
    expect(selection.focus).toEqual({ row: 1, col: 1 });
  });
});

describe('grid selection model', () => {
  it('supports cell, range, and clear selection flows', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      data: Array.from({ length: 20 }, (_, index) => [index, index + 1, index + 2])
    });

    grid.selectCell(2, 1);
    expect(grid.getState().selection?.kind).toBe('cell');

    grid.extendSelection(4, 2);
    expect(grid.getState().selection?.kind).toBe('range');
    expect(grid.getState().selection?.range).toEqual({
      start: { row: 2, col: 1 },
      end: { row: 4, col: 2 }
    });

    grid.clearSelection();
    expect(grid.getState().selection).toBeNull();
  });

  it('extends the active selection with shift navigation', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      data: Array.from({ length: 20 }, (_, index) => [index, index + 1, index + 2]),
      rowHeight: 20
    });

    grid.selectCell(1, 1);
    grid.handleKeyDown('ArrowRight', { shiftKey: true });
    grid.handleKeyDown('ArrowDown', { shiftKey: true });

    expect(grid.getState().selection?.range).toEqual({
      start: { row: 1, col: 1 },
      end: { row: 2, col: 2 }
    });
  });
});
