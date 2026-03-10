import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createGrid } from '../grid-engine';
describe('createGrid', () => {
  it('creates a typed grid instance', () => {
    const rows = [{ id: '1', name: 'Ada' }];
    const grid = createGrid({
      columns: [{ id: 'name', field: 'name' }],
      data: rows
    });

    expect(grid.getCell(0, 0)).toBe('Ada');
    expect(grid.focusCell(0, 0)).toEqual({ row: 0, col: 0 });
    expect(grid.select({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }).kind).toBe('cell');
  });

  it('supports subscriptions and events', () => {
    const listener = vi.fn();
    const onFocus = vi.fn();
    const grid = createGrid({
      columns: [{ id: 'name' }],
      data: [['Ada']]
    });

    grid.subscribe(listener);
    grid.on('focusChange', onFocus);
    grid.focusCell(0, 0);

    expect(listener).toHaveBeenCalled();
    expect(onFocus).toHaveBeenCalledWith({ previous: null, current: { row: 0, col: 0 } });
  });

  it('exposes stable type contracts', () => {
    const grid = createGrid({
      columns: [{ id: 'name' }],
      data: [['Ada']]
    });

    expectTypeOf(grid.getCell).parameters.toEqualTypeOf<[number, number]>();
    expectTypeOf(grid.setCell).parameters.toEqualTypeOf<[number, number, string | number | boolean | Date | null | undefined]>();
    expectTypeOf(grid.getState().rowCount).toEqualTypeOf<number>();
  });
});
