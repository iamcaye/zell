import { clampIndex } from './range';
import type { CellValue, ColumnDef, DataSource, GridData } from './types';

function isDataSource<TRow>(value: GridData<TRow>): value is DataSource<TRow> {
  return typeof value === 'object' && value !== null && 'getCell' in value && 'getRowCount' in value;
}

function resolveObjectValue<TRow>(row: TRow, column: ColumnDef<TRow>, rowIndex: number): CellValue {
  if (column.getValue) {
    return column.getValue(row, rowIndex);
  }

  const key = column.field ?? (column.id as keyof TRow & string);
  return (row as Record<string, CellValue>)[key];
}

export function createDataSource<TRow>(data: GridData<TRow>, columns: Array<ColumnDef<TRow>>): DataSource<TRow> {
  if (isDataSource(data)) {
    return data;
  }

  if (data.length === 0) {
    return {
      getRowCount: () => 0,
      getCell: () => undefined
    };
  }

  if (Array.isArray(data[0])) {
    const matrix = data as CellValue[][];
    return {
      getRowCount: () => matrix.length,
      getRow: (row) => matrix[row] as TRow,
      getCell: (row, col) => matrix[clampIndex(row, matrix.length)]?.[clampIndex(col, columns.length || matrix[0]?.length || 0)],
      setCell: (row, col, value) => {
        const targetRow = matrix[row];
        if (!targetRow) {
          return;
        }
        targetRow[col] = value;
      },
      updateRow: (row, nextRow) => {
        matrix[row] = nextRow as unknown as CellValue[];
      }
    };
  }

  const rows = data as TRow[];
  return {
    getRowCount: () => rows.length,
    getRow: (row) => rows[row],
    getCell: (row, col) => {
      const rowData = rows[row];
      const column = columns[col];
      if (!rowData || !column) {
        return undefined;
      }
      return resolveObjectValue(rowData, column, row);
    },
    setCell: (row, col, value) => {
      const rowData = rows[row];
      const column = columns[col];
      if (!rowData || !column) {
        return;
      }

      if (column.setValue) {
        rows[row] = column.setValue(rowData, value, row);
        return;
      }

      const key = column.field ?? (column.id as keyof TRow & string);
      (rowData as Record<string, CellValue>)[key] = value;
    },
    updateRow: (row, nextRow) => {
      rows[row] = nextRow;
    }
  };
}
