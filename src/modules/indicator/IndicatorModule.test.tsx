// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { INDICATOR_MODULES } from '../../config/modules';
import type {
  IndicatorId,
  IndicatorModuleState,
  IndicatorReading,
  Observation,
  SourceId,
} from '../../types/indicators';
import type { IndicatorVariant } from '../../types/presentation';
import { IndicatorModule } from './IndicatorModule';
import styles from './IndicatorModule.module.css';

afterEach(cleanup);

const config = (id: IndicatorId) => INDICATOR_MODULES.find((c) => c.id === id)!;

function reading(
  id: IndicatorId,
  current: Observation,
  series?: Observation[],
  source: SourceId = 'mindicador',
): IndicatorReading {
  return { id, current, series, source, fetchedAt: '2026-10-02T19:00:00.000Z' };
}

const state = (
  status: IndicatorModuleState['status'],
  r?: IndicatorReading,
): IndicatorModuleState => ({ id: r?.id ?? 'uf', status, reading: r });

const ufSeries: Observation[] = [
  { date: '2026-09-30', value: 41000 },
  { date: '2026-10-01', value: 41050 },
  { date: '2026-10-02', value: 41100 },
];
const ufReading = reading('uf', { date: '2026-10-02', value: 41100 }, ufSeries);

function renderModule(variant: IndicatorVariant, s: IndicatorModuleState, id: IndicatorId = 'uf') {
  return render(<IndicatorModule config={config(id)} state={s} variant={variant} />);
}

const axis = (container: HTMLElement, name: 'x' | 'y') =>
  [...container.querySelectorAll(`[data-axis="${name}"] span`)].map((e) => e.textContent);

describe('variante large', () => {
  it('muestra etiqueta, valor, variación con su fecha, fecha, fuente y gráfico con ejes', () => {
    const { container } = renderModule('large', state('fresh', ufReading));

    expect(screen.getByRole('heading', { name: 'UF' })).toBeInTheDocument();
    // El máximo del eje Y repite el valor actual, así que se busca por clase.
    expect(container.querySelector(`.${styles.value}`)).toHaveTextContent('$41.100,00');
    expect(screen.getByLabelText('Sube 0,12%')).toHaveTextContent('▲ 0,12% respecto del 01-10-2026');
    expect(screen.getByText('02-10-2026')).toBeInTheDocument();
    expect(screen.getByText('Fuente: mindicador.cl')).toBeInTheDocument();
    expect(axis(container, 'y')).toEqual(['$41.100,00', '$41.050,00', '$41.000,00']);
    expect(axis(container, 'x')).toEqual(['30-09', '01-10', '02-10']);
    expect(screen.getByTestId('last-point')).toBeInTheDocument();
    expect(container.querySelector('polyline')).not.toBeNull();
  });

  it('la fuente sigue a reading.source', () => {
    renderModule('large', state('fresh', { ...ufReading, source: 'findic' }));
    expect(screen.getByText('Fuente: findic.cl')).toBeInTheDocument();
  });

  it('rótulo del período diario', () => {
    renderModule('large', state('fresh', ufReading));
    expect(screen.getByText('Últimos 3 días hábiles')).toBeInTheDocument();
  });

  it('rótulo del período mensual para la UTM', () => {
    const utm = reading('utm', { date: '2026-10-01', value: 72151 }, [
      { date: '2026-08-01', value: 71649 },
      { date: '2026-09-01', value: 71721 },
      { date: '2026-10-01', value: 72151 },
    ]);
    renderModule('large', state('fresh', utm), 'utm');
    expect(screen.getByText('Últimos 3 meses')).toBeInTheDocument();
    expect(screen.queryByText(/días hábiles/)).toBeNull();
  });
});

describe('variante compact', () => {
  it('muestra etiqueta, valor, variación, fecha y solo mínimo y máximo, sin fuente ni ejes extra', () => {
    const { container } = renderModule('compact', state('fresh', ufReading));

    expect(screen.getByRole('heading', { name: 'UF' })).toBeInTheDocument();
    expect(screen.getByLabelText('Sube 0,12%')).toHaveTextContent(/^▲ 0,12%$/);
    expect(screen.getByText('02-10-2026')).toBeInTheDocument();
    expect(axis(container, 'y')).toEqual(['$41.100,00', '$41.000,00']);
    expect(axis(container, 'x')).toEqual([]);
    expect(screen.queryByTestId('last-point')).toBeNull();
    expect(screen.queryByText(/Fuente/)).toBeNull();
    expect(screen.queryByText(/Últimos/)).toBeNull();
    expect(container.querySelector('polyline')).not.toBeNull();
  });
});

describe('variante minimal', () => {
  it('muestra solo etiqueta, valor y variación', () => {
    const { container } = renderModule('minimal', state('fresh', ufReading));

    expect(screen.getByText('UF')).toBeInTheDocument();
    expect(screen.getByText('$41.100,00')).toBeInTheDocument();
    expect(screen.getByLabelText('Sube 0,12%')).toBeInTheDocument();
    expect(screen.queryByText('02-10-2026')).toBeNull();
    expect(screen.queryByText(/Fuente/)).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe.each(['large', 'compact', 'minimal'] as const)('estados en la variante %s', (variant) => {
  it('loading: esqueleto sin valor ni spinner', () => {
    const { container } = renderModule(variant, state('loading'));
    expect(container.querySelector(`.${styles.skeleton}`)).not.toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(/\$/)).toBeNull();
    expect(screen.getByLabelText('UF')).toHaveAttribute('aria-busy', 'true');
  });

  it('stale: muestra "Actualizado el dd-mm-aaaa" y una clase distinta', () => {
    const stale = reading('uf', { date: '2026-09-30', value: 41000 }, ufSeries.slice(0, 1));
    const { container } = renderModule(variant, state('stale', stale));
    expect(screen.getByText('Actualizado el 30-09-2026')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass(styles.stale);
    expect(container.firstElementChild).not.toHaveClass(styles.fresh);
  });

  it('fresh: no muestra "Actualizado el"', () => {
    const { container } = renderModule(variant, state('fresh', ufReading));
    expect(screen.queryByText(/Actualizado el/)).toBeNull();
    expect(container.firstElementChild).toHaveClass(styles.fresh);
  });

  it('empty: no renderiza nada', () => {
    const { container } = renderModule(variant, state('empty'));
    expect(container).toBeEmptyDOMElement();
  });
});

describe('variación', () => {
  const series = (previous: number, current: number): Observation[] => [
    { date: '2026-10-01', value: previous },
    { date: '2026-10-02', value: current },
  ];

  it('negativa: flecha hacia abajo', () => {
    renderModule('compact', state('fresh', reading('dolar', { date: '2026-10-02', value: 950 }, series(1000, 950))), 'dolar');
    expect(screen.getByLabelText('Baja 5,00%')).toHaveTextContent('▼ 5,00%');
  });

  it('positiva: flecha hacia arriba', () => {
    renderModule('compact', state('fresh', reading('dolar', { date: '2026-10-02', value: 1050 }, series(1000, 1050))), 'dolar');
    expect(screen.getByLabelText('Sube 5,00%')).toHaveTextContent('▲ 5,00%');
  });

  it('sin serie: sin variación ni gráfico en ninguna variante', () => {
    const r = reading('libra_cobre', { date: '2026-10-02', value: 6.56 });
    for (const variant of ['large', 'compact', 'minimal'] as const) {
      const { container } = renderModule(variant, state('fresh', r), 'libra_cobre');
      expect(screen.getByText('US$ 6,56 /lb')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Sube|Baja|Sin variación/)).toBeNull();
      expect(container.querySelector('svg')).toBeNull();
      cleanup();
    }
  });

  it('serie de un solo punto: sin variación ni gráfico', () => {
    const r = reading('uf', { date: '2026-10-02', value: 41100 }, [{ date: '2026-10-02', value: 41100 }]);
    const { container } = renderModule('large', state('fresh', r));
    expect(screen.queryByLabelText(/Sube|Baja/)).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('el gráfico solo usa los últimos chartPoints valores', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      value: 100 + i,
    }));
    const r = reading('utm', { date: '2026-09-20', value: 119 }, many);
    const { container } = renderModule('compact', state('fresh', r), 'utm');
    expect(container.querySelector('polyline')!.getAttribute('points')!.split(' ')).toHaveLength(12);
  });
});
