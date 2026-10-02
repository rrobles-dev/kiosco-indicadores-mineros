import type { Observation } from '../../types/indicators';

interface SparklineProps {
  series: Observation[];
  /** Cantidad de observaciones finales que se grafican */
  points: number;
}

const WIDTH = 100;
const HEIGHT = 30;

export function Sparkline({ series, points }: SparklineProps) {
  const values = series.slice(-points).map((o) => o.value);
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const step = WIDTH / (values.length - 1);
  const coords = values
    .map((value, i) => {
      // Serie plana: línea al centro en vez de dividir por cero.
      const y = range === 0 ? HEIGHT / 2 : HEIGHT - ((value - min) / range) * HEIGHT;
      return `${(i * step).toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Gráfico de los últimos ${values.length} valores`}
    >
      <polyline
        points={coords}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
