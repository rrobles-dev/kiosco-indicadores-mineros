import { formatDate, formatPercent, formatValue } from '../../lib/format';
import type {
  IndicatorModuleConfig,
  IndicatorModuleState,
  IndicatorReading,
  SourceId,
} from '../../types/indicators';
import type { IndicatorVariant } from '../../types/presentation';
import { Chart } from './Chart';
import styles from './IndicatorModule.module.css';

interface IndicatorModuleProps {
  config: IndicatorModuleConfig;
  state: IndicatorModuleState;
  variant: IndicatorVariant;
}

const SOURCE_LABEL: Record<SourceId, string> = {
  mindicador: 'mindicador.cl',
  findic: 'findic.cl',
};

/** Variación porcentual respecto de la observación anterior a la actual. */
function variationOf(reading: IndicatorReading): { percent: number; since: string } | undefined {
  const previous = reading.series?.filter((o) => o.date < reading.current.date).at(-1);
  if (!previous || previous.value === 0) return undefined;
  return {
    percent: ((reading.current.value - previous.value) / previous.value) * 100,
    since: previous.date,
  };
}

function Variation({ percent, since }: { percent: number; since?: string }) {
  const rounded = Math.round(percent * 100) / 100;
  const [arrow, word, className] =
    rounded > 0
      ? ['▲', 'Sube', styles.up]
      : rounded < 0
        ? ['▼', 'Baja', styles.down]
        : ['■', 'Sin variación', styles.flat];
  const text = formatPercent(Math.abs(rounded));
  return (
    <p className={`${styles.variation} ${className}`} aria-label={`${word} ${text}`}>
      <span aria-hidden="true">{arrow}</span> {text}
      {since && ` respecto del ${formatDate(since)}`}
    </p>
  );
}

function Skeleton({ variant }: { variant: IndicatorVariant }) {
  return (
    <>
      <div className={`${styles.skeleton} ${styles.skeletonLabel}`} />
      <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
      {variant !== 'minimal' && <div className={`${styles.skeleton} ${styles.skeletonChart}`} />}
    </>
  );
}

export function IndicatorModule({ config, state, variant }: IndicatorModuleProps) {
  if (state.status === 'empty') return null;

  const rootClass = `${styles.module} ${styles[variant]}`;

  if (state.status === 'loading') {
    return (
      <section
        className={`${rootClass} ${styles.loading}`}
        data-variant={variant}
        aria-busy="true"
        aria-label={config.label}
      >
        <Skeleton variant={variant} />
      </section>
    );
  }

  const { reading } = state;
  if (!reading) return null;

  const isStale = state.status === 'stale';
  const variation = variationOf(reading);
  const value = formatValue(reading.current.value, config.unit, config.decimals);
  const updated = `Actualizado el ${formatDate(reading.current.date)}`;

  if (variant === 'minimal') {
    return (
      <section
        className={`${rootClass} ${isStale ? styles.stale : styles.fresh}`}
        data-variant={variant}
        aria-label={config.label}
      >
        <span className={styles.label}>{config.label}</span>
        <span className={styles.value}>{value}</span>
        {variation && <Variation percent={variation.percent} />}
        {isStale && <span className={styles.date}>{updated}</span>}
      </section>
    );
  }

  const isLarge = variant === 'large';

  return (
    <section
      className={`${rootClass} ${isStale ? styles.stale : styles.fresh}`}
      data-variant={variant}
      aria-label={config.label}
    >
      <h2 className={styles.label}>{config.label}</h2>
      <p className={styles.value}>{value}</p>
      {variation && (
        <Variation percent={variation.percent} since={isLarge ? variation.since : undefined} />
      )}
      <p className={styles.date}>{isStale ? updated : formatDate(reading.current.date)}</p>
      {isLarge && (
        <p className={styles.source}>Fuente: {SOURCE_LABEL[reading.source]}</p>
      )}
      {reading.series && (
        <div className={styles.chart}>
          <Chart
            series={reading.series}
            points={config.chartPoints}
            currentValue={reading.current.value}
            minAxisSpanPct={config.minAxisSpanPct}
            formatValue={(n) => formatValue(n, config.unit, config.decimals)}
          />
        </div>
      )}
    </section>
  );
}
