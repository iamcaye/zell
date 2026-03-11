import type { CellValue } from '../types';

export interface CurrencyCellFormat {
  type: 'currency';
  currency?: string;
  locale?: string;
}

export interface PercentageCellFormat {
  type: 'percentage';
  decimals?: number;
}

export interface DateCellFormat {
  type: 'date';
}

export interface CustomCellFormat {
  type: 'custom';
  formatter(value: CellValue): string;
}

export type CellFormat = CurrencyCellFormat | PercentageCellFormat | DateCellFormat | CustomCellFormat;

export function formatCellValue(value: CellValue, format?: CellFormat): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (!format) {
    return value instanceof Date ? value.toISOString() : String(value);
  }

  if (format.type === 'currency') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return String(value);
    }

    return new Intl.NumberFormat(format.locale ?? 'en-US', {
      style: 'currency',
      currency: format.currency ?? 'USD'
    }).format(value);
  }

  if (format.type === 'percentage') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return String(value);
    }

    const decimals = Math.max(0, format.decimals ?? 0);
    return `${(value * 100).toFixed(decimals)}%`;
  }

  if (format.type === 'date') {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }

    return String(value);
  }

  return format.formatter(value);
}
