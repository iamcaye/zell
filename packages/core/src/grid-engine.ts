import { getPasteTarget, parseTsv, serializeRangeToTsv } from './clipboard';
import { createDataSource } from './data-source';
import { coerceValueByKind, isEditable } from './editing';
import { GridEventEmitter } from './event-emitter';
import { getNextCellFromKey, type GridKey } from './navigation';
import { createSelectionModel, normalizeCell, normalizeRange } from './range';
import { extendSelection as extendSelectionFromAnchor } from './selection';
import { calculateVirtualViewport, createViewport } from './viewport';
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
    viewportHeight: resolvedOptions.rowHeight * 10,
    viewport: createViewport(dataSource.getRowCount(), resolvedOptions.rowHeight, resolvedOptions.overscan)
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

  const syncViewport = (partial: Partial<Pick<GridState, 'scrollTop' | 'viewportHeight' | 'rowCount'>>) => {
    const nextScrollTop = partial.scrollTop ?? state.scrollTop;
    const nextViewportHeight = partial.viewportHeight ?? state.viewportHeight;
    const nextRowCount = partial.rowCount ?? state.rowCount;

    return {
      ...state,
      rowCount: nextRowCount,
      scrollTop: nextScrollTop,
      viewportHeight: nextViewportHeight,
      viewport: calculateVirtualViewport({
        rowCount: nextRowCount,
        rowHeight: resolvedOptions.rowHeight,
        viewportHeight: nextViewportHeight,
        scrollTop: nextScrollTop,
        overscan: resolvedOptions.overscan
      })
    };
  };

  const ensureActive = () => {
    if (destroyed) {
      throw new Error('Grid instance has been destroyed');
    }
  };

  const ensureRowVisible = (row: number) => {
    const rowTop = row * resolvedOptions.rowHeight;
    const rowBottom = rowTop + resolvedOptions.rowHeight;
    let nextScrollTop = state.scrollTop;

    if (rowTop < state.scrollTop) {
      nextScrollTop = rowTop;
    } else if (rowBottom > state.scrollTop + state.viewportHeight) {
      nextScrollTop = rowBottom - state.viewportHeight;
    }

    if (nextScrollTop !== state.scrollTop) {
      setState(syncViewport({ scrollTop: nextScrollTop }));
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
    ensureRowVisible(current.row);
    eventEmitter.emit('focusChange', { previous, current });
    return current;
  };

  const select = (range: CellRange) => {
    ensureActive();
    const normalizedRange = normalizeRange(range, state.rowCount, state.columnCount);
    const selection = createSelectionModel(normalizedRange, range.start, range.end);
    setState({
      ...state,
      selection,
      focusedCell: selection.focus
    });
    eventEmitter.emit('selectionChange', { selection });
    eventEmitter.emit('focusChange', { previous: state.focusedCell, current: selection.focus });
    return selection;
  };

  const selectCell = (row: number, col: number) =>
    select({
      start: { row, col },
      end: { row, col }
    });

  const extendSelection = (row: number, col: number) => {
    ensureActive();
    const anchor = state.selection?.anchor ?? state.focusedCell ?? { row: 0, col: 0 };
    const focus = normalizeCell(row, col, state.rowCount, state.columnCount);
    const selection = extendSelectionFromAnchor(anchor, focus, state.rowCount, state.columnCount);

    setState({
      ...state,
      selection,
      focusedCell: focus
    });
    eventEmitter.emit('selectionChange', { selection });
    eventEmitter.emit('focusChange', { previous: state.focusedCell, current: focus });
    return selection;
  };

  const clearSelection = () => {
    ensureActive();
    setState({
      ...state,
      selection: null
    });
    eventEmitter.emit('selectionChange', { selection: null });
  };

  const getCell = (row: number, col: number) => {
    ensureActive();
    return dataSource.getCell(row, col);
  };

  const setCell = (row: number, col: number, value: CellValue) => {
    ensureActive();
    dataSource.setCell?.(row, col, value);
    setState(syncViewport({ rowCount: dataSource.getRowCount() }));
  };

  const updateRow = (row: number, nextRow: TRow) => {
    ensureActive();
    dataSource.updateRow?.(row, nextRow);
    setState(syncViewport({ rowCount: dataSource.getRowCount() }));
  };

  const startEdit = (row: number, col: number, nextValue?: CellValue): EditSession => {
    ensureActive();
    const cell = focusCell(row, col);
    const column = resolvedOptions.columns[cell.col];
    if (!isEditable(column, resolvedOptions.editable)) {
      throw new Error(`Cell ${cell.row}:${cell.col} is not editable`);
    }

    const currentValue = getCell(cell.row, cell.col);
    const editSession: EditSession = {
      cell,
      initialValue: currentValue,
      draftValue: nextValue ?? currentValue,
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

  const updateEditDraft = (value: CellValue) => {
    ensureActive();
    if (!state.editSession) {
      throw new Error('Cannot update edit draft without an active edit session');
    }

    const editSession: EditSession = {
      ...state.editSession,
      draftValue: value
    };
    setState({
      ...state,
      editSession
    });
    return editSession;
  };

  const stopEdit = (mode: 'commit' | 'cancel' = 'commit', nextValue?: CellValue) => {
    ensureActive();
    if (!state.editSession) {
      return;
    }

    const session = state.editSession;
    if (mode === 'commit') {
      const value = nextValue ?? session.draftValue;
      const column = resolvedOptions.columns[session.cell.col];
      const coercedValue = coerceValueByKind(column?.kind, value);
      setCell(session.cell.row, session.cell.col, coercedValue);
      eventEmitter.emit('cellEditCommit', {
        cell: session.cell,
        previousValue: session.initialValue,
        value: coercedValue
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

  const handleTextInput = (text: string) => {
    ensureActive();
    const target = state.focusedCell ?? state.selection?.focus ?? { row: 0, col: 0 };
    const session = startEdit(target.row, target.col, text);
    return session;
  };

  const copyRange = (range: CellRange) => {
    ensureActive();
    const normalizedRange = normalizeRange(range, state.rowCount, state.columnCount);
    const raw = serializeRangeToTsv(normalizedRange, getCell);
    eventEmitter.emit('copy', { range: normalizedRange, raw });
    return raw;
  };

  const copySelection = () => {
    ensureActive();
    const range =
      state.selection?.range ??
      (state.focusedCell
        ? { start: state.focusedCell, end: state.focusedCell }
        : { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });

    return copyRange(range);
  };

  const pasteText = (text: string, target?: { row: number; col: number }) => {
    ensureActive();
    const parsed = parseTsv(text);
    const start = getPasteTarget(target, state.focusedCell ?? state.selection?.focus ?? null);

    if (parsed.length === 0) {
      return { start, end: start };
    }

    for (let rowOffset = 0; rowOffset < parsed.length; rowOffset += 1) {
      const row = parsed[rowOffset];
      if (!row) {
        continue;
      }

      for (let colOffset = 0; colOffset < row.length; colOffset += 1) {
        const columnIndex = start.col + colOffset;
        const column = resolvedOptions.columns[columnIndex];
        if (!column) {
          continue;
        }

        const value = coerceValueByKind(column.kind, row[colOffset]);
        setCell(start.row + rowOffset, columnIndex, value);
      }
    }

    const range = normalizeRange(
      {
        start,
        end: {
          row: start.row + parsed.length - 1,
          col: start.col + Math.max(...parsed.map((row) => row.length), 1) - 1
        }
      },
      state.rowCount,
      state.columnCount
    );

    const values = parsed.map((row, rowOffset) =>
      row.map((_, colOffset) => getCell(start.row + rowOffset, start.col + colOffset))
    );
    select(range);
    eventEmitter.emit('paste', { target: start, values, raw: text });
    return range;
  };

  const setViewport = (viewportHeight: number, scrollTop: number) => {
    ensureActive();
    const nextState = syncViewport({
      viewportHeight,
      scrollTop
    });
    setState(nextState);
    return nextState.viewport;
  };

  const scrollTo = (row: number) => {
    ensureActive();
    const target = normalizeCell(row, 0, state.rowCount, state.columnCount).row * resolvedOptions.rowHeight;
    setState(syncViewport({ scrollTop: target }));
    return target;
  };

  const handleKeyDown = (key: GridKey, modifiers?: { shiftKey?: boolean }) => {
    ensureActive();
    const current = state.focusedCell ?? state.selection?.focus ?? { row: 0, col: 0 };
    const pageSize = Math.max(1, Math.floor(state.viewportHeight / resolvedOptions.rowHeight));
    const next = getNextCellFromKey({
      current,
      key,
      rowCount: state.rowCount,
      columnCount: state.columnCount,
      pageSize,
      shiftKey: modifiers?.shiftKey
    });

    if (modifiers?.shiftKey) {
      extendSelection(next.row, next.col);
      ensureRowVisible(next.row);
      return next;
    }

    return focusCell(next.row, next.col);
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
      if (destroyed) {
        return () => {};
      }

      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    on: (eventName, handler) => eventEmitter.on(eventName, handler),
    setViewport,
    handleKeyDown,
    updateEditDraft,
    handleTextInput,
    copySelection,
    copyRange,
    pasteText,
    selectCell,
    extendSelection,
    clearSelection,
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
