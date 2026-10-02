import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorModuleState } from '../types/indicators';
import type { Playlist, Scene } from '../types/presentation';
import { createPlaylist, isScenePlayable } from './playlist';

const scene = (id: string, indicator: IndicatorId = 'uf'): Scene => ({
  id,
  layout: 'full',
  modules: [{ kind: 'indicator', id: indicator, variant: 'large' }],
  durationMs: 15_000,
});

const scenes = ['a', 'b', 'c', 'd'].map((id) => scene(id));
const always = () => true;

/** Random determinista: recorre una lista de valores en ciclo. */
const cycle = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

const take = (
  playlist: Playlist,
  random: () => number,
  n: number,
  playable: (scene: Scene) => boolean = always,
) => {
  const engine = createPlaylist(playlist, random);
  return Array.from({ length: n }, () => engine.next(playable)?.id);
};

describe('createPlaylist', () => {
  it('sequential recorre en orden y vuelve al inicio', () => {
    const ids = take({ mode: 'sequential', scenes }, () => 0, 9);
    expect(ids).toEqual(['a', 'b', 'c', 'd', 'a', 'b', 'c', 'd', 'a']);
  });

  it('shuffle muestra todas las escenas una vez por vuelta', () => {
    const ids = take({ mode: 'shuffle', scenes }, cycle([0.1, 0.9, 0.4, 0.7, 0.2]), 12);
    for (let lap = 0; lap < 3; lap++) {
      expect(ids.slice(lap * 4, lap * 4 + 4).sort()).toEqual(['a', 'b', 'c', 'd']);
    }
  });

  it('shuffle nunca repite entre vueltas, aun con un random que lo provocaría', () => {
    // random=0 siempre deja el mismo orden: [b, c, d, a] y luego el mismo en cada vuelta.
    const ids = take({ mode: 'shuffle', scenes }, () => 0, 40);
    for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1]);
  });

  it('shuffle con distintos random sigue sin repetir entre vueltas', () => {
    for (let seed = 1; seed <= 50; seed++) {
      let state = seed;
      const random = () => ((state = (state * 48271) % 2147483647) / 2147483647);
      const ids = take({ mode: 'shuffle', scenes }, random, 60);
      for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1]);
    }
  });

  it('una playlist de una sola escena la repite', () => {
    expect(take({ mode: 'shuffle', scenes: [scenes[0]] }, () => 0, 3)).toEqual(['a', 'a', 'a']);
  });

  it('salta las escenas no reproducibles', () => {
    const ids = take({ mode: 'sequential', scenes }, () => 0, 4, (s) => s.id !== 'b' && s.id !== 'c');
    expect(ids).toEqual(['a', 'd', 'a', 'd']);
  });

  it('devuelve null cuando ninguna escena es reproducible', () => {
    expect(take({ mode: 'sequential', scenes }, () => 0, 2, () => false)).toEqual([undefined, undefined]);
  });

  it('devuelve null con una playlist vacía', () => {
    expect(createPlaylist({ mode: 'sequential', scenes: [] }, () => 0).next(always)).toBeNull();
  });
});

describe('isScenePlayable', () => {
  const state = (id: IndicatorId, status: IndicatorModuleState['status']) => ({ id, status });
  const states = {
    uf: state('uf', 'empty'),
    dolar: state('dolar', 'loading'),
    euro: state('euro', 'fresh'),
    utm: state('utm', 'empty'),
    libra_cobre: state('libra_cobre', 'stale'),
  } as Record<IndicatorId, IndicatorModuleState>;

  it('no es reproducible si todos sus módulos están empty', () => {
    expect(isScenePlayable(scene('x', 'uf'), states)).toBe(false);
    const both: Scene = { ...scene('y'), modules: [scene('a', 'uf').modules[0], scene('b', 'utm').modules[0]] };
    expect(isScenePlayable(both, states)).toBe(false);
  });

  it('es reproducible si al menos un módulo no está empty', () => {
    const mixed: Scene = { ...scene('y'), modules: [scene('a', 'uf').modules[0], scene('b', 'euro').modules[0]] };
    expect(isScenePlayable(mixed, states)).toBe(true);
    expect(isScenePlayable(scene('l', 'dolar'), states)).toBe(true);
    expect(isScenePlayable(scene('s', 'libra_cobre'), states)).toBe(true);
  });
});
