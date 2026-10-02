// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IndicatorId, IndicatorModuleState } from '../types/indicators';
import type { Playlist } from '../types/presentation';
import { usePlaylist } from './usePlaylist';

afterEach(cleanup);

const states = Object.fromEntries(
  (['uf', 'dolar', 'euro', 'utm', 'libra_cobre'] as const).map((id) => [
    id,
    { id, status: 'loading' },
  ]),
) as Record<IndicatorId, IndicatorModuleState>;

const playlist: Playlist = {
  mode: 'sequential',
  scenes: ['a', 'b'].map((id) => ({
    id,
    layout: 'full' as const,
    modules: [{ kind: 'indicator' as const, id: 'uf' as const, variant: 'large' as const }],
    durationMs: id === 'a' ? 1000 : 2500,
  })),
};

describe('usePlaylist', () => {
  it('programa el timer con durationMs de la escena y avanza al dispararlo', () => {
    let fire: () => void = () => {};
    const setTimer = vi.fn((callback: () => void) => {
      fire = callback;
      return 'h';
    });
    const clearTimer = vi.fn();
    const { result } = renderHook(() =>
      usePlaylist(playlist, states, { random: () => 0, setTimer, clearTimer }),
    );

    expect(result.current?.id).toBe('a');
    expect(setTimer).toHaveBeenLastCalledWith(expect.any(Function), 1000);

    act(() => fire());
    expect(result.current?.id).toBe('b');
    expect(setTimer).toHaveBeenLastCalledWith(expect.any(Function), 2500);
    expect(clearTimer).toHaveBeenCalledWith('h');
  });

  it('una playlist de una sola escena sigue reprogramando el timer', () => {
    let fire: () => void = () => {};
    const setTimer = vi.fn((callback: () => void) => {
      fire = callback;
      return 'h';
    });
    const single: Playlist = { mode: 'sequential', scenes: [playlist.scenes[0]] };
    const { result } = renderHook(() =>
      usePlaylist(single, states, { random: () => 0, setTimer, clearTimer: vi.fn() }),
    );

    act(() => fire());
    act(() => fire());
    expect(result.current?.id).toBe('a');
    expect(setTimer).toHaveBeenCalledTimes(3);
  });

  it('limpia el timer al desmontar', () => {
    const clearTimer = vi.fn();
    const { unmount } = renderHook(() =>
      usePlaylist(playlist, states, { random: () => 0, setTimer: () => 'h', clearTimer }),
    );
    unmount();
    expect(clearTimer).toHaveBeenCalledWith('h');
  });
});
