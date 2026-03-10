import { createGrid } from '@zell/grid-core';

export function GridReactVersion() {
  const grid = createGrid({
    columns: [{ id: 'version' }],
    data: [['ready']]
  });

  return `grid-react uses core rows ${grid.getState().rowCount}`;
}
