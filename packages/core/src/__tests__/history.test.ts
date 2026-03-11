import { describe, expect, it } from 'vitest';
import { createGrid } from '../grid-engine';

describe('History integration', () => {
  it('supports single cell edit undo/redo', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }],
      data: [['before']]
    });

    grid.setCell(0, 0, 'after');
    expect(grid.getCell(0, 0)).toBe('after');
    expect(grid.canUndo()).toBe(true);

    grid.undo();
    expect(grid.getCell(0, 0)).toBe('before');
    expect(grid.canRedo()).toBe(true);

    grid.redo();
    expect(grid.getCell(0, 0)).toBe('after');
  });

  it('supports paste undo/redo restoring previous range', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }],
      data: [
        ['a1', 'b1'],
        ['a2', 'b2']
      ]
    });

    grid.pasteText('x\ty\nz\tw', { row: 0, col: 0 });
    expect(grid.getCell(0, 0)).toBe('x');
    expect(grid.getCell(0, 1)).toBe('y');
    expect(grid.getCell(1, 0)).toBe('z');
    expect(grid.getCell(1, 1)).toBe('w');

    grid.undo();
    expect(grid.getCell(0, 0)).toBe('a1');
    expect(grid.getCell(0, 1)).toBe('b1');
    expect(grid.getCell(1, 0)).toBe('a2');
    expect(grid.getCell(1, 1)).toBe('b2');

    grid.redo();
    expect(grid.getCell(0, 0)).toBe('x');
    expect(grid.getCell(0, 1)).toBe('y');
    expect(grid.getCell(1, 0)).toBe('z');
    expect(grid.getCell(1, 1)).toBe('w');
  });

  it('truncates redo stack after undo then new edit', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }],
      data: [['one']]
    });

    grid.setCell(0, 0, 'two');
    grid.setCell(0, 0, 'three');
    grid.undo();

    expect(grid.getCell(0, 0)).toBe('two');
    expect(grid.canRedo()).toBe(true);

    grid.setCell(0, 0, 'new');
    expect(grid.canRedo()).toBe(false);

    grid.undo();
    expect(grid.getCell(0, 0)).toBe('two');

    grid.redo();
    expect(grid.getCell(0, 0)).toBe('new');
  });

  it('supports insertRows undo/redo with row count restoration', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }],
      data: [['r1'], ['r2']]
    });

    expect(grid.getState().rowCount).toBe(2);

    grid.insertRows(1, 2);
    expect(grid.getState().rowCount).toBe(4);

    grid.undo();
    expect(grid.getState().rowCount).toBe(2);

    grid.redo();
    expect(grid.getState().rowCount).toBe(4);
  });
});
