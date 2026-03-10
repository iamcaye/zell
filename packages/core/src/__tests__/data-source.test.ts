import { describe, expect, it } from 'vitest';
import { createDataSource } from '../data-source';
import type { ColumnDef } from '../types';

describe('createDataSource', () => {
  it('supports matrix data', () => {
    const data = [
      ['Ada', 32],
      ['Linus', 54]
    ];
    const source = createDataSource(data, [
      { id: 'name' },
      { id: 'age' }
    ]);

    expect(source.getRowCount()).toBe(2);
    expect(source.getCell(1, 0)).toBe('Linus');

    source.setCell?.(1, 1, 55);
    expect(source.getCell(1, 1)).toBe(55);
  });

  it('supports object rows with field accessors', () => {
    const rows = [
      { id: 'u1', name: 'Ada', active: true },
      { id: 'u2', name: 'Linus', active: false }
    ];
    const columns: Array<ColumnDef<(typeof rows)[number]>> = [
      { id: 'name', field: 'name' },
      { id: 'active', field: 'active' }
    ];
    const source = createDataSource(rows, columns);

    expect(source.getCell(0, 0)).toBe('Ada');
    source.setCell?.(1, 0, 'Linux');
    expect(rows[1]?.name).toBe('Linux');
  });

  it('passes through custom data sources', () => {
    const source = createDataSource(
      {
        getRowCount: () => 1,
        getCell: () => 'custom'
      },
      [{ id: 'name' }]
    );

    expect(source.getCell(0, 0)).toBe('custom');
  });
});
