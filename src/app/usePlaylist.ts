import { useEffect, useRef, useState } from 'react';
import { isScenePlayable, createPlaylist, type PlaylistEngine } from '../presentation/playlist';
import type { IndicatorId, IndicatorModuleState } from '../types/indicators';
import type { Playlist, Scene } from '../types/presentation';

export interface UsePlaylistDeps {
  random: () => number;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  /** Cada cuánto se reintenta cuando ninguna escena es reproducible. */
  emptyRetryMs?: number;
}

const defaultSetTimer = (callback: () => void, ms: number) => setTimeout(callback, ms);
const defaultClearTimer = (handle: unknown) =>
  clearTimeout(handle as ReturnType<typeof setTimeout>);

interface Current {
  engine: PlaylistEngine;
  scene: Scene | null;
  /** Cambia en cada avance, aunque la escena se repita, para reiniciar el timer. */
  step: number;
}

/** La playlist debe ser estable entre renders: se crea el motor una sola vez. */
export function usePlaylist(
  playlist: Playlist,
  states: Record<IndicatorId, IndicatorModuleState>,
  {
    random,
    setTimer = defaultSetTimer,
    clearTimer = defaultClearTimer,
    emptyRetryMs = 5000,
  }: UsePlaylistDeps,
): Scene | null {
  const [current, setCurrent] = useState<Current>(() => {
    const engine = createPlaylist(playlist, random);
    return { engine, scene: engine.next((s) => isScenePlayable(s, states)), step: 0 };
  });

  const statesRef = useRef(states);
  useEffect(() => {
    statesRef.current = states;
  });

  useEffect(() => {
    const timer = setTimer(
      () => {
        const scene = current.engine.next((s) => isScenePlayable(s, statesRef.current));
        setCurrent((c) => ({ ...c, scene, step: c.step + 1 }));
      },
      current.scene?.durationMs ?? emptyRetryMs,
    );
    return () => clearTimer(timer);
  }, [current, setTimer, clearTimer, emptyRetryMs]);

  return current.scene;
}
