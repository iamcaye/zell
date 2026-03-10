import type { CellCoord, CellRange, CellValue } from './types';

export function serializeCellValue(value: CellValue): string {
  if (value == null) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

export function serializeRangeToTsv(range: CellRange, getCell: (row: number, col: number) => CellValue): string {
  const lines: string[] = [];

  for (let row = range.start.row; row <= range.end.row; row += 1) {
    const cells: string[] = [];
    for (let col = range.start.col; col <= range.end.col; col += 1) {
      cells.push(serializeCellValue(getCell(row, col)));
    }
    lines.push(cells.join('\t'));
  }

  return lines.join('\n');
}

export function parseTsv(text: string): string[][] {
  if (!text) {
    return [];
  }

  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'));
}

export function getPasteTarget(target: CellCoord | undefined, fallback: CellCoord | null): CellCoord {
  if (target) {
    return target;
  }

  return fallback ?? { row: 0, col: 0 };
}
