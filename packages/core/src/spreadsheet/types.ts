export type SheetId = string;

export interface SpreadsheetCell {
  value: unknown;
  formula?: string;
}

export interface SheetDataSource<TRow = unknown> {
  getRowCount(): number;
  getCell(row: number, col: number): unknown;
  setCell?(row: number, col: number, value: unknown): void;
  updateRow?(row: number, nextRow: TRow): void;
}

export interface SheetModel<TRow = unknown> {
  readonly id: SheetId;
  readonly name: string;
  readonly dataSource?: SheetDataSource<TRow>;
}

export interface WorkbookModel<TRow = unknown> {
  addSheet(name?: string, dataSource?: SheetDataSource<TRow>): SheetId;
  setActiveSheet(sheetId: SheetId): void;
  getActiveSheet(): Readonly<SheetModel<TRow>>;
  getSheets(): ReadonlyArray<Readonly<SheetModel<TRow>>>;
  removeSheet(sheetId: SheetId): void;
}
