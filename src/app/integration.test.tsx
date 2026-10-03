// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INDICATOR_MODULES } from '../config/modules';
import { recepcion } from '../config/profiles';
import type { ReadingCache } from '../data/cache';
import type { IndicatorId, IndicatorReading, SourceAdapter } from '../types/indicators';
import { ProfileLayout } from './ProfileLayout';
import { useIndicators, type UseIndicatorsDeps } from './useIndicators';

// Une el ciclo de datos con la rotación, como App, pero con dependencias inyectadas.

const NOW = new Date('2026-10-02T16:00:00.000Z'); // 2026-10-02 en Chile
const IDS: IndicatorId[] = ['uf', 'dolar', 'euro', 'utm', 'libra_cobre'];

const reading = (id: IndicatorId, date: string): IndicatorReading => ({
  id,
  current: { date, value: 100 },
  source: 'mindicador',
  fetchedAt: NOW.toISOString(),
});

function makeDeps(
  cachedDate: string,
  fetchReadings: SourceAdapter['fetchReadings'],
  sleep: (ms: number) => Promise<void>,
): UseIndicatorsDeps {
  const cache: ReadingCache = { read: (id) => reading(id, cachedDate), write: vi.fn() };
  return {
    configs: INDICATOR_MODULES,
    adapters: {
      mindicador: { id: 'mindicador', fetchReadings },
      findic: { id: 'findic', fetchReadings },
    },
    cache,
    now: () => NOW,
    sleep,
    timeoutMs: 8000,
    retryDelaysMs: [2000, 4000, 8000],
  };
}

function Kiosk({ deps }: { deps: UseIndicatorsDeps }) {
  const states = useIndicators(deps);
  return (
    <ProfileLayout profile={recepcion} configs={INDICATOR_MODULES} states={states} random={() => 0} />
  );
}

const label = (id: IndicatorId) => INDICATOR_MODULES.find((c) => c.id === id)!.label;
const main = () => within(screen.getByRole('main'));
const strip = () => within(screen.getByRole('complementary', { name: 'Indicadores' }));
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const flush = () =>
  act(async () => {
    for (let i = 0; i < 200; i++) await Promise.resolve();
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ciclo de datos y rotación', () => {
  it('CA-13: con un ciclo en curso la rotación sigue y la pantalla conserva sus datos', () => {
    const fetchReadings = vi.fn<SourceAdapter['fetchReadings']>(() => new Promise(() => {}));
    // Ni la fuente ni el timeout resuelven: el ciclo queda en curso toda la prueba.
    const deps = makeDeps('2026-10-02', fetchReadings, () => new Promise(() => {}));
    render(<Kiosk deps={deps} />);

    expect(fetchReadings).toHaveBeenCalledTimes(1);
    expect(main().getByRole('heading', { name: label('libra_cobre') })).toBeInTheDocument();
    expect(main().getByText('US$ 100,00 /lb')).toBeInTheDocument();

    advance(15_000);
    expect(main().getByRole('heading', { name: label('dolar') })).toBeInTheDocument();
    expect(main().getByRole('heading', { name: label('euro') })).toBeInTheDocument();
    expect(main().getAllByText('$100,00')).toHaveLength(2);

    // La franja sigue con los cinco indicadores, sin vaciarse ni pasar a "cargando".
    for (const id of IDS) expect(strip().getByText(label(id))).toBeInTheDocument();
    expect(fetchReadings).toHaveBeenCalledTimes(1);
  });

  it('sin red, el ciclo termina en stale con la caché y la rotación continúa', async () => {
    const fetchReadings = vi.fn<SourceAdapter['fetchReadings']>(() =>
      Promise.reject(new TypeError('Failed to fetch')),
    );
    const deps = makeDeps('2026-10-01', fetchReadings, () => Promise.resolve());
    render(<Kiosk deps={deps} />);
    await flush();

    // 4 intentos en mindicador, 4 en findic y 1 de series (D-15).
    expect(fetchReadings).toHaveBeenCalledTimes(9);
    expect(main().getByText('Actualizado el 01-10-2026')).toBeInTheDocument();

    advance(15_000);
    expect(main().getByRole('heading', { name: label('dolar') })).toBeInTheDocument();
    expect(main().getAllByText('Actualizado el 01-10-2026')).toHaveLength(2);
  });
});
