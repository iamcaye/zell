import type { SheetDataSource, SheetId, SheetModel, WorkbookModel } from './types';

interface CreateWorkbookOptions<TRow> {
  initialSheetName?: string;
  initialSheetDataSource?: SheetDataSource<TRow>;
}

function createSheetIdFactory() {
  let id = 0;
  return () => {
    id += 1;
    return `sheet-${id}`;
  };
}

export function createWorkbook<TRow = unknown>(
  options: CreateWorkbookOptions<TRow> = {}
): WorkbookModel<TRow> {
  const nextSheetId = createSheetIdFactory();
  const initialSheet: SheetModel<TRow> = {
    id: nextSheetId(),
    name: options.initialSheetName ?? 'Sheet1',
    dataSource: options.initialSheetDataSource
  };
  const sheets: Array<SheetModel<TRow>> = [initialSheet];
  let activeSheetId: SheetId = initialSheet.id;

  const findSheet = (sheetId: SheetId) => sheets.find((sheet) => sheet.id === sheetId);
  const cloneSheet = (sheet: SheetModel<TRow>): Readonly<SheetModel<TRow>> => ({
    id: sheet.id,
    name: sheet.name,
    dataSource: sheet.dataSource
  });

  return {
    addSheet: (name?: string, dataSource?: SheetDataSource<TRow>) => {
      const sheet: SheetModel<TRow> = {
        id: nextSheetId(),
        name: name ?? `Sheet${sheets.length + 1}`,
        dataSource
      };
      sheets.push(sheet);
      return sheet.id;
    },
    setActiveSheet: (sheetId) => {
      if (!findSheet(sheetId)) {
        throw new Error(`Sheet ${sheetId} does not exist`);
      }
      activeSheetId = sheetId;
    },
    getActiveSheet: () => {
      const activeSheet = findSheet(activeSheetId);
      if (!activeSheet) {
        throw new Error('Active sheet does not exist');
      }
      return cloneSheet(activeSheet);
    },
    getSheets: () => sheets.map(cloneSheet),
    removeSheet: (sheetId) => {
      if (sheets.length === 1) {
        throw new Error('Workbook must contain at least one sheet');
      }

      const index = sheets.findIndex((sheet) => sheet.id === sheetId);
      if (index === -1) {
        throw new Error(`Sheet ${sheetId} does not exist`);
      }

      sheets.splice(index, 1);
      if (activeSheetId === sheetId) {
        const nextActiveSheet = sheets[0];
        if (!nextActiveSheet) {
          throw new Error('Workbook must contain at least one sheet');
        }
        activeSheetId = nextActiveSheet.id;
      }
    }
  };
}
