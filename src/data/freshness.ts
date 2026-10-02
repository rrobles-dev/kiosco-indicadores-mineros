import { toSantiagoDate } from '../lib/dates';
import type { FreshnessRule } from '../types/indicators';

function parseDay(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
}

function dayNumber(date: string): number {
  const { year, month, day } = parseDay(date);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/** `date` es YYYY-MM-DD; "hoy" se calcula en America/Santiago a partir de `now`. */
export function isFresh(date: string, rule: FreshnessRule, now: Date): boolean {
  const today = toSantiagoDate(now.toISOString());
  const ageDays = dayNumber(today) - dayNumber(date);
  if (ageDays < 0) return false;

  switch (rule.kind) {
    case 'sameDay':
      return date === today;
    case 'maxAgeDays':
      return ageDays <= rule.days;
    case 'sameMonth': {
      const a = parseDay(date);
      const b = parseDay(today);
      return a.year === b.year && a.month === b.month;
    }
  }
}
