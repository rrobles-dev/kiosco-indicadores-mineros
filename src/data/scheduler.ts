export interface SchedulerOptions {
  run: () => Promise<void>;
  intervalMs: number;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export interface Scheduler {
  start(): void;
  stop(): void;
}

export function createScheduler({
  run,
  intervalMs,
  setTimer = (callback, ms) => setTimeout(callback, ms),
  clearTimer = (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
}: SchedulerOptions): Scheduler {
  let running = false;
  let started = false;
  let handle: unknown;

  async function tick() {
    if (running) return;
    running = true;
    try {
      await run();
    } catch {
      // Un ciclo fallido no detiene el refresco: el siguiente tick lo reintenta.
    } finally {
      running = false;
    }
  }

  function schedule() {
    handle = setTimer(() => {
      schedule();
      void tick();
    }, intervalMs);
  }

  return {
    start() {
      if (started) return;
      started = true;
      void tick();
      schedule();
    },
    stop() {
      started = false;
      if (handle !== undefined) clearTimer(handle);
      handle = undefined;
    },
  };
}
