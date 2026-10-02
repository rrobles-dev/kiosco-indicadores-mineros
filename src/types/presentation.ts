import type { IndicatorId } from './indicators';

export type IndicatorVariant = 'large' | 'compact' | 'minimal';

/** Unión discriminada por `kind`: la Fase 5b agrega `reel` y `logos` sin romper los consumidores. */
export type ModuleRef = {
  kind: 'indicator';
  id: IndicatorId;
  variant: IndicatorVariant;
};

export interface Scene {
  id: string;
  layout: 'full' | 'halves';
  modules: ModuleRef[];
  durationMs: number;
}

export interface Playlist {
  mode: 'sequential' | 'shuffle';
  scenes: Scene[];
}

/** La zona secundaria (franja o resumen) no rota: muestra los indicadores en variante minimal. */
export interface Profile {
  id: 'recepcion' | 'indicadores';
  layout: 'main-strip' | 'featured-sidebar';
  main: Playlist;
}
