import type {
  IndicatorId,
  IndicatorModuleConfig,
  IndicatorModuleState,
  IndicatorReading,
  SourceAdapter,
  SourceId,
} from '../types/indicators';
import type { ReadingCache } from './cache';
import { isFresh } from './freshness';

type FetchedSourceId = Exclude<SourceId, 'cache'>;

export interface ChainDeps {
  adapters: Record<FetchedSourceId, SourceAdapter>;
  cache: ReadingCache;
  now(): Date;
  sleep(ms: number): Promise<void>;
  timeoutMs: number;
  /** Esperas entre intentos; la cantidad de intentos es su largo + 1. */
  retryDelaysMs: number[];
}

type Readings = Partial<Record<IndicatorId, IndicatorReading>>;

async function attempt(
  adapter: SourceAdapter,
  ids: IndicatorId[],
  deps: ChainDeps,
): Promise<Readings> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = deps.sleep(deps.timeoutMs).then(() => {
    timedOut = true;
    controller.abort();
    return undefined;
  });
  const result = await Promise.race([
    adapter.fetchReadings(ids, controller.signal),
    timeout,
  ]);
  if (timedOut || result === undefined) {
    throw new Error(`Timeout de ${deps.timeoutMs} ms en ${adapter.id}`);
  }
  return result;
}

/** Devuelve las lecturas de la fuente, o undefined si se agotaron los intentos. */
async function fetchWithRetry(
  adapter: SourceAdapter,
  ids: IndicatorId[],
  deps: ChainDeps,
): Promise<Readings | undefined> {
  for (let i = 0; i <= deps.retryDelaysMs.length; i++) {
    try {
      return await attempt(adapter, ids, deps);
    } catch {
      if (i < deps.retryDelaysMs.length) await deps.sleep(deps.retryDelaysMs[i]);
    }
  }
  return undefined;
}

export async function resolveReadings(
  configs: IndicatorModuleConfig[],
  deps: ChainDeps,
): Promise<Record<IndicatorId, IndicatorModuleState>> {
  const byId = new Map(configs.map((c) => [c.id, c]));
  const states: Partial<Record<IndicatorId, IndicatorModuleState>> = {};
  const candidates = new Map<IndicatorId, IndicatorReading>();
  let pending = configs.map((c) => c.id);

  // El orden de cada config manda: se agrupa por posición en su lista de fuentes.
  const maxDepth = Math.max(0, ...configs.map((c) => c.sources.length));
  for (let depth = 0; depth < maxDepth; depth++) {
    const bySource = new Map<FetchedSourceId, IndicatorId[]>();
    for (const id of pending) {
      const source = byId.get(id)!.sources[depth];
      if (source) bySource.set(source, [...(bySource.get(source) ?? []), id]);
    }

    for (const [source, ids] of bySource) {
      const readings = await fetchWithRetry(deps.adapters[source], ids, deps);
      if (!readings) continue;
      for (const id of ids) {
        const reading = readings[id];
        if (!reading) continue;
        if (isFresh(reading.current.date, byId.get(id)!.freshness, deps.now())) {
          states[id] = { id, status: 'fresh', reading };
          deps.cache.write(reading);
        } else {
          const best = candidates.get(id);
          if (!best || reading.current.date > best.current.date) candidates.set(id, reading);
        }
      }
    }
    pending = pending.filter((id) => !states[id]);
  }

  // D-12: en stale se muestra la lectura más reciente entre candidatos y caché.
  for (const id of pending) {
    const candidate = candidates.get(id);
    const cached = deps.cache.read(id);
    const best =
      candidate && cached
        ? cached.current.date > candidate.current.date
          ? cached
          : candidate
        : (candidate ?? cached);
    states[id] = best ? { id, status: 'stale', reading: best } : { id, status: 'empty' };
  }

  return states as Record<IndicatorId, IndicatorModuleState>;
}
