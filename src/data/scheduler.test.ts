import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createScheduler } from './scheduler';

const INTERVAL = 60 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createScheduler', () => {
  it('ejecuta run de inmediato al llamar start()', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    createScheduler({ run, intervalMs: INTERVAL }).start();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('repite cada intervalMs', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    createScheduler({ run, intervalMs: INTERVAL }).start();
    await vi.advanceTimersByTimeAsync(INTERVAL - 1);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(INTERVAL);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('salta el tick si el ciclo anterior sigue en curso', async () => {
    let finish: () => void = () => {};
    const run = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    createScheduler({ run, intervalMs: INTERVAL }).start();

    await vi.advanceTimersByTimeAsync(INTERVAL * 2);
    expect(run).toHaveBeenCalledTimes(1);

    finish();
    await vi.advanceTimersByTimeAsync(INTERVAL);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('stop() detiene la repetición', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler({ run, intervalMs: INTERVAL });
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    scheduler.stop();
    await vi.advanceTimersByTimeAsync(INTERVAL * 3);
    expect(run).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('un run que lanza error no detiene el scheduler', async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce(new Error('falla'))
      .mockResolvedValue(undefined);
    createScheduler({ run, intervalMs: INTERVAL }).start();
    await vi.advanceTimersByTimeAsync(INTERVAL);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('usa setTimer y clearTimer inyectados', () => {
    const setTimer = vi.fn().mockReturnValue('h1');
    const clearTimer = vi.fn();
    const scheduler = createScheduler({
      run: vi.fn().mockResolvedValue(undefined),
      intervalMs: 500,
      setTimer,
      clearTimer,
    });
    scheduler.start();
    expect(setTimer).toHaveBeenCalledWith(expect.any(Function), 500);
    scheduler.stop();
    expect(clearTimer).toHaveBeenCalledWith('h1');
  });
});
