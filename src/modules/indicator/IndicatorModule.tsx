import { formatDate, formatPercent, formatValue } from '../../lib/format';
import type {
  IndicatorModuleConfig,
  IndicatorModuleState,
  IndicatorReading,
} from '../../types/indicators';
import styles from './IndicatorModule.module.css';
import { Sparkline } from './Sparkline';

interface IndicatorModuleProps {
  config: IndicatorModuleConfig;
  state: IndicatorModuleState;
}

/** Variación porcentual respecto de la observación anterior a la actual. */
function variationOf(reading: IndicatorReading): number | undefined {
  const previous = reading.series
    ?.filter((o) => o.date < reading.current.date)
    .at(-1);
  if (!previous || previous.value === 0) return undefined;
  return ((reading.current.value - previous.value) / previous.value) * 100;
}

function Variation({ percent }: { percent: number }) {
  const rounded = Math.round(percent * 100) / 100;
  const [arrow, word, className] =
    rounded > 0
      ? ['▲', 'Sube', styles.up]
      : rounded < 0
        ? ['▼', 'Baja', styles.down]
        : ['■', 'Sin variación', styles.flat];
  return (
    <p className={`${styles.variation} ${className}`}>
      <span aria-hidden="true">{arrow}</span> {word}{' '}
      {formatPercent(Math.abs(rounded))}
    </p>
  );
}

export function IndicatorModule({ config, state }: IndicatorModuleProps) {
  if (state.status === 'empty') return null;

  if (state.status === 'loading') {
    return (
      <section
        className={`${styles.module} ${styles.loading}`}
        aria-busy="true"
        aria-label={config.label}
      >
        <div className={`${styles.skeleton} ${styles.skeletonLabel}`} />
        <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
        <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
      </section>
    );
  }

  const { reading } = state;
  if (!reading) return null;

  const isStale = state.status === 'stale';
  const variation = variationOf(reading);

  return (
    <section
      className={`${styles.module} ${isStale ? styles.stale : styles.fresh}`}
      aria-label={config.label}
    >
      <h2 className={styles.label}>{config.label}</h2>
      <p className={styles.value}>
        {formatValue(reading.current.value, config.unit, config.decimals)}
      </p>
      <p className={styles.date}>
        {isStale
          ? `Actualizado el ${formatDate(reading.current.date)}`
          : formatDate(reading.current.date)}
      </p>
      {variation !== undefined && <Variation percent={variation} />}
      {reading.series && (
        <div className={styles.chart}>
          <Sparkline series={reading.series} points={config.chartPoints} />
        </div>
      )}
    </section>
  );
}
