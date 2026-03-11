import type { CellValue, ColumnDef, GridInstance, GridKey, GridOptions } from '@zell/grid-core';
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEventHandler } from 'react';
import { useGrid } from './use-grid';

export interface GridProps<TRow> extends GridOptions<TRow> {
  height?: number;
  className?: string;
}


function formatValue(value: CellValue, kind: ColumnDef['kind']) {
  if (value == null) {
    return '';
  }

  if (kind === 'date') {
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  return String(value);
}

function getCellFromEvent(e: React.MouseEvent): { row: number; col: number } | null {
  const el = (e.target as HTMLElement).closest('[data-row]');
  if (!el) return null;
  const row = el.getAttribute('data-row');
  const col = el.getAttribute('data-col');
  if (row === null || col === null) return null;
  return { row: Number(row), col: Number(col) };
}

// ── ZCell ────────────────────────────────────────────────────────────────────

interface ZCellProps<TRow> {
  rowIndex: number;
  colIndex: number;
  column: ColumnDef<TRow>;
  value: CellValue;
  isFocused: boolean;
  isSelected: boolean;
  isEditing: boolean;
  editDraft: CellValue | undefined;
  rowHeight: number;
  grid: GridInstance<TRow>;
}

function ZCellInner<TRow>({
  rowIndex,
  colIndex,
  column,
  value,
  isFocused,
  isSelected,
  isEditing,
  editDraft,
  rowHeight,
  grid
}: ZCellProps<TRow>) {
  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      data-row={rowIndex}
      data-col={colIndex}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        minHeight: rowHeight,
        fontSize: 14,
        color: '#111827',
        background: isSelected ? 'rgba(12, 116, 146, 0.12)' : 'transparent',
        boxShadow: isFocused ? 'inset 0 0 0 2px rgba(12, 116, 146, 0.9)' : 'none',
        userSelect: 'none'
      }}
    >
      {isEditing ? (
        column.kind === 'boolean' ? (
          <input
            autoFocus
            type="checkbox"
            checked={Boolean(editDraft)}
            onChange={(event) => {
              grid.updateEditDraft(event.currentTarget.checked);
              grid.stopEdit();
            }}
          />
        ) : (
          <input
            autoFocus
            type={column.kind === 'number' ? 'number' : column.kind === 'date' ? 'date' : 'text'}
            value={formatValue(editDraft, column.kind)}
            onChange={(event) => grid.updateEditDraft(event.currentTarget.value)}
            onBlur={() => grid.stopEdit()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                grid.stopEdit();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                grid.stopEdit('cancel');
              }
            }}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'rgba(255,255,255,0.9)',
              font: 'inherit',
              color: 'inherit'
            }}
          />
        )
      ) : (
        <span title={String(value ?? '')}>{formatValue(value, column.kind)}</span>
      )}
    </div>
  );
}

const ZCell = memo(ZCellInner) as typeof ZCellInner;

// ── ZRow ─────────────────────────────────────────────────────────────────────

interface ZRowProps<TRow> {
  rowIndex: number;
  columns: ColumnDef<TRow>[];
  gridTemplateColumns: string;
  rowHeight: number;
  grid: GridInstance<TRow>;
  // Primitives only — enables React.memo shallow comparison
  focusedRow: number | null;
  focusedCol: number | null;
  selHasSelection: boolean;
  selRowStart: number;
  selRowEnd: number;
  selColStart: number;
  selColEnd: number;
  editRow: number | null;
  editCol: number | null;
  editDraft: CellValue | undefined;
}

function ZRowInner<TRow>({
  rowIndex,
  columns,
  gridTemplateColumns,
  rowHeight,
  grid,
  focusedRow,
  focusedCol,
  selHasSelection,
  selRowStart,
  selRowEnd,
  selColStart,
  selColEnd,
  editRow,
  editCol,
  editDraft
}: ZRowProps<TRow>) {
  return (
    <div
      role="row"
      style={{
        display: 'grid',
        gridTemplateColumns,
        minHeight: rowHeight,
        borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
        background: rowIndex % 2 === 0 ? 'rgba(255, 255, 255, 0.54)' : 'rgba(250, 250, 247, 0.8)'
      }}
    >
      {columns.map((column, colIndex) => {
        const isFocused = focusedRow === rowIndex && focusedCol === colIndex;
        const isSelected =
          selHasSelection &&
          rowIndex >= selRowStart &&
          rowIndex <= selRowEnd &&
          colIndex >= selColStart &&
          colIndex <= selColEnd;
        const isEditing = editRow === rowIndex && editCol === colIndex;

        return (
          <ZCell
            key={`${rowIndex}-${column.id}`}
            rowIndex={rowIndex}
            colIndex={colIndex}
            column={column}
            value={grid.getCell(rowIndex, colIndex)}
            isFocused={isFocused}
            isSelected={isSelected}
            isEditing={isEditing}
            editDraft={isEditing ? editDraft : undefined}
            rowHeight={rowHeight}
            grid={grid}
          />
        );
      })}
    </div>
  );
}

const ZRow = memo(ZRowInner) as typeof ZRowInner;

// ── Grid ─────────────────────────────────────────────────────────────────────

export function Grid<TRow>({ height = 520, className, ...options }: GridProps<TRow>) {
  const { grid, state } = useGrid(options);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastHoveredCellRef = useRef<{ row: number; col: number } | null>(null);
  const pendingScrollTopRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const headerHeight = options.rowHeight ?? 32;
  const bodyHeight = Math.max(120, height - headerHeight);

  useEffect(() => {
    grid.setViewport(bodyHeight, state.scrollTop);
  }, [bodyHeight, grid, state.scrollTop]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }

    if (Math.abs(body.scrollTop - state.scrollTop) > 1) {
      body.scrollTop = state.scrollTop;
    }
  }, [state.scrollTop]);

  useEffect(() => {
    const stopDragging = () => setIsDraggingSelection(false);
    window.addEventListener('mouseup', stopDragging);
    return () => window.removeEventListener('mouseup', stopDragging);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current != null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  const visibleRows = useMemo(() => {
    const rows: number[] = [];
    for (let row = state.viewport.rowStart; row < state.viewport.rowEnd; row += 1) {
      rows.push(row);
    }
    return rows;
  }, [state.viewport.rowEnd, state.viewport.rowStart]);

  const gridTemplateColumns = useMemo(
    () => options.columns.map((column) => `${column.width ?? 160}px`).join(' '),
    [options.columns]
  );

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const navigationKeys = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Enter',
      'Home',
      'End',
      'PageUp',
      'PageDown'
    ]);

    if (navigationKeys.has(event.key)) {
      event.preventDefault();
      if (state.editSession && event.key === 'Enter') {
        grid.stopEdit();
        return;
      }

      grid.handleKeyDown(event.key as GridKey, { shiftKey: event.shiftKey });
      return;
    }

    if (event.key === 'Escape' && state.editSession) {
      event.preventDefault();
      grid.stopEdit('cancel');
      return;
    }

    if (event.key.length === 1 && !state.editSession) {
      event.preventDefault();
      grid.handleTextInput(event.key);
    }
  };

  const shellStyles: CSSProperties = {
    border: '1px solid rgba(15, 23, 42, 0.12)',
    borderRadius: 24,
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.92)',
    boxShadow: '0 32px 80px rgba(15, 23, 42, 0.12)'
  };

  // Flatten state to primitives so ZRow memo comparison is fast and accurate
  const focusedRow = state.focusedCell?.row ?? null;
  const focusedCol = state.focusedCell?.col ?? null;
  const selHasSelection = state.selection != null;
  const selRowStart = state.selection?.range.start.row ?? 0;
  const selRowEnd = state.selection?.range.end.row ?? 0;
  const selColStart = state.selection?.range.start.col ?? 0;
  const selColEnd = state.selection?.range.end.col ?? 0;
  const editRow = state.editSession?.cell.row ?? null;
  const editCol = state.editSession?.cell.col ?? null;
  const editDraft = state.editSession?.draftValue;

  return (
    <section className={className} style={shellStyles}>
      <div
        role="row"
        style={{
          display: 'grid',
          gridTemplateColumns,
          height: headerHeight,
          background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.08))',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)'
        }}
      >
        {options.columns.map((column) => (
          <div
            key={column.id}
            role="columnheader"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(15, 23, 42, 0.64)'
            }}
          >
            {column.header ?? column.id}
          </div>
        ))}
      </div>
      <div
        ref={bodyRef}
        role="grid"
        aria-rowcount={state.rowCount}
        aria-colcount={state.columnCount}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onCopy={(event) => {
          event.preventDefault();
          event.clipboardData.setData('text/plain', grid.copySelection());
        }}
        onPaste={(event) => {
          event.preventDefault();
          grid.pasteText(event.clipboardData.getData('text/plain'));
        }}
        onScroll={(event) => {
          pendingScrollTopRef.current = event.currentTarget.scrollTop;
          if (scrollFrameRef.current != null) {
            return;
          }

          scrollFrameRef.current = window.requestAnimationFrame(() => {
            scrollFrameRef.current = null;
            const scrollTop = pendingScrollTopRef.current;
            if (scrollTop == null) {
              return;
            }

            pendingScrollTopRef.current = null;
            grid.setViewport(bodyHeight, scrollTop);
          });
        }}
        onMouseDown={(e) => {
          const cell = getCellFromEvent(e);
          if (cell) {
            grid.selectCell(cell.row, cell.col);
            setIsDraggingSelection(true);
          }
        }}
        onMouseMove={(e) => {
          if (!isDraggingSelection) return;
          const cell = getCellFromEvent(e);
          if (!cell) return;
          if (
            lastHoveredCellRef.current?.row === cell.row &&
            lastHoveredCellRef.current?.col === cell.col
          ) {
            return;
          }
          lastHoveredCellRef.current = cell;
          grid.extendSelection(cell.row, cell.col);
        }}
        onDoubleClick={(e) => {
          const cell = getCellFromEvent(e);
          if (cell) grid.startEdit(cell.row, cell.col);
        }}
        style={{
          position: 'relative',
          height: bodyHeight,
          overflow: 'auto',
          outline: 'none',
          background: 'linear-gradient(180deg, rgba(255, 252, 246, 0.84), rgba(247, 249, 253, 0.92))'
        }}
      >
        <div style={{ position: 'relative', height: state.viewport.totalHeight }}>
          <div style={{ transform: `translateY(${state.viewport.offsetTop}px)` }}>
            {visibleRows.map((rowIndex) => (
              <ZRow
                key={rowIndex}
                rowIndex={rowIndex}
                columns={options.columns}
                gridTemplateColumns={gridTemplateColumns}
                rowHeight={options.rowHeight ?? 32}
                grid={grid}
                focusedRow={focusedRow}
                focusedCol={focusedCol}
                selHasSelection={selHasSelection}
                selRowStart={selRowStart}
                selRowEnd={selRowEnd}
                selColStart={selColStart}
                selColEnd={selColEnd}
                editRow={editRow}
                editCol={editCol}
                editDraft={editDraft}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
