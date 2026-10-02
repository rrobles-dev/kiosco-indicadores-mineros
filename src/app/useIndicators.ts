import { useEffect, useState } from 'react';
import type {
  IndicatorId,
  IndicatorModuleConfig,
  IndicatorModuleState,
} from '../types/indicators';
import { resolveReadings, type ChainDeps } from '../data/chain';
import { isFresh } from '../data/freshness';
import { createScheduler } from '../data/scheduler';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

/** El objeto debe ser estable entre renders: un cambio de identidad reinicia el scheduler. */
export interface UseIndicatorsDeps extends ChainDeps {
  configs: IndicatorModuleConfig[];
  intervalMs?: number;
}

type States = Record<IndicatorId, IndicatorModuleState>;

// D-14: el estado inicial sale de la caché, no parte siempre en loading.
function initialStates({ configs, cache, now }: UseIndicatorsDeps): States {
  const entries = configs.map((config): [IndicatorId, IndicatorModuleState] => {
    const reading = cache.read(config.id);
    if (!reading) return [config.id, { id: config.id, status: 'loading' }];
    const status = isFresh(reading.current.date, config.freshness, now())
      ? 'fresh'
      : 'stale';
    return [config.id, { id: config.id, status, reading }];
  });
  return Object.fromEntries(entries) as States;
}

export function useIndicators(deps: UseIndicatorsDeps): States {
  const [states, setStates] = useState<States>(() => initialStates(deps));

  useEffect(() => {
    let active = true;
    const scheduler = createScheduler({
      intervalMs: deps.intervalMs ?? REFRESH_INTERVAL_MS,
      run: async () => {
        const result = await resolveReadings(deps.configs, deps);
        if (active) setStates(result);
      },
    });
    scheduler.start();
    return () => {
      active = false;
      scheduler.stop();
    };
  }, [deps]);

  return states;
}
