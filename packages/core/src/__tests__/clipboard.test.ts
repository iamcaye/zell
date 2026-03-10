import { describe, expect, it, vi } from 'vitest';
import { parseTsv, serializeRangeToTsv } from '../clipboard';
import { createGrid } from '../grid-engine';

describe('clipboard helpers', () => {
  it('serializes and parses TSV payloads', () => {
    const tsv = serializeRangeToTsv(
      {
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 }
      },
      (row, col) => [
        ['Ada', 32],
        ['Linus', 54]
      ][row]?.[col]
    );

    expect(tsv).toBe('Ada\t32\nLinus\t54');
    expect(parseTsv(tsv)).toEqual([
      ['Ada', '32'],
      ['Linus', '54']
    ]);
  });
});

describe('grid clipboard support', () => {
  it('copies the active selection as TSV', () => {
    const onCopy = vi.fn();
    const grid = createGrid({
      columns: [{ id: 'name' }, { id: 'age', kind: 'number' }],
      data: [
        ['Ada', 32],
        ['Linus', 54]
      ],
      events: {
        copy: onCopy
      }
    });

    grid.select({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } });
    const text = grid.copySelection();
    expect(text).toBe('Ada\t32\nLinus\t54');
    expect(onCopy).toHaveBeenCalledWith({
      range: {
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 }
      },
      raw: text
    });
  });

  it('pastes TSV data into the grid and updates selection', () => {
    const onPaste = vi.fn();
    const grid = createGrid({
      columns: [{ id: 'name', kind: 'text' }, { id: 'age', kind: 'number' }],
      data: [
        ['Ada', 32],
        ['Linus', 54]
      ],
      events: {
        paste: onPaste
      }
    });

    const range = grid.pasteText('Grace\t55', { row: 1, col: 0 });
    expect(range).toEqual({
      start: { row: 1, col: 0 },
      end: { row: 1, col: 1 }
    });
    expect(grid.getCell(1, 0)).toBe('Grace');
    expect(grid.getCell(1, 1)).toBe(55);
    expect(grid.getState().selection?.range).toEqual(range);
    expect(onPaste).toHaveBeenCalled();
  });
});
