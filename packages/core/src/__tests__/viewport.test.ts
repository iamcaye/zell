import { describe, expect, it } from 'vitest';
import { calculateVirtualViewport } from '../viewport';
import { createGrid } from '../grid-engine';

describe('calculateVirtualViewport', () => {
  it('computes the visible rows with overscan', () => {
    const viewport = calculateVirtualViewport({
      rowCount: 100_000,
      rowHeight: 32,
      viewportHeight: 320,
      scrollTop: 32 * 50,
      overscan: 4
    });

    expect(viewport.rowStart).toBe(46);
    expect(viewport.rowEnd).toBe(64);
    expect(viewport.offsetTop).toBe(1472);
  });

  it('clamps near the end of the dataset', () => {
    const viewport = calculateVirtualViewport({
      rowCount: 10,
      rowHeight: 20,
      viewportHeight: 100,
      scrollTop: 999,
      overscan: 2
    });

    expect(viewport.rowStart).toBe(3);
    expect(viewport.rowEnd).toBe(10);
    expect(viewport.totalHeight).toBe(200);
  });
});

describe('grid viewport state', () => {
  it('updates viewport state on setViewport and scrollTo', () => {
    const grid = createGrid({
      columns: [{ id: 'name' }],
      data: Array.from({ length: 100 }, (_, index) => [`Row ${index}`]),
      rowHeight: 20,
      overscan: 2
    });

    const viewport = grid.setViewport(200, 400);
    expect(viewport.rowStart).toBe(18);
    expect(viewport.rowEnd).toBe(32);

    grid.scrollTo(30);
    expect(grid.getState().scrollTop).toBe(600);
    expect(grid.getState().viewport.rowStart).toBe(28);
  });
});
