const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Convierte un instante ISO en UTC a YYYY-MM-DD en America/Santiago. */
export function toSantiagoDate(isoUtc: string): string {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Fecha inválida: ${isoUtc}`);
  }
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Valida formato YYYY-MM-DD y existencia en el calendario, sin interpretarla como instante. */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

const clockFormatter = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Fecha y hora en America/Santiago, p. ej. "viernes 02-10-2026 · 17:45". */
export function formatSantiagoClock(date: Date): string {
  const parts = Object.fromEntries(
    clockFormatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.weekday.toLowerCase()} ${parts.day}-${parts.month}-${parts.year} · ${parts.hour}:${parts.minute}`;
}

/**
 * Milisegundos hasta el inicio del minuto siguiente. Chile tiene desfases de horas
 * enteras, así que el cambio de minuto local coincide con el de UTC.
 */
export function msUntilNextMinute(date: Date): number {
  return 60_000 - (date.getTime() % 60_000);
}
