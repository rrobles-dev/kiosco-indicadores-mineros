// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { INDICATOR_MODULES } from '../../config/modules';
import type {
  IndicatorId,
  IndicatorModuleConfig,
  IndicatorModuleState,
  IndicatorReading,
} from '../../types/indicators';
import { IndicatorModule } from './IndicatorModule';
import styles from './IndicatorModule.module.css';

afterEach(cleanup);

const config = (id: IndicatorId): IndicatorModuleConfig =>
  INDICATOR_MODULES.find((c) => c.id === id)!;

function reading(
  id: IndicatorId,
  current: { date: string; value: number },
  series?: Array<{ date: string; value: number }>,
): IndicatorReading {
  return { id, current, series, source: 'findic', fetchedAt: '2026-10-02T19:00:00.000Z' };
}

const state = (
  status: IndicatorModuleState['status'],
  r?: IndicatorReading,
): IndicatorModuleState => ({ id: r?.id ?? 'uf', status, reading: r });

const ufSeries = [
  { date: '2026-09-30', value: 41000 },
  { date: '2026-10-01', value: 41050 },
  { date: '2026-10-02', value: 41100 },
];

describe('IndicatorModule', () => {
  it('loading: muestra esqueleto sin valor ni spinner', () => {
    const { container } = render(
      <IndicatorModule config={config('uf')} state={state('loading')} />,
    );
    expect(container.querySelector(`.${styles.skeleton}`)).not.toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(/\$/)).toBeNull();
    expect(screen.getByLabelText('UF')).toHaveAttribute('aria-busy', 'true');
  });

  it('fresh: muestra etiqueta, valor, fecha, variación y sparkline', () => {
    const r = reading('uf', { date: '2026-10-02', value: 41100 }, ufSeries);
    const { container } = render(<IndicatorModule config={config('uf')} state={state('fresh', r)} />);

    expect(screen.getByRole('heading', { name: 'UF' })).toBeInTheDocument();
    expect(screen.getByText('$41.100,00')).toBeInTheDocument();
    expect(screen.getByText('02-10-2026')).toBeInTheDocument();
    expect(screen.getByText(/Sube/)).toHaveTextContent('Sube 0,12%');
    expect(screen.queryByText(/Actualizado el/)).toBeNull();
    expect(container.querySelector('polyline')).not.toBeNull();
    expect(container.firstElementChild).toHaveClass(styles.fresh);
  });

  it('stale: agrega "Actualizado el dd-mm-aaaa" y una clase distinta', () => {
    const r = reading('uf', { date: '2026-09-30', value: 41000 }, ufSeries.slice(0, 1));
    const { container } = render(<IndicatorModule config={config('uf')} state={state('stale', r)} />);

    expect(screen.getByText('Actualizado el 30-09-2026')).toBeInTheDocument();
    expect(screen.getByText('$41.000,00')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass(styles.stale);
    expect(container.firstElementChild).not.toHaveClass(styles.fresh);
  });

  it('empty: no renderiza nada', () => {
    const { container } = render(<IndicatorModule config={config('uf')} state={state('empty')} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('variación negativa: flecha hacia abajo y porcentaje', () => {
    const r = reading('dolar', { date: '2026-10-02', value: 950 }, [
      { date: '2026-10-01', value: 1000 },
      { date: '2026-10-02', value: 950 },
    ]);
    render(<IndicatorModule config={config('dolar')} state={state('fresh', r)} />);
    expect(screen.getByText(/Baja/)).toHaveTextContent('▼ Baja 5,00%');
  });

  it('variación positiva: flecha hacia arriba y porcentaje', () => {
    const r = reading('dolar', { date: '2026-10-02', value: 1050 }, [
      { date: '2026-10-01', value: 1000 },
      { date: '2026-10-02', value: 1050 },
    ]);
    render(<IndicatorModule config={config('dolar')} state={state('fresh', r)} />);
    expect(screen.getByText(/Sube/)).toHaveTextContent('▲ Sube 5,00%');
  });

  it('sin serie: sin variación y sin sparkline', () => {
    const r = reading('libra_cobre', { date: '2026-10-02', value: 6.56 });
    const { container } = render(
      <IndicatorModule config={config('libra_cobre')} state={state('fresh', r)} />,
    );
    expect(screen.getByText('US$ 6,56 /lb')).toBeInTheDocument();
    expect(screen.queryByText(/Sube|Baja|Sin variación/)).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('serie de un solo punto: sin variación y sin sparkline', () => {
    const r = reading('uf', { date: '2026-10-02', value: 41100 }, [
      { date: '2026-10-02', value: 41100 },
    ]);
    const { container } = render(<IndicatorModule config={config('uf')} state={state('fresh', r)} />);
    expect(screen.queryByText(/Sube|Baja/)).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('el sparkline solo grafica los últimos chartPoints valores', () => {
    const series = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      value: 100 + i,
    }));
    const r = reading('utm', { date: '2026-09-20', value: 119 }, series);
    const { container } = render(<IndicatorModule config={config('utm')} state={state('fresh', r)} />);
    const points = container.querySelector('polyline')!.getAttribute('points')!.split(' ');
    expect(points).toHaveLength(12);
  });
});
