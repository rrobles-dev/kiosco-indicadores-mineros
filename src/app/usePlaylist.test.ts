// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IndicatorId, IndicatorModuleState } from '../types/indicators';
import type { Playlist, Scene } from '../types/presentation';
import { usePlaylist } from './usePlaylist';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const states = Object.fromEntries(
  (['uf', 'dolar', 'euro', 'utm', 'libra_cobre'] as const).map((id) => [
    id,
    { id, status: 'loading' },
  ]),
) as Record<IndicatorId, IndicatorModuleState>;

const indicator = { kind: 'indicator', id: 'uf', variant: 'large' } as const;

const timed = (id: string, durationMs: number): Scene => ({
  id,
  layout: 'full',
  modules: [indicator],
  durationMs,
});

const byContent = (id: string, maxDurationMs: number): Scene => ({
  id,
  layout: 'full',
  modules: [{ kind: 'video' }],
  maxDurationMs,
});

const sequential = (...scenes: Scene[]): Playlist => ({ mode: 'sequential', scenes });

const render = (playlist: Playlist) =>
  renderHook(() => usePlaylist(playlist, states, { random: () => 0 }));

describe('usePlaylist: escenas por tiempo', () => {
  it('programa el timer con durationMs de la escena y avanza al dispararlo', () => {
    const { result } = render(sequential(timed('a', 1000), timed('b', 2500)));
    expect(result.current.scene?.id).toBe('a');

    act(() => void vi.advanceTimersByTime(999));
    expect(result.current.scene?.id).toBe('a');
    act(() => void vi.advanceTimersByTime(1));
    expect(result.current.scene?.id).toBe('b');

    act(() => void vi.advanceTimersByTime(2499));
    expect(result.current.scene?.id).toBe('b');
    act(() => void vi.advanceTimersByTime(1));
    expect(result.current.scene?.id).toBe('a');
  });

  it('una playlist de una sola escena sigue avanzando y cambia el step', () => {
    const { result } = render(sequential(timed('a', 1000)));
    const first = result.current.step;
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current.scene?.id).toBe('a');
    expect(result.current.step).toBe(first + 1);
  });

  it('con durationMs, onComplete también avanza (el primero que ocurra gana)', () => {
    const { result } = render(sequential(timed('a', 1000), timed('b', 1000)));
    act(() => result.current.onComplete());
    expect(result.current.scene?.id).toBe('b');
  });

  it('limpia el timer al desmontar', () => {
    const { unmount } = render(sequential(timed('a', 1000)));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('usa setTimer y clearTimer inyectados', () => {
    const setTimer = vi.fn(() => 'h');
    const clearTimer = vi.fn();
    const playlist = sequential(timed('a', 1000));
    const { unmount } = renderHook(() =>
      usePlaylist(playlist, states, { random: () => 0, setTimer, clearTimer }),
    );
    expect(setTimer).toHaveBeenLastCalledWith(expect.any(Function), 1000);
    unmount();
    expect(clearTimer).toHaveBeenCalledWith('h');
  });
});

describe('usePlaylist: escenas por contenido', () => {
  const playlist = () => sequential(byContent('video', 90_000), timed('b', 15_000));

  it('avanza cuando el módulo llama a onComplete, antes del tope', () => {
    const { result } = render(playlist());
    expect(result.current.scene?.id).toBe('video');

    act(() => void vi.advanceTimersByTime(20_000));
    expect(result.current.scene?.id).toBe('video');

    act(() => result.current.onComplete());
    expect(result.current.scene?.id).toBe('b');
  });

  it('avanza por el tope si onComplete nunca llega', () => {
    const { result } = render(playlist());
    act(() => void vi.advanceTimersByTime(89_999));
    expect(result.current.scene?.id).toBe('video');
    act(() => void vi.advanceTimersByTime(1));
    expect(result.current.scene?.id).toBe('b');
  });

  it('el timer del tope no vuelve a avanzar tras completar por contenido', () => {
    const { result } = render(playlist());
    act(() => result.current.onComplete());
    expect(result.current.scene?.id).toBe('b');

    // El tope de 90 s de la escena anterior ya no cuenta: b dura 15 s.
    act(() => void vi.advanceTimersByTime(14_999));
    expect(result.current.scene?.id).toBe('b');
  });

  it('un onComplete tardío de una escena anterior no avanza la escena actual', () => {
    const { result } = render(playlist());
    const staleOnComplete = result.current.onComplete;

    act(() => result.current.onComplete());
    expect(result.current.scene?.id).toBe('b');

    act(() => staleOnComplete());
    expect(result.current.scene?.id).toBe('b');
  });

  it('un onComplete tardío tras avanzar por tope tampoco avanza la escena actual', () => {
    const { result } = render(playlist());
    const staleOnComplete = result.current.onComplete;

    act(() => void vi.advanceTimersByTime(90_000));
    expect(result.current.scene?.id).toBe('b');

    act(() => staleOnComplete());
    expect(result.current.scene?.id).toBe('b');
  });

  it('dos llamadas a onComplete de la misma escena avanzan una sola vez', () => {
    const playlist3 = sequential(byContent('a', 90_000), byContent('b', 90_000), byContent('c', 90_000));
    const { result } = render(playlist3);
    const onComplete = result.current.onComplete;
    act(() => {
      onComplete();
      onComplete();
    });
    expect(result.current.scene?.id).toBe('b');
  });
});
