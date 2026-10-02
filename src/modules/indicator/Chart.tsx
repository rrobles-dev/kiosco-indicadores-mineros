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
const TICK = 4;

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

  const yOf = (value: number) =>
    span === 0 ? HEIGHT / 2 : HEIGHT - ((value - domainMin) / span) * HEIGHT;
  const step = WIDTH / (visible.length - 1);

  // Las marcas del eje Y son exactamente tope, medio y base del dominio.
  const yMarks = [
    { y: 0, label: formatValue(center + span / 2) },
    { y: HEIGHT / 2, label: formatValue(center) },
    { y: HEIGHT, label: formatValue(domainMin) },
  ];
  const xMarks = [0, Math.floor((visible.length - 1) / 2), visible.length - 1].map((i) => ({
    x: i * step,
    label: formatDay(visible[i].date),
  }));

  const coords = values.map((value, i) => `${(i * step).toFixed(2)},${yOf(value).toFixed(2)}`).join(' ');
  const lastY = yOf(values[values.length - 1]);
  const period = isMonthly(visible)
    ? `Últimos ${visible.length} meses`
    : `Últimos ${visible.length} días hábiles`;
  const widest = yMarks.reduce((a, b) => (b.label.length > a.length ? b.label : a), '');

  return (
    <figure className={styles.chart}>
      <div className={styles.yAxis} data-axis="y">
        {/* Reserva el ancho de la columna: las marcas van posicionadas de forma absoluta. */}
        <div className={styles.sizer} aria-hidden="true">
          {widest}
        </div>
        {yMarks.map((mark, i) => (
          <span key={i} className={styles.yLabel} style={{ top: `${mark.y}%` }}>
            {mark.label}
          </span>
        ))}
      </div>
      <div className={styles.plot}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Gráfico de los últimos ${visible.length} valores`}
        >
          {/* De atrás hacia adelante: grilla, ejes, marcas del eje X, datos y último punto. */}
          <g data-layer="grid">
            {yMarks.map((mark, i) => (
              <line key={i} className={styles.grid} x1={0} x2={WIDTH} y1={mark.y} y2={mark.y} />
            ))}
          </g>
          <g data-layer="axes">
            <line className={styles.axis} data-axis-line="y" x1={0} x2={0} y1={0} y2={HEIGHT} />
            <line className={styles.axis} data-axis-line="x" x1={0} x2={WIDTH} y1={HEIGHT} y2={HEIGHT} />
            {xMarks.map((mark, i) => (
              <line
                key={i}
                className={styles.axis}
                data-tick="x"
                x1={mark.x}
                x2={mark.x}
                y1={HEIGHT}
                y2={HEIGHT + TICK}
              />
            ))}
          </g>
          <polyline className={styles.data} points={coords} fill="none" />
          <line
            className={styles.lastPoint}
            data-testid="last-point"
            x1={WIDTH}
            x2={WIDTH}
            y1={lastY}
            y2={lastY}
          />
        </svg>
      </div>
      <div className={styles.xAxis} data-axis="x">
        {xMarks.map((mark, i) => (
          <span
            key={i}
            className={styles.xLabel}
            style={{ left: `${mark.x}%`, transform: `translateX(-${mark.x}%)` }}
          >
            {mark.label}
          </span>
        ))}
      </div>
      <figcaption className={styles.period}>{period}</figcaption>
    </figure>
  );
}
