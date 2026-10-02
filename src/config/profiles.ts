import type { IndicatorId } from '../types/indicators';
import type { Profile, Scene } from '../types/presentation';

const SCENE_MS = 15_000;

const indicator = (id: IndicatorId, variant: 'large' | 'compact') =>
  ({ kind: 'indicator', id, variant }) as const;

const pair = (id: string, a: IndicatorId, b: IndicatorId): Scene => ({
  id,
  layout: 'halves',
  modules: [indicator(a, 'compact'), indicator(b, 'compact')],
  durationMs: SCENE_MS,
});

const ALL_INDICATORS: IndicatorId[] = ['libra_cobre', 'dolar', 'euro', 'uf', 'utm'];

export const recepcion: Profile = {
  id: 'recepcion',
  layout: 'main-strip',
  main: {
    mode: 'sequential',
    scenes: [
      {
        id: 'cobre',
        layout: 'full',
        modules: [indicator('libra_cobre', 'large')],
        durationMs: SCENE_MS,
      },
      pair('dolar-euro', 'dolar', 'euro'),
      pair('uf-utm', 'uf', 'utm'),
    ],
  },
};

export const indicadores: Profile = {
  id: 'indicadores',
  layout: 'featured-sidebar',
  main: {
    mode: 'shuffle',
    scenes: ALL_INDICATORS.map((id) => ({
      id,
      layout: 'full',
      modules: [indicator(id, 'large')],
      durationMs: SCENE_MS,
    })),
  },
};

export const PROFILES: Record<Profile['id'], Profile> = { recepcion, indicadores };
export const DEFAULT_PROFILE = recepcion;
