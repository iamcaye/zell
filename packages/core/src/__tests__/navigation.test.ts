import { describe, expect, it } from 'vitest';
import { getNextCellFromKey } from '../navigation';
import { createGrid } from '../grid-engine';

describe('getNextCellFromKey', () => {
  it('moves within bounds', () => {
    expect(
      getNextCellFromKey({
        current: { row: 5, col: 3 },
        key: 'ArrowDown',
        rowCount: 10,
        columnCount: 5,
        pageSize: 4
      })
    ).toEqual({ row: 6, col: 3 });

    expect(
      getNextCellFromKey({
        current: { row: 5, col: 3 },
        key: 'Home',
        rowCount: 10,
        columnCount: 5,
        pageSize: 4
      })
    ).toEqual({ row: 5, col: 0 });
  });

  it('supports page navigation and shift modifiers', () => {
    expect(
      getNextCellFromKey({
        current: { row: 20, col: 1 },
        key: 'PageDown',
        rowCount: 100,
        columnCount: 5,
        pageSize: 10
      })
    ).toEqual({ row: 30, col: 1 });

    expect(
      getNextCellFromKey({
        current: { row: 2, col: 2 },
        key: 'Tab',
        rowCount: 10,
        columnCount: 5,
        pageSize: 4,
        shiftKey: true
      })
    ).toEqual({ row: 2, col: 1 });
  });
});

describe('grid keyboard navigation', () => {
  it('updates focus and scroll state via handleKeyDown', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      data: Array.from({ length: 100 }, (_, index) => [`Row ${index}`, index, index]),
      rowHeight: 20,
      overscan: 1
    });

    grid.setViewport(100, 0);
    grid.focusCell(0, 0);
    grid.handleKeyDown('PageDown');
    expect(grid.getState().focusedCell).toEqual({ row: 5, col: 0 });

    grid.handleKeyDown('End');
    expect(grid.getState().focusedCell).toEqual({ row: 5, col: 2 });

    grid.handleKeyDown('ArrowDown');
    expect(grid.getState().focusedCell).toEqual({ row: 6, col: 2 });
    expect(grid.getState().scrollTop).toBe(40);
  });
});
