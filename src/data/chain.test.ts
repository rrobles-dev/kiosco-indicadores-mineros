import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveReadings, type ChainDeps } from './chain';
import { INDICATOR_MODULES } from '../config/modules';
import type { ReadingCache } from './cache';
import type {
  IndicatorId,
  IndicatorReading,
  SourceAdapter,
} from '../types/indicators';

const NOW = new Date('2026-10-02T16:00:00.000Z'); // 2026-10-02 en Chile
const ALL: IndicatorId[] = ['uf', 'dolar', 'euro', 'utm', 'libra_cobre'];
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Readings = Partial<Record<IndicatorId, IndicatorReading>>;

function reading(
  id: IndicatorId,
  date: string,
  source: 'mindicador' | 'findic' | 'cache' = 'mindicador',
): IndicatorReading {
  return { id, current: { date, value: 100 }, source, fetchedAt: NOW.toISOString() };
}

function freshAll(source: 'mindicador' | 'findic'): Readings {
  return Object.fromEntries(
    ALL.map((id) => [id, reading(id, id === 'utm' ? '2026-10-01' : '2026-10-02', source)]),
  );
}

function memoryCache(initial: Readings = {}) {
  const store = new Map<IndicatorId, IndicatorReading>(
    Object.entries(initial) as Array<[IndicatorId, IndicatorReading]>,
  );
  const cache: ReadingCache & { writes: IndicatorReading[] } = {
    writes: [],
    read: (id) => store.get(id),
    write(r) {
      this.writes.push(r);
      store.set(r.id, r);
    },
  };
  return cache;
}

function adapter(
  id: 'mindicador' | 'findic',
  impl: SourceAdapter['fetchReadings'],
) {
  const fetchReadings = vi.fn(impl);
  return { id, fetchReadings } satisfies SourceAdapter;
}

function makeDeps(
  mindicador: SourceAdapter,
  findic: SourceAdapter,
  cache: ReadingCache = memoryCache(),
): ChainDeps {
  return {
    adapters: { mindicador, findic },
    cache,
    now: () => NOW,
    sleep,
    timeoutMs: 8000,
    retryDelaysMs: [2000, 4000, 8000],
  };
}

async function run(deps: ChainDeps, advanceMs = 0) {
  const promise = resolveReadings(INDICATOR_MODULES, deps);
  await vi.advanceTimersByTimeAsync(advanceMs);
  return promise;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveReadings', () => {
  it('CA-01: mindicador vigente para los cinco -> todos fresh y findic no se llama', async () => {
    const mind = adapter('mindicador', async () => freshAll('mindicador'));
    const find = adapter('findic', async () => ({}));
    const cache = memoryCache();

    const result = await run(makeDeps(mind, find, cache));

    for (const id of ALL) {
      expect(result[id].status).toBe('fresh');
      expect(result[id].reading?.source).toBe('mindicador');
    }
    expect(mind.fetchReadings).toHaveBeenCalledTimes(1);
    expect(mind.fetchReadings.mock.calls[0][0]).toEqual(ALL);
    expect(find.fetchReadings).not.toHaveBeenCalled();
    expect(cache.writes).toHaveLength(5);
  });

  it('CA-02: mindicador falla 4 veces con esperas 2s, 4s y 8s y luego usa findic', async () => {
    const callTimes: number[] = [];
    const mind = adapter('mindicador', async () => {
      callTimes.push(Date.now() - NOW.getTime());
      throw new Error('red');
    });
    const find = adapter('findic', async () => freshAll('findic'));

    const result = await run(makeDeps(mind, find), 14_000);

    expect(callTimes).toEqual([0, 2000, 6000, 14_000]);
    expect(find.fetchReadings).toHaveBeenCalledTimes(1);
    for (const id of ALL) {
      expect(result[id].status).toBe('fresh');
      expect(result[id].reading?.source).toBe('findic');
    }
  });

  it('CA-03: UF no vigente en mindicador -> una sola llamada y findic solo con uf', async () => {
    const mind = adapter('mindicador', async () => ({
      ...freshAll('mindicador'),
      uf: reading('uf', '2026-10-01'),
    }));
    const find = adapter('findic', async (ids) => {
      expect(ids).toEqual(['uf']);
      return { uf: reading('uf', '2026-10-02', 'findic') };
    });

    const result = await run(makeDeps(mind, find));

    expect(mind.fetchReadings).toHaveBeenCalledTimes(1);
    expect(find.fetchReadings).toHaveBeenCalledTimes(1);
    expect(find.fetchReadings.mock.calls[0][0]).toEqual(['uf']);
    expect(result.uf.status).toBe('fresh');
    expect(result.uf.reading?.source).toBe('findic');
    expect(result.dolar.reading?.source).toBe('mindicador');
  });

  it('CA-04: ambas fallan y hay caché -> stale con la lectura de caché', async () => {
    const cached = reading('uf', '2026-09-30', 'cache');
    const cache = memoryCache({ uf: cached });
    const mind = adapter('mindicador', async () => {
      throw new Error('red');
    });
    const find = adapter('findic', async () => {
      throw new Error('red');
    });

    const result = await run(makeDeps(mind, find, cache), 60_000);

    expect(result.uf).toEqual({ id: 'uf', status: 'stale', reading: cached });
    expect(result.dolar.status).toBe('empty');
    expect(cache.writes).toHaveLength(0);
  });

  it('CA-05: ambas fallan y no hay caché -> empty', async () => {
    const fail = async () => {
      throw new Error('red');
    };
    const result = await run(
      makeDeps(adapter('mindicador', fail), adapter('findic', fail)),
      60_000,
    );
    for (const id of ALL) expect(result[id]).toEqual({ id, status: 'empty' });
  });

  it('CA-09: una petición que nunca resuelve se aborta a los 8 s y cuenta como fallida', async () => {
    const signals: AbortSignal[] = [];
    const mind = adapter('mindicador', (_ids, signal) => {
      signals.push(signal);
      return new Promise(() => {});
    });
    const find = adapter('findic', async () => freshAll('findic'));

    const promise = resolveReadings(INDICATOR_MODULES, makeDeps(mind, find));
    await vi.advanceTimersByTimeAsync(7999);
    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(signals[0].aborted).toBe(true);

    // Segundo intento tras la espera de 2 s.
    await vi.advanceTimersByTimeAsync(2000);
    expect(signals).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(60_000);
    const result = await promise;
    expect(signals).toHaveLength(4);
    expect(signals.every((s) => s.aborted)).toBe(true);
    expect(result.uf.reading?.source).toBe('findic');
  });

  describe('D-12', () => {
    const staleOnSource = (date: string) =>
      adapter('mindicador', async () => ({ uf: reading('uf', date) }));
    const noFindic = () => adapter('findic', async () => ({}));

    it('dato no vigente de la fuente más nuevo que la caché -> se muestra el de la fuente', async () => {
      const cached = reading('uf', '2026-09-28', 'cache');
      const result = await run(
        makeDeps(staleOnSource('2026-10-01'), noFindic(), memoryCache({ uf: cached })),
      );
      expect(result.uf.status).toBe('stale');
      expect(result.uf.reading?.current.date).toBe('2026-10-01');
      expect(result.uf.reading?.source).toBe('mindicador');
    });

    it('dato no vigente de la fuente más antiguo que la caché -> se muestra la caché', async () => {
      const cached = reading('uf', '2026-10-01', 'cache');
      const result = await run(
        makeDeps(staleOnSource('2026-09-28'), noFindic(), memoryCache({ uf: cached })),
      );
      expect(result.uf).toEqual({ id: 'uf', status: 'stale', reading: cached });
    });

    it('entre dos fuentes no vigentes se muestra la más reciente', async () => {
      const mind = adapter('mindicador', async () => ({ uf: reading('uf', '2026-09-29') }));
      const find = adapter('findic', async () => ({ uf: reading('uf', '2026-09-30', 'findic') }));
      const result = await run(makeDeps(mind, find));
      expect(result.uf.reading?.source).toBe('findic');
    });
  });

  it('respuesta parcial: el faltante va a findic sin reintentar mindicador', async () => {
    const partial = freshAll('mindicador');
    delete partial.euro;
    const mind = adapter('mindicador', async () => partial);
    const find = adapter('findic', async () => ({ euro: reading('euro', '2026-10-02', 'findic') }));

    const result = await run(makeDeps(mind, find));

    expect(mind.fetchReadings).toHaveBeenCalledTimes(1);
    expect(find.fetchReadings.mock.calls[0][0]).toEqual(['euro']);
    expect(result.euro.reading?.source).toBe('findic');
    expect(result.uf.reading?.source).toBe('mindicador');
  });

  it('la caché se escribe solo con lecturas vigentes', async () => {
    const mind = adapter('mindicador', async () => ({
      ...freshAll('mindicador'),
      uf: reading('uf', '2026-10-01'),
    }));
    const find = adapter('findic', async () => ({ uf: reading('uf', '2026-09-30', 'findic') }));
    const cache = memoryCache();

    const result = await run(makeDeps(mind, find, cache));

    expect(result.uf.status).toBe('stale');
    expect(cache.writes.map((r) => r.id).sort()).toEqual(['dolar', 'euro', 'libra_cobre', 'utm']);
  });
});
