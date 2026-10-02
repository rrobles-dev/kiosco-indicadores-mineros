import type {
  IndicatorId,
  IndicatorReading,
  Observation,
  SourceAdapter,
} from '../../types/indicators';

const FINDIC_URL = 'https://findic.cl/api';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Valida formato y existencia en el calendario sin interpretar la fecha como instante.
function isCalendarDate(value: unknown): value is string {
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

export function parseFindicSeries(
  raw: unknown,
  id: IndicatorId,
  fetchedAt: string,
): IndicatorReading {
  if (!isRecord(raw)) {
    throw new Error('Respuesta de findic no es un objeto');
  }
  if (raw.codigo !== id) {
    throw new Error(`findic devolvió el código ${String(raw.codigo)} en vez de ${id}`);
  }
  if (!Array.isArray(raw.serie)) {
    throw new Error('Respuesta de findic sin serie');
  }

  const series: Observation[] = [];
  for (const item of raw.serie as unknown[]) {
    if (!isRecord(item)) continue;
    const { fecha, valor } = item;
    if (!isCalendarDate(fecha)) continue;
    if (typeof valor !== 'number' || !Number.isFinite(valor)) continue;
    series.push({ date: fecha, value: valor });
  }
  if (series.length === 0) {
    throw new Error(`findic no entregó observaciones válidas para ${id}`);
  }

  // YYYY-MM-DD ordena cronológicamente como texto.
  series.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return {
    id,
    current: series[series.length - 1],
    series,
    source: 'findic',
    fetchedAt,
  };
}

export const findicAdapter: SourceAdapter = {
  id: 'findic',
  async fetchReadings(ids, signal) {
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await fetch(`${FINDIC_URL}/${id}`, { signal });
        if (!response.ok) {
          throw new Error(`findic respondió con HTTP ${response.status} para ${id}`);
        }
        return parseFindicSeries(await response.json(), id, new Date().toISOString());
      }),
    );

    const readings: Partial<Record<IndicatorId, IndicatorReading>> = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') readings[ids[index]] = result.value;
    });
    if (ids.length > 0 && Object.keys(readings).length === 0) {
      throw new Error('findic falló para todos los indicadores pedidos');
    }
    return readings;
  },
};
