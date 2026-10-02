import { isCalendarDate } from '../lib/dates';
import type { IndicatorId, IndicatorReading } from '../types/indicators';

export interface ReadingCache {
  read(id: IndicatorId): IndicatorReading | undefined;
  write(reading: IndicatorReading): void;
}

const keyOf = (id: IndicatorId) => `kiosco:v1:reading:${id}`;

function isValidReading(value: unknown, id: IndicatorId): value is IndicatorReading {
  if (typeof value !== 'object' || value === null) return false;
  const reading = value as Partial<IndicatorReading>;
  const current = reading.current;
  return (
    reading.id === id &&
    typeof current === 'object' &&
    current !== null &&
    typeof current.value === 'number' &&
    Number.isFinite(current.value) &&
    isCalendarDate(current.date)
  );
}

export function createReadingCache(storage: Storage): ReadingCache {
  return {
    read(id) {
      try {
        const raw = storage.getItem(keyOf(id));
        if (raw === null) return undefined;
        const parsed: unknown = JSON.parse(raw);
        if (isValidReading(parsed, id)) return parsed;
        storage.removeItem(keyOf(id));
      } catch {
        try {
          storage.removeItem(keyOf(id));
        } catch {
          // Storage bloqueado: se trata como si no hubiera caché.
        }
      }
      return undefined;
    },
    write(reading) {
      try {
        storage.setItem(keyOf(reading.id), JSON.stringify(reading));
      } catch {
        // Cuota llena o acceso bloqueado: la caché nunca debe romper el ciclo.
      }
    },
  };
}
