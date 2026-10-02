import { formatDate } from '../../lib/format';
import type { Observation } from '../../types/indicators';
import styles from './Chart.module.css';

interface ChartProps {
  series: Observation[];
  /** Cantidad de observaciones finales que se grafican */
  points: number;
  /** Valor actual; con minAxisSpanPct fija el rango mínimo del eje Y */
  currentValue: number;
  /** Rango mínimo del eje Y, en % del valor actual (D-22) */
  minAxisSpanPct: number;
  formatValue: (value: number) => string;
}

const WIDTH = 100;
const HEIGHT = 100;

// Una serie con todas sus fechas en día 01 es mensual (UTM).
const isMonthly = (series: Observation[]) => series.every((o) => o.date.endsWith('-01'));

const formatDay = (date: string) => formatDate(date).slice(0, 5);

export function Chart({ series, points, currentValue, minAxisSpanPct, formatValue }: ChartProps) {
  const visible = series.slice(-points);
  if (visible.length < 2) return null;

  const values = visible.map((o) => o.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // D-22: un rango mínimo evita que variaciones pequeñas parezcan movimientos fuertes.
  const span = Math.max(max - min, (Math.abs(currentValue) * minAxisSpanPct) / 100);
  const center = (max + min) / 2;
  const domainMin = center - span / 2;
  const domainMax = center + span / 2;

  const yPercent = (value: number) =>
    span === 0 ? 50 : 100 - ((value - domainMin) / span) * 100;
  const step = WIDTH / (visible.length - 1);
  const coords = values
    .map((value, i) => `${(i * step).toFixed(2)},${((yPercent(value) * HEIGHT) / 100).toFixed(2)}`)
    .join(' ');

  const yLabels = [domainMax, center, domainMin];
  const xDates = [
    visible[0].date,
    visible[Math.floor((visible.length - 1) / 2)].date,
    visible[visible.length - 1].date,
  ];
  const period = isMonthly(visible)
    ? `Últimos ${visible.length} meses`
    : `Últimos ${visible.length} días hábiles`;

  return (
    <figure className={styles.chart}>
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
        <span
          className={styles.lastPoint}
          data-testid="last-point"
          style={{ top: `${yPercent(values[values.length - 1])}%` }}
        />
      </div>
      <div className={styles.xAxis} data-axis="x">
        {xDates.map((date, i) => (
          <span key={i}>{formatDay(date)}</span>
        ))}
      </div>
      <figcaption className={styles.period}>{period}</figcaption>
    </figure>
  );
}
