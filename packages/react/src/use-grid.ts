import { createGrid, type GridInstance, type GridOptions, type GridState } from '@zell/grid-core';
import { useEffect, useMemo, useSyncExternalStore } from 'react';

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

  useEffect(() => () => grid.destroy(), [grid]);

  const state = useSyncExternalStore(grid.subscribe, grid.getState, grid.getState);
  return { grid, state };
}
