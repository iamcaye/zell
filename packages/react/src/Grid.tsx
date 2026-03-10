import type { CellCoord, CellValue, ColumnDef, GridKey, GridOptions } from '@zell/grid-core';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEventHandler } from 'react';
import { useGrid } from './use-grid';

export interface GridProps<TRow> extends GridOptions<TRow> {
  height?: number;
  className?: string;
}

function isSameCell(left: CellCoord | null, right: CellCoord | null) {
  return left?.row === right?.row && left?.col === right?.col;
}

function isCellInRange(cell: CellCoord, range: { start: CellCoord; end: CellCoord } | null | undefined) {
  if (!range) {
    return false;
  }

  return (
    cell.row >= range.start.row &&
    cell.row <= range.end.row &&
    cell.col >= range.start.col &&
    cell.col <= range.end.col
  );
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

export function Grid<TRow>({ height = 520, className, ...options }: GridProps<TRow>) {
  const { grid, state } = useGrid(options);
  const bodyRef = useRef<HTMLDivElement>(null);
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

  const visibleRows = useMemo(() => {
    const rows: number[] = [];
    for (let row = state.viewport.rowStart; row < state.viewport.rowEnd; row += 1) {
      rows.push(row);
    }
    return rows;
  }, [state.viewport.rowEnd, state.viewport.rowStart]);

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

  const gridTemplateColumns = options.columns.map((column) => `${column.width ?? 160}px`).join(' ');

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
          grid.setViewport(bodyHeight, event.currentTarget.scrollTop);
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
            {visibleRows.map((rowIndex) => {
              return (
                <div
                  key={rowIndex}
                  role="row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns,
                    minHeight: options.rowHeight ?? 32,
                    borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
                    background:
                      rowIndex % 2 === 0 ? 'rgba(255, 255, 255, 0.54)' : 'rgba(250, 250, 247, 0.8)'
                  }}
                >
                  {options.columns.map((column, colIndex) => {
                    const cell = { row: rowIndex, col: colIndex };
                    const value = grid.getCell(rowIndex, colIndex);
                    const isFocused = isSameCell(cell, state.focusedCell);
                    const isSelected = isCellInRange(cell, state.selection?.range);
                    const isEditing = isSameCell(cell, state.editSession?.cell ?? null);

                    return (
                      <div
                        key={`${rowIndex}-${column.id}`}
                        role="gridcell"
                        aria-selected={isSelected}
                        data-row={rowIndex}
                        data-col={colIndex}
                        onMouseDown={() => {
                          grid.selectCell(rowIndex, colIndex);
                          setIsDraggingSelection(true);
                        }}
                        onMouseEnter={() => {
                          if (isDraggingSelection) {
                            grid.extendSelection(rowIndex, colIndex);
                          }
                        }}
                        onDoubleClick={() => {
                          grid.startEdit(rowIndex, colIndex);
                        }}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 14px',
                          minHeight: options.rowHeight ?? 32,
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
                              checked={Boolean(state.editSession?.draftValue)}
                              onChange={(event) => {
                                grid.updateEditDraft(event.currentTarget.checked);
                                grid.stopEdit();
                              }}
                            />
                          ) : (
                            <input
                              autoFocus
                              type={column.kind === 'number' ? 'number' : column.kind === 'date' ? 'date' : 'text'}
                              value={formatValue(state.editSession?.draftValue, column.kind)}
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
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
