import { describe, expect, it } from 'vitest';
import { createGrid } from '../grid-engine';

describe('Spreadsheet end-to-end behavior', () => {
  it('combines sheet switching, formulas, autofill, undo/redo, formatting, and merge flows', () => {
    const grid = createGrid({
      columns: [
        { id: 'a', kind: 'number' },
        { id: 'b', kind: 'number' },
        { id: 'c', kind: 'number' },
        { id: 'd', kind: 'number' },
        { id: 'e', kind: 'number' },
        { id: 'f', kind: 'number' }
      ],
      data: [
        [1, 2, 3, null, null, null],
        [null, null, null, null, null, null]
      ]
    });

    const firstSheetId = grid.getActiveSheet().id;

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
    expect(grid.undo()).toBe(true);
    expect(grid.getCell(0, 3)).toBeNull();
    expect(grid.getCell(0, 4)).toBeNull();

    expect(grid.canRedo()).toBe(true);
    expect(grid.redo()).toBe(true);
    expect(grid.getCell(0, 3)).toBe(4);
    expect(grid.getCell(0, 4)).toBe(5);

    grid.setFormula(0, 5, '=A1+E1');
    expect(grid.getFormula(0, 5)).toBe('=A1+E1');
    expect(grid.getCell(0, 5)).toBe(6);

    grid.setCellFormat(0, 5, { type: 'currency', currency: 'USD' });
    expect(grid.formatCell(0, 5)).toBe('$6.00');

    const mergedRange = {
      start: { row: 1, col: 0 },
      end: { row: 1, col: 1 }
    };

    grid.mergeCells(mergedRange);
    grid.setCell(1, 0, 99);
    expect(grid.getCell(1, 1)).toBe(99);

    grid.unmergeCells(mergedRange);
    grid.setCell(1, 1, 123);
    expect(grid.getCell(1, 0)).toBe(99);
    expect(grid.getCell(1, 1)).toBe(123);

    const planSheetId = grid.addSheet('Plan');
    grid.setActiveSheet(planSheetId);
    grid.setCell(0, 0, 10);
    grid.setCell(0, 1, 20);
    grid.setFormula(0, 2, '=A1+B1');

    expect(grid.getCell(0, 2)).toBe(30);

    grid.setActiveSheet(firstSheetId);
    expect(grid.getCell(0, 5)).toBe(6);
    expect(grid.formatCell(0, 5)).toBe('$6.00');
    expect(grid.getFormula(0, 5)).toBe('=A1+E1');
  });
});
