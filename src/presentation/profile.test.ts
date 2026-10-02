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
  it('recepcion: cobre full large, luego dólar y euro, luego UF y UTM, de 15 s', () => {
    const { scenes, mode } = recepcion.main;
    expect(mode).toBe('sequential');
    expect(scenes.map((s) => [s.layout, s.modules.map(describeModule)])).toEqual([
      ['full', ['libra_cobre:large']],
      ['halves', ['dolar:compact', 'euro:compact']],
      ['halves', ['uf:compact', 'utm:compact']],
    ]);
    expect(scenes.every((s) => s.durationMs === 15_000)).toBe(true);
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
