import { afterEach, describe, expect, it, vi } from 'vitest';
import { findicAdapter, parseFindicSeries } from './findic';
import type { IndicatorId } from '../../types/indicators';
import dolar from './__fixtures__/findic-dolar.json';
import euro from './__fixtures__/findic-euro.json';
import libraCobre from './__fixtures__/findic-libra_cobre.json';
import uf from './__fixtures__/findic-uf.json';
import utm from './__fixtures__/findic-utm.json';

const FETCHED_AT = '2026-10-02T19:00:00.000Z';

const fixtures = { uf, dolar, euro, utm, libra_cobre: libraCobre } as const;
const IDS = Object.keys(fixtures) as IndicatorId[];

describe('parseFindicSeries', () => {
  it.each(IDS)('normaliza %s: current y orden de la serie', (id) => {
    const fixture = fixtures[id];
    const reading = parseFindicSeries(fixture, id, FETCHED_AT);

    expect(reading.id).toBe(id);
    expect(reading.source).toBe('findic');
    expect(reading.fetchedAt).toBe(FETCHED_AT);
    expect(reading.current).toEqual({
      date: fixture.serie[0].fecha,
      value: fixture.serie[0].valor,
    });

    // Serie completa, de la más antigua a la más reciente.
    const expected = [...fixture.serie]
      .reverse()
      .map((o) => ({ date: o.fecha, value: o.valor }));
    expect(reading.series).toEqual(expected);
    expect(reading.series?.at(-1)).toEqual(reading.current);
  });

  it('conserva la fecha de calendario sin desplazamiento', () => {
    const reading = parseFindicSeries(libraCobre, 'libra_cobre', FETCHED_AT);
    expect(reading.current.date).toBe(libraCobre.serie[0].fecha);
    expect(reading.current.date).toBe('2026-10-02');
  });

  it('la UTM devuelve serie mensual con fechas día 01', () => {
    const reading = parseFindicSeries(utm, 'utm', FETCHED_AT);
    expect(reading.series!.length).toBeGreaterThan(1);
    for (const obs of reading.series!) {
      expect(obs.date.endsWith('-01')).toBe(true);
    }
  });

  it('descarta observaciones con valor no finito y mantiene el resto', () => {
    const raw = structuredClone(dolar) as { serie: Array<{ fecha: string; valor: unknown }> };
    raw.serie[1].valor = null;
    raw.serie[2].valor = 'abc';
    const reading = parseFindicSeries(raw, 'dolar', FETCHED_AT);
    expect(reading.series).toHaveLength(dolar.serie.length - 2);
    expect(reading.series!.map((o) => o.date)).not.toContain(dolar.serie[1].fecha);
    expect(reading.current.value).toBe(dolar.serie[0].valor);
  });

  it('descarta observaciones con fecha inválida', () => {
    const raw = structuredClone(dolar) as { serie: Array<{ fecha: string; valor: number }> };
    raw.serie[0].fecha = '2026-02-30';
    raw.serie[1].fecha = '2026-10-02T03:00:00.000Z';
    const reading = parseFindicSeries(raw, 'dolar', FETCHED_AT);
    expect(reading.series).toHaveLength(dolar.serie.length - 2);
    expect(reading.current.date).toBe(dolar.serie[2].fecha);
  });

  it('lanza error si codigo no coincide con el id pedido', () => {
    expect(() => parseFindicSeries(euro, 'dolar', FETCHED_AT)).toThrow();
  });

  it('lanza error si no queda ninguna observación válida', () => {
    const raw = { ...dolar, serie: [{ fecha: 'x', valor: 1 }, { fecha: '2026-10-02', valor: null }] };
    expect(() => parseFindicSeries(raw, 'dolar', FETCHED_AT)).toThrow();
  });

  it('lanza error si raw no es un objeto', () => {
    expect(() => parseFindicSeries(null, 'dolar', FETCHED_AT)).toThrow();
  });
});

describe('findicAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const ok = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

  it('devuelve solo los ids que respondieron', async () => {
    const fetchMock = vi.fn((url: string) =>
      url.endsWith('/uf')
        ? Promise.resolve(ok(uf))
        : Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { signal } = new AbortController();

    const result = await findicAdapter.fetchReadings(['uf', 'dolar'], signal);

    expect(Object.keys(result)).toEqual(['uf']);
    expect(result.uf?.source).toBe('findic');
    expect(fetchMock).toHaveBeenCalledWith('https://findic.cl/api/uf', { signal });
    expect(fetchMock).toHaveBeenCalledWith('https://findic.cl/api/dolar', { signal });
  });

  it('lanza error si fallan todos los ids', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('red')));
    await expect(
      findicAdapter.fetchReadings(['uf', 'dolar'], new AbortController().signal),
    ).rejects.toThrow();
  });
});
