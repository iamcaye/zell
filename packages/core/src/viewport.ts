import type { VirtualViewport } from './types';

export function createViewport(rowCount: number, rowHeight: number): VirtualViewport {
  return {
    rowStart: 0,
    rowEnd: Math.min(rowCount, 1),
    offsetTop: 0,
    totalHeight: rowCount * rowHeight
  };
}
