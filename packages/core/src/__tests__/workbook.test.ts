import { describe, expect, it } from 'vitest';
import { createGrid } from '../grid-engine';
import { createWorkbook } from '../spreadsheet/workbook';

describe('createWorkbook', () => {
  it('creates a default sheet and exposes active sheet getters', () => {
    const workbook = createWorkbook();

    expect(workbook.getActiveSheet().name).toBe('Sheet1');
    expect(workbook.getSheets()).toHaveLength(1);
  });

  it('adds and activates sheets predictably', () => {
    const workbook = createWorkbook();
    const id = workbook.addSheet('Plan');

    workbook.setActiveSheet(id);
    expect(workbook.getActiveSheet().name).toBe('Plan');
  });

  it('removes sheets while preserving a valid active sheet', () => {
    const workbook = createWorkbook();
    const id = workbook.addSheet('Plan');

    workbook.setActiveSheet(id);
    workbook.removeSheet(id);

    expect(workbook.getSheets()).toHaveLength(1);
    expect(workbook.getActiveSheet().name).toBe('Sheet1');
  });

  it('returns defensive sheet snapshots from getters', () => {
    const workbook = createWorkbook();
    const activeSheet = workbook.getActiveSheet() as { id: string; name: string };
    const firstSheet = workbook.getSheets()[0];
    expect(firstSheet).toBeDefined();
    if (!firstSheet) {
      throw new Error('Expected first sheet to exist');
    }
    const mutableFirstSheet = firstSheet as { id: string; name: string };

    activeSheet.name = 'Mutated';
    mutableFirstSheet.name = 'Mutated Again';

    expect(workbook.getActiveSheet().name).toBe('Sheet1');
    expect(workbook.getSheets()[0]?.name).toBe('Sheet1');
  });
});

describe('Grid workbook integration', () => {
  it('routes getCell and setCell through the active sheet', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }],
      data: [[null]]
    });

    grid.setCell(0, 0, 'Sheet1 value');
    const sheet2 = grid.addSheet('Plan');

    grid.setActiveSheet(sheet2);
    expect(grid.getActiveSheet().name).toBe('Plan');
    expect(grid.getCell(0, 0)).toBeUndefined();

    grid.setCell(0, 0, 'Sheet2 value');
    expect(grid.getCell(0, 0)).toBe('Sheet2 value');

    const firstSheet = grid.getSheets()[0];
    expect(firstSheet).toBeDefined();
    if (!firstSheet) {
      throw new Error('Expected first sheet to exist');
    }

    grid.setActiveSheet(firstSheet.id);
    expect(grid.getCell(0, 0)).toBe('Sheet1 value');
  });

  it('keeps empty sheet row count when adding sheets', () => {
    const grid = createGrid({
      columns: [{ id: 'a' }],
      data: []
    });

    expect(grid.getState().rowCount).toBe(0);
    const sheetId = grid.addSheet('Plan');
    grid.setActiveSheet(sheetId);

    expect(grid.getState().rowCount).toBe(0);
    expect(grid.getCell(0, 0)).toBeUndefined();
  });
});
