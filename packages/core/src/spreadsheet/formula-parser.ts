import type { CellAddress, CellRangeAddress, FormulaBinaryOperator } from './types';

type FormulaToken =
  | { type: 'number'; value: number }
  | { type: 'reference'; value: string }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: FormulaBinaryOperator }
  | { type: 'colon' }
  | { type: 'comma' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'eof' };

export type FormulaAstNode =
  | { type: 'number'; value: number }
  | { type: 'reference'; cell: string }
  | { type: 'binary'; operator: FormulaBinaryOperator; left: FormulaAstNode; right: FormulaAstNode }
  | { type: 'range'; start: string; end: string }
  | { type: 'function'; name: string; args: FormulaAstNode[] };

const CELL_REFERENCE_PATTERN = /^[A-Z]+[1-9]\d*$/;

export function parseCellAddress(reference: string): CellAddress {
  const normalized = reference.trim().toUpperCase();
  if (!CELL_REFERENCE_PATTERN.test(normalized)) {
    throw new Error(`Invalid cell reference: ${reference}`);
  }

  const match = /^([A-Z]+)(\d+)$/.exec(normalized);
  if (!match) {
    throw new Error(`Invalid cell reference: ${reference}`);
  }

  const columnLetters = match[1] ?? '';
  const rowDigits = match[2] ?? '0';
  let col = 0;
  for (const char of columnLetters) {
    col = col * 26 + (char.charCodeAt(0) - 64);
  }

  return {
    row: Number(rowDigits) - 1,
    col: col - 1
  };
}

export function formatCellAddress(address: CellAddress): string {
  if (address.row < 0 || address.col < 0) {
    throw new Error('Cell coordinates must be non-negative');
  }

  let columnIndex = address.col + 1;
  let columnName = '';
  while (columnIndex > 0) {
    const remainder = (columnIndex - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    columnIndex = Math.floor((columnIndex - 1) / 26);
  }

  return `${columnName}${address.row + 1}`;
}

export function expandRange(startReference: string, endReference: string): string[] {
  const start = parseCellAddress(startReference);
  const end = parseCellAddress(endReference);
  return expandRangeAddresses({ start, end });
}

export function expandRangeAddresses(range: CellRangeAddress): string[] {
  const rowStart = Math.min(range.start.row, range.end.row);
  const rowEnd = Math.max(range.start.row, range.end.row);
  const colStart = Math.min(range.start.col, range.end.col);
  const colEnd = Math.max(range.start.col, range.end.col);
  const references: string[] = [];

  for (let row = rowStart; row <= rowEnd; row += 1) {
    for (let col = colStart; col <= colEnd; col += 1) {
      references.push(formatCellAddress({ row, col }));
    }
  }

  return references;
}

export function parseFormula(formula: string): FormulaAstNode {
  const tokens = tokenizeFormula(formula);
  let cursor = 0;

  const current = () => tokens[cursor] ?? { type: 'eof' as const };
  const consume = () => {
    const token = current();
    cursor += 1;
    return token;
  };

  const expect = (type: FormulaToken['type']): FormulaToken => {
    const token = consume();
    if (token.type !== type) {
      throw new Error(`Unexpected token: expected ${type}, received ${token.type}`);
    }
    return token;
  };

  const parseExpression = (): FormulaAstNode => {
    let node = parseTerm();
    while (true) {
      const operator = current();
      if (operator.type !== 'operator' || (operator.value !== '+' && operator.value !== '-')) {
        break;
      }

      consume();
      node = {
        type: 'binary',
        operator: operator.value,
        left: node,
        right: parseTerm()
      };
    }
    return node;
  };

  const parseTerm = (): FormulaAstNode => {
    let node = parseFactor();
    while (true) {
      const operator = current();
      if (operator.type !== 'operator' || (operator.value !== '*' && operator.value !== '/')) {
        break;
      }

      consume();
      node = {
        type: 'binary',
        operator: operator.value,
        left: node,
        right: parseFactor()
      };
    }
    return node;
  };

  const parseFunction = (name: string): FormulaAstNode => {
    expect('lparen');
    const args: FormulaAstNode[] = [];
    if (current().type !== 'rparen') {
      while (true) {
        const token = current();
        if (token.type === 'reference' && tokens[cursor + 1]?.type === 'colon') {
          const start = expect('reference');
          expect('colon');
          const end = expect('reference');
          if (start.type !== 'reference' || end.type !== 'reference') {
            throw new Error('Invalid range expression');
          }
          args.push({ type: 'range', start: start.value, end: end.value });
        } else {
          args.push(parseExpression());
        }

        if (current().type !== 'comma') {
          break;
        }
        consume();
      }
    }
    expect('rparen');

    return {
      type: 'function',
      name: name.toUpperCase(),
      args
    };
  };

  const parseFactor = (): FormulaAstNode => {
    const token = consume();
    if (token.type === 'number') {
      return { type: 'number', value: token.value };
    }

    if (token.type === 'reference') {
      return { type: 'reference', cell: token.value };
    }

    if (token.type === 'identifier') {
      if (current().type !== 'lparen') {
        throw new Error(`Unexpected identifier: ${token.value}`);
      }
      return parseFunction(token.value);
    }

    if (token.type === 'lparen') {
      const expression = parseExpression();
      expect('rparen');
      return expression;
    }

    throw new Error(`Unexpected token type: ${token.type}`);
  };

  const ast = parseExpression();
  if (current().type !== 'eof') {
    throw new Error(`Unexpected trailing token: ${current().type}`);
  }

  return ast;
}

function tokenizeFormula(formula: string): FormulaToken[] {
  const source = formula.trim().startsWith('=') ? formula.trim().slice(1) : formula.trim();
  const tokens: FormulaToken[] = [];
  let index = 0;
  const isDigit = (value: string) => value >= '0' && value <= '9';
  const isLetter = (value: string) =>
    (value >= 'A' && value <= 'Z') || (value >= 'a' && value <= 'z');

  while (index < source.length) {
    const char = source.charAt(index);

    if (char === ' ' || char === '\t' || char === '\n') {
      index += 1;
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'lparen' });
      index += 1;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'rparen' });
      index += 1;
      continue;
    }

    if (char === ':') {
      tokens.push({ type: 'colon' });
      index += 1;
      continue;
    }

    if (char === ',') {
      tokens.push({ type: 'comma' });
      index += 1;
      continue;
    }

    if (isDigit(char)) {
      let end = index;
      while (end < source.length) {
        const next = source.charAt(end);
        if (!(isDigit(next) || next === '.')) {
          break;
        }
        end += 1;
      }

      const literal = source.slice(index, end);
      if (!/^\d+(\.\d+)?$/.test(literal)) {
        throw new Error(`Invalid numeric literal: ${literal}`);
      }

      tokens.push({ type: 'number', value: Number(literal) });
      index = end;
      continue;
    }

    if (isLetter(char)) {
      let end = index;
      while (end < source.length && isLetter(source.charAt(end))) {
        end += 1;
      }

      const letters = source.slice(index, end);
      let digitEnd = end;
      while (digitEnd < source.length && isDigit(source.charAt(digitEnd))) {
        digitEnd += 1;
      }

      if (digitEnd > end) {
        const reference = `${letters.toUpperCase()}${source.slice(end, digitEnd)}`;
        if (!CELL_REFERENCE_PATTERN.test(reference)) {
          throw new Error(`Invalid cell reference: ${reference}`);
        }

        tokens.push({ type: 'reference', value: reference });
        index = digitEnd;
      } else {
        tokens.push({ type: 'identifier', value: letters.toUpperCase() });
        index = end;
      }

      continue;
    }

    throw new Error(`Unexpected token in formula: ${char}`);
  }

  tokens.push({ type: 'eof' });
  return tokens;
}
