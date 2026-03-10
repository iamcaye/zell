import { clampIndex } from './range';
import type { CellCoord } from './types';

export type GridKey =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Tab'
  | 'Enter'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown';

export interface KeyboardNavigationInput {
  current: CellCoord;
  key: GridKey;
  rowCount: number;
  columnCount: number;
  pageSize: number;
  shiftKey?: boolean;
}

export function getNextCellFromKey({
  current,
  key,
  rowCount,
  columnCount,
  pageSize,
  shiftKey = false
}: KeyboardNavigationInput): CellCoord {
  switch (key) {
    case 'ArrowUp':
      return { row: clampIndex(current.row - 1, rowCount), col: current.col };
    case 'ArrowDown':
      return { row: clampIndex(current.row + 1, rowCount), col: current.col };
    case 'ArrowLeft':
      return { row: current.row, col: clampIndex(current.col - 1, columnCount) };
    case 'ArrowRight':
      return { row: current.row, col: clampIndex(current.col + 1, columnCount) };
    case 'Tab':
      return { row: current.row, col: clampIndex(current.col + (shiftKey ? -1 : 1), columnCount) };
    case 'Enter':
      return { row: clampIndex(current.row + (shiftKey ? -1 : 1), rowCount), col: current.col };
    case 'Home':
      return { row: current.row, col: 0 };
    case 'End':
      return { row: current.row, col: clampIndex(columnCount - 1, columnCount) };
    case 'PageUp':
      return { row: clampIndex(current.row - pageSize, rowCount), col: current.col };
    case 'PageDown':
      return { row: clampIndex(current.row + pageSize, rowCount), col: current.col };
    default:
      return current;
  }
}
