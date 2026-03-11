import { describe, expect, it } from 'vitest';
import { evaluateFormula, extractFormulaDependencies } from '../spreadsheet/formula-evaluator';

describe('evaluateFormula', () => {
  it('evaluates binary expressions with cell references', () => {
    const formula = '=A1+B1';
    const result = evaluateFormula(formula, {
      getCellValue: (cell: string) => {
        if (cell === 'A1') {
          return 10;
        }
        if (cell === 'B1') {
          return 5;
        }

        return undefined;
      }
    });

    expect(result).toBe(15);
  });

  it('evaluates SUM over ranges', () => {
    const formula = '=SUM(A1:A3)';
    const result = evaluateFormula(formula, {
      getCellValue: (cell: string) => {
        if (cell === 'A1') {
          return 1;
        }
        if (cell === 'A2') {
          return 2;
        }
        if (cell === 'A3') {
          return 3;
        }

        return undefined;
      }
    });

    expect(result).toBe(6);
  });

  it('evaluates AVG over ranges', () => {
    const formula = '=AVG(B1:B3)';
    const result = evaluateFormula(formula, {
      getCellValue: (cell: string) => {
        if (cell === 'B1') {
          return 3;
        }
        if (cell === 'B2') {
          return 6;
        }
        if (cell === 'B3') {
          return 9;
        }

        return undefined;
      }
    });

    expect(result).toBe(6);
  });

  it('rejects malformed numeric literals', () => {
    expect(() =>
      evaluateFormula('=1..2+A1', {
        getCellValue: () => 0
      })
    ).toThrow(/Invalid numeric literal/);
  });

  it('rejects invalid references like A0', () => {
    expect(() =>
      evaluateFormula('=A0+B1', {
        getCellValue: () => 0
      })
    ).toThrow(/Invalid cell reference/);
  });
});

describe('extractFormulaDependencies', () => {
  it('collects referenced cells from expressions and ranges', () => {
    const dependencies = extractFormulaDependencies('=A1+B1+SUM(A2:A3)+AVG(C1:C2)');

    expect(dependencies).toEqual(['A1', 'B1', 'A2', 'A3', 'C1', 'C2']);
  });
});
