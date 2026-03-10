import type { VirtualViewport } from './types';

export interface ViewportInput {
  rowCount: number;
  rowHeight: number;
  viewportHeight: number;
  scrollTop: number;
  overscan: number;
}

export function calculateVirtualViewport({
  rowCount,
  rowHeight,
  viewportHeight,
  scrollTop,
  overscan
}: ViewportInput): VirtualViewport {
  const safeRowHeight = Math.max(1, rowHeight);
  const safeRowCount = Math.max(0, rowCount);
  const safeViewportHeight = Math.max(safeRowHeight, viewportHeight);
  const totalHeight = safeRowCount * safeRowHeight;
  const clampedScrollTop = Math.max(0, Math.min(scrollTop, Math.max(0, totalHeight - safeViewportHeight)));

  if (safeRowCount === 0) {
    return {
      rowStart: 0,
      rowEnd: 0,
      offsetTop: 0,
      totalHeight: 0
    };
  }

  const visibleStart = Math.floor(clampedScrollTop / safeRowHeight);
  const visibleCount = Math.ceil(safeViewportHeight / safeRowHeight);
  const rowStart = Math.max(0, visibleStart - overscan);
  const rowEnd = Math.min(safeRowCount, visibleStart + visibleCount + overscan);

  return {
    rowStart,
    rowEnd,
    offsetTop: rowStart * safeRowHeight,
    totalHeight
  };
}

export function createViewport(rowCount: number, rowHeight: number, overscan = 0): VirtualViewport {
  return calculateVirtualViewport({
    rowCount,
    rowHeight,
    viewportHeight: rowHeight,
    scrollTop: 0,
    overscan
  });
}
