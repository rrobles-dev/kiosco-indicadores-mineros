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

// Tope de seguridad de las escenas que terminan por contenido (D-23).
const VIDEO_MAX_MS = 90_000;
const LOGOS_MAX_MS = 30_000;

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
      { id: 'video', layout: 'full', modules: [{ kind: 'video' }], maxDurationMs: VIDEO_MAX_MS },
      pair('uf-utm', 'uf', 'utm'),
      { id: 'logos', layout: 'full', modules: [{ kind: 'logos' }], maxDurationMs: LOGOS_MAX_MS },
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
