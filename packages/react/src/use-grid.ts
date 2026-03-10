import { createGrid, type GridInstance, type GridOptions, type GridState } from '@zell/grid-core';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

export function useGrid<TRow>(options: GridOptions<TRow>): { grid: GridInstance<TRow>; state: GridState } {
  const grid = useMemo(
    () =>
      createGrid({
        columns: options.columns,
        data: options.data,
        rowHeight: options.rowHeight,
        overscan: options.overscan,
        editable: options.editable,
        events: options.events,
        plugins: options.plugins
      }),
    [
      options.columns,
      options.data,
      options.rowHeight,
      options.overscan,
      options.editable,
      options.events,
      options.plugins
    ]
  );

  const pendingDestroyRef = useRef<{ grid: GridInstance<TRow>; timer: number } | null>(null);

  useEffect(() => {
    if (pendingDestroyRef.current?.grid === grid) {
      window.clearTimeout(pendingDestroyRef.current.timer);
      pendingDestroyRef.current = null;
    }

    return () => {
      const timer = window.setTimeout(() => {
        if (pendingDestroyRef.current?.grid !== grid) {
          return;
        }

        grid.destroy();
        pendingDestroyRef.current = null;
      }, 0);

      pendingDestroyRef.current = { grid, timer };
    };
  }, [grid]);

  const state = useSyncExternalStore(grid.subscribe, grid.getState, grid.getState);
  return { grid, state };
}
