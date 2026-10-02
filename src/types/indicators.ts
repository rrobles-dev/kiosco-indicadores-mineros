// Identificadores
export type IndicatorId = 'uf' | 'dolar' | 'euro' | 'utm' | 'libra_cobre';
export type SourceId = 'mindicador' | 'findic';

// Formato común al que normaliza cada adaptador
export interface Observation {
  /** Fecha del dato en America/Santiago, formato YYYY-MM-DD */
  date: string;
  value: number;
}

export interface IndicatorReading {
  id: IndicatorId;
  current: Observation;
  /** Ordenada de la más antigua a la más reciente. Ausente si la fuente no entrega serie. */
  series?: Observation[];
  source: SourceId;
  /** Momento de obtención, ISO 8601 en UTC */
  fetchedAt: string;
}

export type ModuleStatus = 'loading' | 'fresh' | 'stale' | 'empty';

export interface IndicatorModuleState {
  id: IndicatorId;
  status: ModuleStatus;
  reading?: IndicatorReading;
}

// Reglas de vigencia
export type FreshnessRule =
  | { kind: 'sameDay' }
  | { kind: 'maxAgeDays'; days: number }
  | { kind: 'sameMonth' };

// Contrato de cada fuente: cambiar de fuente es cambiar el adaptador, no el módulo
export interface SourceAdapter {
  id: SourceId;
  fetchReadings(
    ids: IndicatorId[],
    signal: AbortSignal,
  ): Promise<Partial<Record<IndicatorId, IndicatorReading>>>;
}

// Configuración declarativa de cada módulo
export interface IndicatorModuleConfig {
  id: IndicatorId;
  label: string;
  unit: 'CLP' | 'USD_PER_LB';
  freshness: FreshnessRule;
  /** Orden de la cadena de fuentes; la primera es la primaria */
  sources: SourceId[];
}

// Respuestas crudas observadas (solo las usan los adaptadores)
export interface MindicadorIndicatorRaw {
  codigo: string;
  nombre: string;
  unidad_medida: string;
  fecha: string; // ISO 8601 en UTC, p. ej. "2026-10-02T03:00:00.000Z"
  valor: number;
}

export interface FindicSeriesRaw {
  version: string;
  autor: string;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  serie: Array<{ fecha: string; valor: number }>; // fecha "YYYY-MM-DD", más reciente primero
}
