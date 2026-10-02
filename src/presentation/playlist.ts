import type { IndicatorId, IndicatorModuleState } from '../types/indicators';
import type { Playlist, Scene } from '../types/presentation';

export interface PlaylistEngine {
  /** Siguiente escena reproducible, o null si ninguna lo es. */
  next(isPlayable: (scene: Scene) => boolean): Scene | null;
}

/** Fisher-Yates con el random inyectado. */
function shuffled(length: number, random: () => number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function createPlaylist(playlist: Playlist, random: () => number): PlaylistEngine {
  const { scenes, mode } = playlist;
  let order: number[] = [];
  let position = 0;
  let last = -1;

  function startLap() {
    if (mode === 'sequential') {
      order = scenes.map((_, i) => i);
    } else {
      order = shuffled(scenes.length, random);
      // La primera de la vuelta no repite la última de la anterior.
      if (order.length > 1 && order[0] === last) {
        [order[0], order[1]] = [order[1], order[0]];
      }
    }
    position = 0;
  }

  function take(): Scene {
    if (position >= order.length) startLap();
    last = order[position++];
    return scenes[last];
  }

  return {
    next(isPlayable) {
      for (let tries = 0; tries < scenes.length; tries++) {
        const scene = take();
        if (isPlayable(scene)) return scene;
      }
      return null;
    },
  };
}

/** Una escena se salta si todos sus módulos de indicador están empty. */
export function isScenePlayable(
  scene: Scene,
  states: Record<IndicatorId, IndicatorModuleState>,
): boolean {
  return scene.modules.some((ref) => {
    switch (ref.kind) {
      case 'indicator':
        return states[ref.id]?.status !== 'empty';
      case 'reel':
      case 'logos':
        return true;
    }
  });
}
