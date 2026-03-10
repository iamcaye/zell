import { describe, expect, it, vi } from 'vitest';
import { coerceValueByKind } from '../editing';
import { createGrid } from '../grid-engine';

describe('coerceValueByKind', () => {
  it('coerces base editor types', () => {
    expect(coerceValueByKind('number', '42')).toBe(42);
    expect(coerceValueByKind('boolean', 'true')).toBe(true);
    expect(coerceValueByKind('text', 42)).toBe('42');
    expect(coerceValueByKind('date', '2026-03-10') instanceof Date).toBe(true);
  });
});

describe('grid editing workflow', () => {
  it('commits and cancels edits through draft state', () => {
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    const grid = createGrid({
      columns: [{ id: 'name', kind: 'text' }, { id: 'age', kind: 'number' }],
      data: [['Ada', 32]],
      events: {
        cellEditCommit: onCommit,
        cellEditCancel: onCancel
      }
    });

    grid.startEdit(0, 1);
    grid.updateEditDraft('45');
    grid.stopEdit();
    expect(grid.getCell(0, 1)).toBe(45);
    expect(onCommit).toHaveBeenCalledWith({
      cell: { row: 0, col: 1 },
      previousValue: 32,
      value: 45
    });

    grid.startEdit(0, 0);
    grid.updateEditDraft('Grace');
    grid.stopEdit('cancel');
    expect(grid.getCell(0, 0)).toBe('Ada');
    expect(onCancel).toHaveBeenCalled();
  });

  it('starts editing from printable input', () => {
    const grid = createGrid({
      columns: [{ id: 'name', kind: 'text' }],
      data: [['Ada']]
    });

    grid.focusCell(0, 0);
    const session = grid.handleTextInput('Z');
    expect(session.draftValue).toBe('Z');

    grid.stopEdit();
    expect(grid.getCell(0, 0)).toBe('Z');
  });
});
