import { createDataSource } from './data-source';
import { GridEventEmitter } from './event-emitter';
import { createSelectionModel, normalizeCell, normalizeRange } from './range';
import { createViewport } from './viewport';
import type {
  CellRange,
  CellValue,
  DataSource,
  EditSession,
  GridEventName,
  GridInstance,
  GridOptions,
  GridPlugin,
  GridSnapshot,
  GridState
} from './types';

const DEFAULT_ROW_HEIGHT = 32;
const DEFAULT_OVERSCAN = 4;

export function createGrid<TRow>(options: GridOptions<TRow>): GridInstance<TRow> {
  const resolvedOptions: GridInstance<TRow>['options'] = {
    ...options,
    rowHeight: options.rowHeight ?? DEFAULT_ROW_HEIGHT,
    overscan: options.overscan ?? DEFAULT_OVERSCAN,
    editable: options.editable ?? true
  };

  const dataSource = createDataSource(options.data, options.columns);
  const eventEmitter = new GridEventEmitter();
  const subscribers = new Set<() => void>();
  let destroyed = false;

  for (const [eventName, handler] of Object.entries(options.events ?? {})) {
    eventEmitter.on(eventName as GridEventName, handler as never);
  }

  let state: GridState = {
    rowCount: dataSource.getRowCount(),
    columnCount: options.columns.length,
    focusedCell: null,
    selection: null,
    editSession: null,
    scrollTop: 0,
    viewportHeight: resolvedOptions.rowHeight,
    viewport: createViewport(dataSource.getRowCount(), resolvedOptions.rowHeight)
  };

  const notify = () => {
    for (const subscriber of subscribers) {
      subscriber();
    }
  };

  const setState = (nextState: GridState) => {
    state = nextState;
    notify();
  };

  const ensureActive = () => {
    if (destroyed) {
      throw new Error('Grid instance has been destroyed');
    }
  };

  const focusCell = (row: number, col: number) => {
    ensureActive();
    const previous = state.focusedCell;
    const current = normalizeCell(row, col, state.rowCount, state.columnCount);
    setState({
      ...state,
      focusedCell: current
    });
    eventEmitter.emit('focusChange', { previous, current });
    return current;
  };

  const select = (range: CellRange) => {
    ensureActive();
    const normalizedRange = normalizeRange(range, state.rowCount, state.columnCount);
    const selection = createSelectionModel(normalizedRange);
    setState({
      ...state,
      selection,
      focusedCell: selection.focus
    });
    eventEmitter.emit('selectionChange', { selection });
    eventEmitter.emit('focusChange', { previous: state.focusedCell, current: selection.focus });
    return selection;
  };

  const getCell = (row: number, col: number) => {
    ensureActive();
    return dataSource.getCell(row, col);
  };

  const setCell = (row: number, col: number, value: CellValue) => {
    ensureActive();
    dataSource.setCell?.(row, col, value);
    setState({
      ...state,
      rowCount: dataSource.getRowCount()
    });
  };

  const updateRow = (row: number, nextRow: TRow) => {
    ensureActive();
    dataSource.updateRow?.(row, nextRow);
    setState({
      ...state,
      rowCount: dataSource.getRowCount()
    });
  };

  const startEdit = (row: number, col: number, nextValue?: CellValue): EditSession => {
    ensureActive();
    const cell = focusCell(row, col);
    const currentValue = nextValue ?? getCell(cell.row, cell.col);
    const editSession: EditSession = {
      cell,
      initialValue: getCell(cell.row, cell.col),
      draftValue: currentValue,
      startedAt: Date.now()
    };

    setState({
      ...state,
      focusedCell: cell,
      editSession
    });
    eventEmitter.emit('cellEditStart', { cell, value: editSession.initialValue });
    return editSession;
  };

  const stopEdit = (mode: 'commit' | 'cancel' = 'commit', nextValue?: CellValue) => {
    ensureActive();
    if (!state.editSession) {
      return;
    }

    const session = state.editSession;
    if (mode === 'commit' && nextValue !== undefined) {
      setCell(session.cell.row, session.cell.col, nextValue);
      eventEmitter.emit('cellEditCommit', {
        cell: session.cell,
        previousValue: session.initialValue,
        value: nextValue
      });
    }

    if (mode === 'cancel') {
      eventEmitter.emit('cellEditCancel', {
        cell: session.cell,
        value: session.initialValue
      });
    }

    setState({
      ...state,
      editSession: null
    });
  };

  const scrollTo = (row: number) => {
    ensureActive();
    const target = normalizeCell(row, 0, state.rowCount, state.columnCount).row * resolvedOptions.rowHeight;
    setState({
      ...state,
      scrollTop: target
    });
    return target;
  };

  const use = (plugin: GridPlugin<TRow>) => {
    ensureActive();
    plugin.setup?.(grid);
  };

  const grid: GridInstance<TRow> = {
    options: resolvedOptions,
    getState: () => state,
    getSnapshot: (): GridSnapshot => ({ state }),
    subscribe: (listener) => {
      ensureActive();
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    on: (eventName, handler) => eventEmitter.on(eventName, handler),
    select,
    focusCell,
    startEdit,
    stopEdit,
    scrollTo,
    getCell,
    setCell,
    updateRow,
    use,
    destroy: () => {
      destroyed = true;
      subscribers.clear();
      eventEmitter.clear();
    }
  };

  for (const plugin of options.plugins ?? []) {
    use(plugin);
  }

  return grid;
}

export function getGridDataSource<TRow>(grid: GridInstance<TRow>): DataSource<TRow> {
  return createDataSource(grid.options.data, grid.options.columns);
}
