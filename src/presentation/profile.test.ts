import { describe, expect, it } from 'vitest';
import { indicadores, recepcion } from '../config/profiles';
import type { ModuleRef } from '../types/presentation';
import { getProfileFromSearch } from './profile';

describe('getProfileFromSearch', () => {
  it('sin parámetro devuelve recepcion', () => {
    expect(getProfileFromSearch('')).toBe(recepcion);
    expect(getProfileFromSearch('?otro=1')).toBe(recepcion);
  });

  it('?perfil=indicadores devuelve indicadores', () => {
    expect(getProfileFromSearch('?perfil=indicadores')).toBe(indicadores);
  });

  it('?perfil=recepcion devuelve recepcion', () => {
    expect(getProfileFromSearch('?perfil=recepcion')).toBe(recepcion);
  });

  it('un valor desconocido devuelve recepcion', () => {
    expect(getProfileFromSearch('?perfil=evento')).toBe(recepcion);
    expect(getProfileFromSearch('?perfil=')).toBe(recepcion);
    expect(getProfileFromSearch('?perfil=__proto__')).toBe(recepcion);
    expect(getProfileFromSearch('?perfil=constructor')).toBe(recepcion);
  });

  it('funciona con otros parámetros presentes', () => {
    expect(getProfileFromSearch('?x=1&perfil=indicadores')).toBe(indicadores);
  });
});

const describeModule = (m: ModuleRef) => (m.kind === 'indicator' ? `${m.id}:${m.variant}` : m.kind);

describe('perfiles', () => {
  it('recepcion: cobre, dólar y euro, video, UF y UTM, logos', () => {
    const { scenes, mode } = recepcion.main;
    expect(mode).toBe('sequential');
    expect(scenes.map((s) => [s.layout, s.modules.map(describeModule)])).toEqual([
      ['full', ['libra_cobre:large']],
      ['halves', ['dolar:compact', 'euro:compact']],
      ['full', ['video']],
      ['halves', ['uf:compact', 'utm:compact']],
      ['full', ['logos']],
    ]);
  });

  it('recepcion: indicadores de 15 s; video y logos terminan por contenido con tope', () => {
    const byId = Object.fromEntries(recepcion.main.scenes.map((s) => [s.id, s]));
    for (const id of ['cobre', 'dolar-euro', 'uf-utm']) {
      expect(byId[id].durationMs).toBe(15_000);
      expect(byId[id].maxDurationMs).toBeUndefined();
    }
    expect(byId.video.durationMs).toBeUndefined();
    expect(byId.video.maxDurationMs).toBe(90_000);
    expect(byId.logos.durationMs).toBeUndefined();
    // 12 socios en 2 páginas de 8 s = 16 s; el tope debe cubrirlo con margen.
    expect(byId.logos.maxDurationMs).toBeGreaterThan(16_000);
  });

  it('indicadores: shuffle con una escena full large por indicador', () => {
    const { scenes, mode } = indicadores.main;
    expect(mode).toBe('shuffle');
    expect(scenes).toHaveLength(5);
    expect(scenes.map((s) => describeModule(s.modules[0])).sort()).toEqual([
      'dolar:large',
      'euro:large',
      'libra_cobre:large',
      'uf:large',
      'utm:large',
    ]);
    expect(scenes.every((s) => s.layout === 'full')).toBe(true);
  });
});
