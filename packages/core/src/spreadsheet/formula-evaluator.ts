import { expandRange, parseFormula, type FormulaAstNode } from './formula-parser';
import type { FormulaEvaluationOptions } from './types';

export function evaluateFormula(formula: string, options: FormulaEvaluationOptions): number {
  const ast = parseFormula(formula);
  return evaluateAst(ast, options);
}

export function extractFormulaDependencies(formula: string): string[] {
  const ast = parseFormula(formula);
  const dependencies = new Set<string>();
  collectDependencies(ast, dependencies);
  return Array.from(dependencies);
}

function evaluateAst(node: FormulaAstNode, options: FormulaEvaluationOptions): number {
  if (node.type === 'number') {
    return node.value;
  }

  if (node.type === 'reference') {
    return toNumber(options.getCellValue(node.cell));
  }

  if (node.type === 'binary') {
    const left = evaluateAst(node.left, options);
    const right = evaluateAst(node.right, options);

    if (node.operator === '+') {
      return left + right;
    }
    if (node.operator === '-') {
      return left - right;
    }
    if (node.operator === '*') {
      return left * right;
    }
    return left / right;
  }

  if (node.type === 'range') {
    throw new Error('Range nodes are only valid inside function calls');
  }

  if (node.type !== 'function') {
    throw new Error('Unsupported formula node');
  }

  const values = node.args.flatMap((arg) => {
    if (arg.type === 'range') {
      return expandRange(arg.start, arg.end).map((cell) => toNumber(options.getCellValue(cell)));
    }

    return [evaluateAst(arg, options)];
  });

  if (node.name === 'SUM') {
    return values.reduce((total, value) => total + value, 0);
  }

  if (node.name === 'AVG') {
    if (values.length === 0) {
      return 0;
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
  }

  throw new Error(`Unsupported formula function: ${node.name}`);
}

function collectDependencies(node: FormulaAstNode, dependencies: Set<string>): void {
  if (node.type === 'reference') {
    dependencies.add(node.cell);
    return;
  }

  if (node.type === 'range') {
    for (const cell of expandRange(node.start, node.end)) {
      dependencies.add(cell);
    }
    return;
  }

  if (node.type === 'binary') {
    collectDependencies(node.left, dependencies);
    collectDependencies(node.right, dependencies);
    return;
  }

  if (node.type === 'function') {
    for (const arg of node.args) {
      collectDependencies(arg, dependencies);
    }
  }
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  return 0;
}
