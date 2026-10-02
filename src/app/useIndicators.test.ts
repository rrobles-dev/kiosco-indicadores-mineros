// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { INDICATOR_MODULES } from '../config/modules';
import type { ReadingCache } from '../data/cache';
import type { IndicatorId, IndicatorReading, SourceAdapter } from '../types/indicators';
import { useIndicators, type UseIndicatorsDeps } from './useIndicators';

afterEach(cleanup);

const NOW = new Date('2026-10-02T16:00:00.000Z'); // 2026-10-02 en Chile

const reading = (id: IndicatorId, date: string): IndicatorReading => ({
  id,
  current: { date, value: 100 },
  source: 'mindicador',
  fetchedAt: NOW.toISOString(),
});

function makeDeps(
  cached: Partial<Record<IndicatorId, IndicatorReading>>,
  fetchReadings: SourceAdapter['fetchReadings'],
): UseIndicatorsDeps {
  const cache: ReadingCache = { read: (id) => cached[id], write: vi.fn() };
  const mindicador: SourceAdapter = { id: 'mindicador', fetchReadings };
  const findic: SourceAdapter = {
    id: 'findic',
    fetchReadings: () => Promise.reject(new Error('sin respaldo')),
  };
  return {
    configs: INDICATOR_MODULES,
    adapters: { mindicador, findic },
    cache,
    now: () => NOW,
    sleep: () => new Promise(() => {}), // la prueba no depende de esperas ni timeouts
    timeoutMs: 8000,
    retryDelaysMs: [],
  };
}

const never = () => new Promise<never>(() => {});

describe('useIndicators', () => {
  it('estado inicial: caché vigente -> fresh, no vigente -> stale, sin caché -> loading', () => {
    const deps = makeDeps(
      { uf: reading('uf', '2026-10-02'), dolar: reading('dolar', '2026-09-01') },
      never,
    );
    const { result } = renderHook(() => useIndicators(deps));

    expect(result.current.uf.status).toBe('fresh');
    expect(result.current.dolar.status).toBe('stale');
    expect(result.current.euro).toEqual({ id: 'euro', status: 'loading' });
    expect(result.current.dolar.reading?.current.date).toBe('2026-09-01');
  });

  it('se actualiza tras el primer ciclo', async () => {
    const deps = makeDeps({ uf: reading('uf', '2026-09-01') }, async () => ({
      uf: reading('uf', '2026-10-02'),
      dolar: reading('dolar', '2026-10-02'),
    }));
    const { result } = renderHook(() => useIndicators(deps));
    expect(result.current.uf.status).toBe('stale');

    await waitFor(() => expect(result.current.uf.status).toBe('fresh'));
    expect(result.current.dolar.status).toBe('fresh');
    expect(result.current.euro.status).toBe('empty');
  });

  it('al desmontar no actualiza el estado ni sigue el scheduler', async () => {
    let finish: (value: Partial<Record<IndicatorId, IndicatorReading>>) => void = () => {};
    const fetchReadings = vi.fn(
      () => new Promise<Partial<Record<IndicatorId, IndicatorReading>>>((resolve) => (finish = resolve)),
    );
    const deps = makeDeps({}, fetchReadings);
    const { result, unmount } = renderHook(() => useIndicators(deps));
    const before = result.current;
    unmount();
    await act(async () => finish({ uf: reading('uf', '2026-10-02') }));
    expect(result.current).toBe(before);
  });
});
