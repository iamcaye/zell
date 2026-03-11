import { describe, expect, it } from 'vitest';
import { createGrid } from '../grid-engine';
import type { CellValue } from '../types';

describe('Cell formatting integration', () => {
  it('formats currency values', () => {
    const grid = createGrid({
      columns: [{ id: 'amount' }],
      data: [[1234.5]]
    });

    grid.setCellFormat(0, 0, { type: 'currency', currency: 'USD' });

    expect(grid.getCellFormat(0, 0)).toEqual({ type: 'currency', currency: 'USD' });
    expect(grid.formatCell(0, 0)).toBe('$1,234.50');
  });

  it('formats percentage values', () => {
    const grid = createGrid({
      columns: [{ id: 'ratio' }],
      data: [[0.125]]
    });

    grid.setCellFormat(0, 0, { type: 'percentage', decimals: 1 });

    expect(grid.formatCell(0, 0)).toBe('12.5%');
  });

  it('formats date values', () => {
    const grid = createGrid({
      columns: [{ id: 'date' }],
      data: [[new Date('2024-02-01T00:00:00.000Z')]]
    });

    grid.setCellFormat(0, 0, { type: 'date' });

    expect(grid.formatCell(0, 0)).toBe('2024-02-01');
  });

  it('supports custom formatting', () => {
    const grid = createGrid({
      columns: [{ id: 'score' }],
      data: [[42]]
    });

    grid.setCellFormat(0, 0, {
      type: 'custom',
      formatter: (value: CellValue) => `score:${String(value)}`
    });

    expect(grid.formatCell(0, 0)).toBe('score:42');
  });
});
