import type { IndicatorModuleConfig } from '../types/indicators';

export const INDICATOR_MODULES: IndicatorModuleConfig[] = [
  {
    id: 'uf',
    label: 'UF',
    unit: 'CLP',
    freshness: { kind: 'sameDay' },
    sources: ['mindicador', 'findic'],
  },
  {
    id: 'dolar',
    label: 'Dólar observado',
    unit: 'CLP',
    freshness: { kind: 'maxAgeDays', days: 4 },
    sources: ['mindicador', 'findic'],
  },
  {
    id: 'euro',
    label: 'Euro',
    unit: 'CLP',
    freshness: { kind: 'maxAgeDays', days: 4 },
    sources: ['mindicador', 'findic'],
  },
  {
    id: 'utm',
    label: 'UTM',
    unit: 'CLP',
    freshness: { kind: 'sameMonth' },
    sources: ['mindicador', 'findic'],
  },
  {
    id: 'libra_cobre',
    label: 'Cobre',
    unit: 'USD_PER_LB',
    freshness: { kind: 'maxAgeDays', days: 4 },
    sources: ['mindicador', 'findic'],
  },
];
