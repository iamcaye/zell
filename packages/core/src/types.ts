import type { SheetId, SheetModel, SpreadsheetCell, WorkbookModel } from './spreadsheet/types';

export type CellValue = string | number | boolean | Date | null | undefined;

export type ColumnKind = 'text' | 'number' | 'date' | 'boolean';

export interface CellCoord {
  row: number;
  col: number;
}

export interface CellRange {
  start: CellCoord;
  end: CellCoord;
}

export type SelectionKind = 'cell' | 'range' | 'row' | 'column';

export interface SelectionModel {
  kind: SelectionKind;
  anchor: CellCoord;
  focus: CellCoord;
  range: CellRange;
}

export interface EditSession {
  cell: CellCoord;
  initialValue: CellValue;
  draftValue: CellValue;
  startedAt: number;
}

export interface VirtualViewport {
  rowStart: number;
  rowEnd: number;
  offsetTop: number;
  totalHeight: number;
}

export interface GridEventMap {
  cellClick: { cell: CellCoord; value: CellValue };
  cellEditStart: { cell: CellCoord; value: CellValue };
  cellEditCommit: { cell: CellCoord; previousValue: CellValue; value: CellValue };
  cellEditCancel: { cell: CellCoord; value: CellValue };
  selectionChange: { selection: SelectionModel | null };
  paste: { target: CellCoord; values: CellValue[][]; raw: string };
  copy: { range: CellRange; raw: string };
  focusChange: { previous: CellCoord | null; current: CellCoord | null };
}

export type GridEventName = keyof GridEventMap;
export type GridEventHandler<K extends GridEventName> = (event: GridEventMap[K]) => void;

export interface ColumnDef<TRow = unknown> {
  id: string;
  header?: string;
  width?: number;
  kind?: ColumnKind;
  editable?: boolean;
  field?: keyof TRow & string;
  getValue?: (row: TRow, rowIndex: number) => CellValue;
  setValue?: (row: TRow, value: CellValue, rowIndex: number) => TRow;
}

export interface DataSource<TRow = unknown> {
  getRowCount(): number;
  getRow?(row: number): TRow | undefined;
  getCell(row: number, col: number): CellValue;
  setCell?(row: number, col: number, value: CellValue): void;
  updateRow?(row: number, nextRow: TRow): void;
}

export type GridData<TRow = unknown> = DataSource<TRow> | TRow[] | CellValue[][];

export interface GridPlugin<TRow = unknown> {
  name: string;
  setup?: (grid: GridInstance<TRow>) => void;
}

export interface CellRendererContext<TRow = unknown> {
  row: number;
  col: number;
  value: CellValue;
  rowData?: TRow;
  column: ColumnDef<TRow>;
}

export type CellRenderer<TRow = unknown, TResult = unknown> = (
  context: CellRendererContext<TRow>
) => TResult;

export interface FrameworkAdapter {
  name: 'react' | 'vue' | 'angular' | (string & {});
}

export interface GridState {
  rowCount: number;
  columnCount: number;
  focusedCell: CellCoord | null;
  selection: SelectionModel | null;
  editSession: EditSession | null;
  scrollTop: number;
  viewportHeight: number;
  viewport: VirtualViewport;
}

export interface GridOptions<TRow = unknown> {
  columns: Array<ColumnDef<TRow>>;
  data: GridData<TRow>;
  rowHeight?: number;
  overscan?: number;
  editable?: boolean;
  plugins?: Array<GridPlugin<TRow>>;
  events?: Partial<{ [K in GridEventName]: GridEventHandler<K> }>;
}

export interface GridSnapshot {
  state: GridState;
}

export interface GridInstance<TRow = unknown> {
  readonly options: Required<Pick<GridOptions<TRow>, 'rowHeight' | 'overscan' | 'editable'>> & GridOptions<TRow>;
  getState(): GridState;
  getSnapshot(): GridSnapshot;
  subscribe(listener: () => void): () => void;
  on<K extends GridEventName>(eventName: K, handler: GridEventHandler<K>): () => void;
  setViewport(viewportHeight: number, scrollTop: number): VirtualViewport;
  handleKeyDown(
    key:
      | 'ArrowUp'
      | 'ArrowDown'
      | 'ArrowLeft'
      | 'ArrowRight'
      | 'Tab'
      | 'Enter'
      | 'Home'
      | 'End'
      | 'PageUp'
      | 'PageDown',
    modifiers?: { shiftKey?: boolean }
  ): CellCoord;
  updateEditDraft(value: CellValue): EditSession;
  handleTextInput(text: string): EditSession;
  copySelection(): string;
  copyRange(range: CellRange): string;
  pasteText(text: string, target?: CellCoord): CellRange;
  selectCell(row: number, col: number): SelectionModel;
  extendSelection(row: number, col: number): SelectionModel;
  clearSelection(): void;
  select(range: CellRange): SelectionModel;
  focusCell(row: number, col: number): CellCoord;
  startEdit(row: number, col: number, nextValue?: CellValue): EditSession;
  stopEdit(mode?: 'commit' | 'cancel', nextValue?: CellValue): void;
  scrollTo(row: number): number;
  addSheet(name?: string): SheetId;
  setActiveSheet(sheetId: SheetId): Readonly<SheetModel<TRow>>;
  getActiveSheet(): Readonly<SheetModel<TRow>>;
  getSheets(): ReadonlyArray<Readonly<SheetModel<TRow>>>;
  removeSheet(sheetId: SheetId): void;
  getCell(row: number, col: number): CellValue;
  setCell(row: number, col: number, value: CellValue): void;
  updateRow(row: number, nextRow: TRow): void;
  use(plugin: GridPlugin<TRow>): void;
  destroy(): void;
}

export type { SheetId, SheetModel, SpreadsheetCell, WorkbookModel };
