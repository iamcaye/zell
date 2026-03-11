import { evaluateFormula, extractFormulaDependencies } from './formula-evaluator';
import { formatCellAddress, parseCellAddress } from './formula-parser';
import type { CellValue, SheetId } from '../types';

interface SheetAccessor {
  getCell(row: number, col: number): CellValue;
  setCell(row: number, col: number, value: CellValue): void;
}

interface FormulaSheetState {
  formulas: Map<string, string>;
  dependenciesByFormula: Map<string, Set<string>>;
  dependentsByCell: Map<string, Set<string>>;
}

interface FormulaEngine {
  setFormula(sheetId: SheetId, row: number, col: number, formula: string): void;
  getFormula(sheetId: SheetId, row: number, col: number): string | undefined;
  clearFormula(sheetId: SheetId, row: number, col: number): void;
  handleCellEdit(sheetId: SheetId, row: number, col: number): void;
  recalculate(sheetId: SheetId): void;
  removeSheet(sheetId: SheetId): void;
}

const createEmptySheetState = (): FormulaSheetState => ({
  formulas: new Map(),
  dependenciesByFormula: new Map(),
  dependentsByCell: new Map()
});

export function createFormulaEngine(getSheetAccessor: (sheetId: SheetId) => SheetAccessor): FormulaEngine {
  const sheets = new Map<SheetId, FormulaSheetState>();

  const getSheetState = (sheetId: SheetId): FormulaSheetState => {
    const existing = sheets.get(sheetId);
    if (existing) {
      return existing;
    }

    const created = createEmptySheetState();
    sheets.set(sheetId, created);
    return created;
  };

  const cellId = (row: number, col: number) => formatCellAddress({ row, col });

  const setDependencies = (sheet: FormulaSheetState, formulaCell: string, dependencies: Set<string>) => {
    const previousDependencies = sheet.dependenciesByFormula.get(formulaCell);
    if (previousDependencies) {
      for (const dependencyCell of previousDependencies) {
        const dependents = sheet.dependentsByCell.get(dependencyCell);
        dependents?.delete(formulaCell);
        if (dependents && dependents.size === 0) {
          sheet.dependentsByCell.delete(dependencyCell);
        }
      }
    }

    sheet.dependenciesByFormula.set(formulaCell, dependencies);
    for (const dependencyCell of dependencies) {
      const dependents = sheet.dependentsByCell.get(dependencyCell);
      if (dependents) {
        dependents.add(formulaCell);
      } else {
        sheet.dependentsByCell.set(dependencyCell, new Set([formulaCell]));
      }
    }
  };

  const restoreFormulaState = (
    sheet: FormulaSheetState,
    formulaCell: string,
    previousFormula: string | undefined,
    previousDependencies: Set<string> | undefined
  ) => {
    setDependencies(sheet, formulaCell, new Set());
    sheet.dependenciesByFormula.delete(formulaCell);

    if (previousFormula === undefined) {
      sheet.formulas.delete(formulaCell);
      return;
    }

    sheet.formulas.set(formulaCell, previousFormula);
    setDependencies(sheet, formulaCell, previousDependencies ?? new Set());
  };

  const collectAffectedFormulaCells = (
    sheet: FormulaSheetState,
    startCells: string[],
    includeStartFormulaCells: boolean
  ): Set<string> => {
    const affectedFormulaCells = new Set<string>();
    const queue = [...startCells];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) {
        continue;
      }

      visited.add(current);
      if (includeStartFormulaCells && sheet.formulas.has(current)) {
        affectedFormulaCells.add(current);
      }

      for (const dependentFormulaCell of sheet.dependentsByCell.get(current) ?? []) {
        if (!affectedFormulaCells.has(dependentFormulaCell)) {
          affectedFormulaCells.add(dependentFormulaCell);
        }
        queue.push(dependentFormulaCell);
      }
    }

    return affectedFormulaCells;
  };

  const evaluateFormulaCell = (
    sheet: FormulaSheetState,
    accessor: SheetAccessor,
    formulaCell: string,
    stack: string[],
    cache: Map<string, number>
  ): number => {
    const cached = cache.get(formulaCell);
    if (cached !== undefined) {
      return cached;
    }

    if (stack.includes(formulaCell)) {
      throw new Error(`Circular formula dependency at ${formulaCell}`);
    }

    const formula = sheet.formulas.get(formulaCell);
    if (!formula) {
      const { row, col } = parseCellAddress(formulaCell);
      const value = accessor.getCell(row, col);
      return typeof value === 'number' ? value : Number(value) || 0;
    }

    stack.push(formulaCell);
    try {
      const value = evaluateFormula(formula, {
        getCellValue: (reference) => {
          if (sheet.formulas.has(reference)) {
            return evaluateFormulaCell(sheet, accessor, reference, stack, cache);
          }

          const { row, col } = parseCellAddress(reference);
          return accessor.getCell(row, col);
        }
      });

      const { row, col } = parseCellAddress(formulaCell);
      accessor.setCell(row, col, value);
      cache.set(formulaCell, value);
      return value;
    } finally {
      stack.pop();
    }
  };

  const recalculateFormulaCells = (sheetId: SheetId, formulaCells: Iterable<string>) => {
    const sheet = getSheetState(sheetId);
    const accessor = getSheetAccessor(sheetId);
    const stack: string[] = [];
    const cache = new Map<string, number>();
    const orderedCells = Array.from(new Set(formulaCells)).sort((a, b) => a.localeCompare(b));

    for (const formulaCell of orderedCells) {
      evaluateFormulaCell(sheet, accessor, formulaCell, stack, cache);
    }
  };

  return {
    setFormula: (sheetId, row, col, formula) => {
      const sheet = getSheetState(sheetId);
      const targetCell = cellId(row, col);
      const previousFormula = sheet.formulas.get(targetCell);
      const previousDependencies = sheet.dependenciesByFormula.get(targetCell);
      const nextDependencies = new Set(extractFormulaDependencies(formula));

      sheet.formulas.set(targetCell, formula);
      setDependencies(sheet, targetCell, nextDependencies);

      try {
        const affectedFormulaCells = collectAffectedFormulaCells(sheet, [targetCell], true);
        recalculateFormulaCells(sheetId, affectedFormulaCells);
      } catch (error) {
        restoreFormulaState(sheet, targetCell, previousFormula, previousDependencies);
        throw error;
      }
    },
    getFormula: (sheetId, row, col) => {
      const sheet = getSheetState(sheetId);
      return sheet.formulas.get(cellId(row, col));
    },
    clearFormula: (sheetId, row, col) => {
      const sheet = getSheetState(sheetId);
      const targetCell = cellId(row, col);
      const existingFormula = sheet.formulas.get(targetCell);
      if (existingFormula === undefined) {
        return;
      }

      setDependencies(sheet, targetCell, new Set());
      sheet.dependenciesByFormula.delete(targetCell);
      sheet.formulas.delete(targetCell);
    },
    handleCellEdit: (sheetId, row, col) => {
      const sheet = getSheetState(sheetId);
      const affectedFormulaCells = collectAffectedFormulaCells(sheet, [cellId(row, col)], false);
      recalculateFormulaCells(sheetId, affectedFormulaCells);
    },
    recalculate: (sheetId) => {
      const sheet = getSheetState(sheetId);
      recalculateFormulaCells(sheetId, sheet.formulas.keys());
    },
    removeSheet: (sheetId) => {
      sheets.delete(sheetId);
    }
  };
}
