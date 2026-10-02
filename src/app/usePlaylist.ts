import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export interface PlaylistPlayback {
  scene: Scene | null;
  /** Cambia en cada avance, aunque la escena se repita; sirve de key para remontar la escena. */
  step: number;
  /** Para los módulos que terminan por contenido; ignora llamadas de escenas anteriores. */
  onComplete: () => void;
}

const defaultSetTimer = (callback: () => void, ms: number) => setTimeout(callback, ms);
const defaultClearTimer = (handle: unknown) =>
  clearTimeout(handle as ReturnType<typeof setTimeout>);

interface Current {
  engine: PlaylistEngine;
  scene: Scene | null;
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
): PlaylistPlayback {
  const [current, setCurrent] = useState<Current>(() => {
    const engine = createPlaylist(playlist, random);
    return { engine, scene: engine.next((s) => isScenePlayable(s, states)), step: 0 };
  });

  const statesRef = useRef(states);
  useEffect(() => {
    statesRef.current = states;
  });

  // Paso vigente: lo que ocurra primero (timer u onComplete) lo consume y el otro se ignora.
  const stepRef = useRef(0);
  const { engine, scene, step } = current;

  const advance = useCallback(
    (fromStep: number) => {
      if (stepRef.current !== fromStep) return;
      stepRef.current = fromStep + 1;
      const next = engine.next((s) => isScenePlayable(s, statesRef.current));
      setCurrent((c) => ({ ...c, scene: next, step: fromStep + 1 }));
    },
    [engine],
  );

  useEffect(() => {
    const delay = scene ? (scene.durationMs ?? scene.maxDurationMs) : emptyRetryMs;
    const timer = setTimer(() => advance(step), delay);
    return () => clearTimer(timer);
  }, [scene, step, advance, setTimer, clearTimer, emptyRetryMs]);

  const onComplete = useMemo(() => () => advance(step), [advance, step]);

  return { scene, step, onComplete };
}
