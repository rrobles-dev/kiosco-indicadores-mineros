import type { IndicatorId } from './indicators';

export type IndicatorVariant = 'large' | 'compact' | 'minimal';

/** Unión discriminada por `kind`. */
export type ModuleRef =
  | { kind: 'indicator'; id: IndicatorId; variant: IndicatorVariant }
  | { kind: 'reel' }
  | { kind: 'logos' };

interface SceneBase {
  id: string;
  layout: 'full' | 'halves';
  modules: ModuleRef[];
}

/**
 * Con `durationMs` la escena termina por tiempo. Sin él termina cuando el módulo
 * llama a onComplete, y `maxDurationMs` es el tope de seguridad obligatorio.
 */
export type Scene = SceneBase &
  ({ durationMs: number; maxDurationMs?: undefined } | { durationMs?: undefined; maxDurationMs: number });

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
