import { afterEach, describe, expect, it, vi } from 'vitest';
import { mindicadorAdapter, parseMindicadorSummary } from './mindicador';
import fixture from './__fixtures__/mindicador-resumen.json';

const FETCHED_AT = '2026-10-02T19:00:00.000Z';
const IDS = ['uf', 'dolar', 'euro', 'utm', 'libra_cobre'] as const;

function clone(): Record<string, unknown> {
  return structuredClone(fixture) as Record<string, unknown>;
}

describe('parseMindicadorSummary', () => {
  it('normaliza los cinco indicadores con fecha en America/Santiago', () => {
    const result = parseMindicadorSummary(fixture, FETCHED_AT);
    expect(Object.keys(result).sort()).toEqual([...IDS].sort());
    for (const id of IDS) {
      const reading = result[id];
      expect(reading).toEqual({
        id,
        current: {
          // Las fechas de la fixture son medianoche de Chile (T03:00Z, UTC-3)
          date: fixture[id].fecha.slice(0, 10),
          value: fixture[id].valor,
        },
        source: 'mindicador',
        fetchedAt: FETCHED_AT,
      });
      expect(reading).not.toHaveProperty('series');
    }
  });

  it('convierte la fecha con la zona America/Santiago, no truncando el ISO', () => {
    const raw = clone();
    raw.uf = { ...fixture.uf, fecha: '2026-10-02T02:30:00.000Z' };
    const result = parseMindicadorSummary(raw, FETCHED_AT);
    expect(result.uf?.current.date).toBe('2026-10-01');
  });

  it('omite un indicador ausente sin romper los demás', () => {
    const raw = clone();
    delete raw.euro;
    const result = parseMindicadorSummary(raw, FETCHED_AT);
    expect(result.euro).toBeUndefined();
    expect(Object.keys(result).sort()).toEqual(['dolar', 'libra_cobre', 'uf', 'utm']);
  });

  it.each([null, 'abc', Number.NaN, Infinity])(
    'omite un indicador con valor no finito (%s)',
    (valor) => {
      const raw = clone();
      raw.dolar = { ...fixture.dolar, valor };
      const result = parseMindicadorSummary(raw, FETCHED_AT);
      expect(result.dolar).toBeUndefined();
      expect(result.uf?.current.value).toBe(fixture.uf.valor);
    },
  );

  it.each([null, 'texto', 42, [1, 2]])('lanza error si raw no es objeto (%j)', (raw) => {
    expect(() => parseMindicadorSummary(raw, FETCHED_AT)).toThrow();
  });
});

describe('mindicadorAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hace fetch con el signal y delega en el parser', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(fixture),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { signal } = new AbortController();

    const result = await mindicadorAdapter.fetchReadings([...IDS], signal);

    expect(fetchMock).toHaveBeenCalledWith('https://mindicador.cl/api', { signal });
    expect(result.uf?.current.value).toBe(fixture.uf.valor);
    expect(result.uf?.source).toBe('mindicador');
  });

  it('lanza error si la respuesta es 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }),
    );
    await expect(
      mindicadorAdapter.fetchReadings([...IDS], new AbortController().signal),
    ).rejects.toThrow();
  });
});
