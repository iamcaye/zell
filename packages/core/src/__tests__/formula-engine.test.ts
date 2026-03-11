import { describe, expect, it } from 'vitest';
import { createGrid } from '../grid-engine';

describe('Formula engine integration', () => {
  it('sets =A1+B1 and updates computed value', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      data: [[0, 0, 0]]
    });

    grid.setCell(0, 0, 2);
    grid.setCell(0, 1, 3);
    grid.setFormula(0, 2, '=A1+B1');

    expect(grid.getFormula(0, 2)).toBe('=A1+B1');
    expect(grid.getCell(0, 2)).toBe(5);
  });

  it('recalculates dependent formulas when dependency changes', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      data: [[0, 0, 0]]
    });

    grid.setCell(0, 0, 1);
    grid.setCell(0, 1, 2);
    grid.setFormula(0, 2, '=A1+B1');

    expect(grid.getCell(0, 2)).toBe(3);

    grid.setCell(0, 0, 10);

    expect(grid.getCell(0, 2)).toBe(12);
  });

  it('throws deterministic error for circular dependencies', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }],
      data: [[0, 0]]
    });

    grid.setFormula(0, 0, '=B1+1');

    expect(() => grid.setFormula(0, 1, '=A1+1')).toThrow('Circular formula dependency at A1');
  });

  it('keeps formula dependencies isolated per active sheet', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      data: [[0, 0, 0]]
    });

    grid.setCell(0, 0, 5);
    grid.setCell(0, 1, 5);
    grid.setFormula(0, 2, '=A1+B1');

    const sheet2Id = grid.addSheet('Plan');
    grid.setActiveSheet(sheet2Id);
    grid.setCell(0, 0, 1);
    grid.setCell(0, 1, 2);
    grid.setFormula(0, 2, '=A1+B1');

    expect(grid.getCell(0, 2)).toBe(3);

    grid.setCell(0, 0, 9);
    expect(grid.getCell(0, 2)).toBe(11);

    const firstSheetId = grid.getSheets()[0]?.id;
    if (!firstSheetId) {
      throw new Error('Expected first sheet to exist');
    }

    grid.setActiveSheet(firstSheetId);
    expect(grid.getCell(0, 2)).toBe(10);
  });

  it('recalculates all formulas on demand', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      data: [[0, 0, 0, 0]]
    });

    grid.setCell(0, 0, 7);
    grid.setCell(0, 1, 8);
    grid.setFormula(0, 2, '=A1+B1');
    grid.setFormula(0, 3, '=C1+1');

    expect(grid.getCell(0, 2)).toBe(15);
    expect(grid.getCell(0, 3)).toBe(16);

    grid.setCell(0, 0, 10);

    expect(grid.getCell(0, 2)).toBe(18);
    expect(grid.getCell(0, 3)).toBe(19);

    grid.recalculate();

    expect(grid.getCell(0, 2)).toBe(18);
    expect(grid.getCell(0, 3)).toBe(19);
  });

  it('clears formula on direct setCell so literal edits remain stable', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      data: [[0, 0, 0, 0]]
    });

    grid.setCell(0, 0, 1);
    grid.setCell(0, 1, 2);
    grid.setFormula(0, 2, '=A1+B1');
    grid.setFormula(0, 3, '=C1+1');

    expect(grid.getCell(0, 2)).toBe(3);
    expect(grid.getCell(0, 3)).toBe(4);

    grid.setCell(0, 2, 100);

    expect(grid.getFormula(0, 2)).toBeUndefined();
    expect(grid.getCell(0, 2)).toBe(100);
    expect(grid.getCell(0, 3)).toBe(101);

    grid.setCell(0, 0, 9);
    grid.recalculate();

    expect(grid.getCell(0, 2)).toBe(100);
    expect(grid.getCell(0, 3)).toBe(101);
  });
});
