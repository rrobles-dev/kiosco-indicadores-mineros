import { formatDate } from '../../lib/format';
import type { Observation } from '../../types/indicators';
import styles from './Chart.module.css';

interface ChartProps {
  series: Observation[];
  /** Cantidad de observaciones finales que se grafican */
  points: number;
  /** full: tres rótulos por eje, último punto y período; minmax: solo mínimo y máximo */
  mode: 'full' | 'minmax';
  formatValue: (value: number) => string;
}

const WIDTH = 100;
const HEIGHT = 100;

// Una serie con todas sus fechas en día 01 es mensual (UTM).
const isMonthly = (series: Observation[]) => series.every((o) => o.date.endsWith('-01'));

const formatDay = (date: string) => formatDate(date).slice(0, 5);

export function Chart({ series, points, mode, formatValue }: ChartProps) {
  const visible = series.slice(-points);
  if (visible.length < 2) return null;

  const values = visible.map((o) => o.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  // Serie plana: línea al centro en vez de dividir por cero.
  const yPercent = (value: number) => (range === 0 ? 50 : 100 - ((value - min) / range) * 100);
  const step = WIDTH / (visible.length - 1);
  const coords = values
    .map((value, i) => `${(i * step).toFixed(2)},${((yPercent(value) * HEIGHT) / 100).toFixed(2)}`)
    .join(' ');

  const yLabels = mode === 'full' ? [max, (min + max) / 2, min] : [max, min];
  const xDates = [
    visible[0].date,
    visible[Math.floor((visible.length - 1) / 2)].date,
    visible[visible.length - 1].date,
  ];
  const period = isMonthly(visible)
    ? `Últimos ${visible.length} meses`
    : `Últimos ${visible.length} días hábiles`;

  return (
    <figure className={`${styles.chart} ${mode === 'full' ? styles.full : styles.minmax}`}>
      <div className={styles.yAxis} data-axis="y">
        {yLabels.map((value, i) => (
          <span key={i}>{formatValue(value)}</span>
        ))}
      </div>
      <div className={styles.plot}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Gráfico de los últimos ${visible.length} valores`}
        >
          <polyline
            points={coords}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {mode === 'full' && (
          <span
            className={styles.lastPoint}
            data-testid="last-point"
            style={{ top: `${yPercent(values[values.length - 1])}%` }}
          />
        )}
      </div>
      {mode === 'full' && (
        <>
          <div className={styles.xAxis} data-axis="x">
            {xDates.map((date, i) => (
              <span key={i}>{formatDay(date)}</span>
            ))}
          </div>
          <figcaption className={styles.period}>{period}</figcaption>
        </>
      )}
    </figure>
  );
}
