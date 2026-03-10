import type { CellValue, ColumnDef } from './types';

export function isEditable<TRow>(column: ColumnDef<TRow> | undefined, gridEditable: boolean) {
  if (!gridEditable) {
    return false;
  }

  return column?.editable ?? true;
}

export function coerceValueByKind(kind: ColumnDef['kind'], value: CellValue): CellValue {
  if (value == null) {
    return value;
  }

  switch (kind) {
    case 'number':
      return typeof value === 'number' ? value : Number(value);
    case 'boolean':
      if (typeof value === 'boolean') {
        return value;
      }
      return value === 'true' || value === '1';
    case 'date':
      return value instanceof Date ? value : new Date(String(value));
    case 'text':
    default:
      return String(value);
  }
}
