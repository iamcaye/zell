import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { createGrid } from '../grid-engine';

describe('grid performance', () => {
  it('keeps keyboard navigation well below the 16ms interaction budget on 100k rows', () => {
    const grid = createGrid({
      columns: [
        { id: 'company', kind: 'text' },
        { id: 'revenue', kind: 'number' },
        { id: 'active', kind: 'boolean' }
      ],
      data: Array.from({ length: 100_000 }, (_, index) => [`Company ${index}`, index, index % 2 === 0]),
      rowHeight: 32,
      overscan: 6
    });

    grid.setViewport(320, 0);
    grid.focusCell(0, 0);

    const iterations = 2_000;
    const start = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      grid.handleKeyDown('ArrowDown');
    }
    const duration = performance.now() - start;
    const average = duration / iterations;

    expect(average).toBeLessThan(0.5);
  });
});
