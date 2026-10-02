import { toSantiagoDate } from '../../lib/dates';
import type {
  IndicatorId,
  IndicatorReading,
  SourceAdapter,
} from '../../types/indicators';

const MINDICADOR_URL = 'https://mindicador.cl/api';

const SUPPORTED_IDS: IndicatorId[] = ['uf', 'dolar', 'euro', 'utm', 'libra_cobre'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseMindicadorSummary(
  raw: unknown,
  fetchedAt: string,
): Partial<Record<IndicatorId, IndicatorReading>> {
  if (!isRecord(raw)) {
    throw new Error('Respuesta de mindicador no es un objeto');
  }

  const result: Partial<Record<IndicatorId, IndicatorReading>> = {};
  for (const id of SUPPORTED_IDS) {
    const item = raw[id];
    if (!isRecord(item)) continue;
    const { valor, fecha } = item;
    if (typeof valor !== 'number' || !Number.isFinite(valor)) continue;
    if (typeof fecha !== 'string') continue;
    let date: string;
    try {
      date = toSantiagoDate(fecha);
    } catch {
      continue;
    }
    result[id] = {
      id,
      current: { date, value: valor },
      source: 'mindicador',
      fetchedAt,
    };
  }
  return result;
}

export const mindicadorAdapter: SourceAdapter = {
  id: 'mindicador',
  async fetchReadings(ids, signal) {
    const response = await fetch(MINDICADOR_URL, { signal });
    if (!response.ok) {
      throw new Error(`mindicador respondió con HTTP ${response.status}`);
    }
    const parsed = parseMindicadorSummary(
      await response.json(),
      new Date().toISOString(),
    );
    const filtered: Partial<Record<IndicatorId, IndicatorReading>> = {};
    for (const id of ids) {
      const reading = parsed[id];
      if (reading) filtered[id] = reading;
    }
    return filtered;
  },
};
