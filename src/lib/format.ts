import type { IndicatorModuleConfig } from '../types/indicators';

const formatters = new Map<number, Intl.NumberFormat>();

function numberFormat(decimals: number): Intl.NumberFormat {
  let formatter = formatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat('es-CL', {
      style: 'decimal',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      // es-CL no agrupa los números de 4 cifras por defecto.
      useGrouping: 'always',
    });
    formatters.set(decimals, formatter);
  }
  return formatter;
}

export function formatValue(
  value: number,
  unit: IndicatorModuleConfig['unit'],
  decimals: number,
): string {
  const text = numberFormat(decimals).format(value);
  return unit === 'USD_PER_LB' ? `US$ ${text} /lb` : `$${text}`;
}

/** Convierte "YYYY-MM-DD" a "dd-mm-aaaa" separando el texto, sin pasar por Date. */
export function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}-${month}-${year}`;
}
