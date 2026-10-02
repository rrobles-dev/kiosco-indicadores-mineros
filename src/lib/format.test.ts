import { describe, expect, it } from 'vitest';
import { formatDate, formatPercent, formatValue } from './format';

describe('formatPercent', () => {
  it('usa coma decimal y 2 decimales', () => {
    expect(formatPercent(1.2345)).toBe('1,23%');
    expect(formatPercent(0)).toBe('0,00%');
  });
});

describe('formatValue', () => {
  it.each([
    [41073.57, 'CLP', 2, '$41.073,57'],
    [983.84, 'CLP', 2, '$983,84'],
    [1104.57, 'CLP', 2, '$1.104,57'],
    [72151, 'CLP', 0, '$72.151'],
    [6.56, 'USD_PER_LB', 2, 'US$ 6,56 /lb'],
  ] as const)('%s %s con %s decimales -> %s', (value, unit, decimals, expected) => {
    expect(formatValue(value, unit, decimals)).toBe(expected);
  });

  it('mantiene los decimales fijos aunque el valor sea entero', () => {
    expect(formatValue(41000, 'CLP', 2)).toBe('$41.000,00');
  });
});

describe('formatDate', () => {
  it('convierte YYYY-MM-DD a dd-mm-aaaa', () => {
    expect(formatDate('2026-10-02')).toBe('02-10-2026');
  });
});
