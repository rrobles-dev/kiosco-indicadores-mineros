// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Observation } from '../../types/indicators';
import { Chart } from './Chart';
import styles from './Chart.module.css';

afterEach(cleanup);

const obs = (values: number[]): Observation[] =>
  values.map((value, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, value }));
const fmt = (n: number) => n.toFixed(2);

function renderChart(values: number[], minAxisSpanPct = 2) {
  const { container, getByTestId } = render(
    <Chart
      series={obs(values)}
      points={values.length}
      currentValue={values[values.length - 1]}
      minAxisSpanPct={minAxisSpanPct}
      formatValue={fmt}
    />,
  );
  const ys = container
    .querySelector('polyline')!
    .getAttribute('points')!
    .split(' ')
    .map((p) => Number(p.split(',')[1]));
  const yLabels = [...container.querySelectorAll('[data-axis="y"] span')].map((e) => e.textContent);
  return { container, getByTestId, ys, yLabels };
}

describe('Chart', () => {
  it('no dibuja nada con menos de 2 puntos', () => {
    const render1 = (series: Observation[]) =>
      render(
        <Chart series={series} points={30} currentValue={1} minAxisSpanPct={2} formatValue={fmt} />,
      ).container;
    expect(render1(obs([1]))).toBeEmptyDOMElement();
    cleanup();
    expect(render1([])).toBeEmptyDOMElement();
  });

  it('serie con subida pequeña y constante (tipo UF): la línea ocupa menos de la mitad del alto', () => {
    // ~0,3 % en el período
    const values = Array.from({ length: 30 }, (_, i) => 41000 + (i * 123) / 29);
    const { ys } = renderChart(values);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(50);
  });

  it('serie plana: sin NaN y línea horizontal al centro', () => {
    const { ys, yLabels, container, getByTestId } = renderChart([5, 5, 5, 5]);
    expect(container.querySelector('polyline')!.getAttribute('points')).not.toContain('NaN');
    expect(ys).toEqual([50, 50, 50, 50]);
    expect(yLabels.join(' ')).not.toContain('NaN');
    expect(parseFloat(getByTestId('last-point').getAttribute('y1')!)).toBeCloseTo(50, 6);
  });

  it('serie con rango mayor al mínimo (tipo cobre): el dominio coincide con mínimo y máximo de los datos', () => {
    // ~6 %
    const { ys, yLabels } = renderChart([6.2, 6.4, 6.3, 6.6, 6.5]);
    expect(yLabels).toEqual(['6.60', '6.40', '6.20']);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(100);
  });

  it('las marcas del eje Y son las del dominio, no las de los datos', () => {
    // Datos entre 1000 y 1002; el rango mínimo (2 % de 1002 = 20,04) amplía el dominio.
    const { yLabels } = renderChart([1000, 1001, 1002]);
    expect(yLabels).toEqual(['1011.02', '1001.00', '990.98']);
  });

  it('muestra tres marcas en cada eje, último punto y rótulo del período', () => {
    const { container, getByTestId } = renderChart([1, 2, 3, 4, 5]);
    expect(container.querySelectorAll('[data-axis="y"] span')).toHaveLength(3);
    expect([...container.querySelectorAll('[data-axis="x"] span')].map((e) => e.textContent)).toEqual([
      '01-09',
      '03-09',
      '05-09',
    ]);
    expect(getByTestId('last-point')).toBeInTheDocument();
    expect(container.querySelector('figcaption')).toHaveTextContent('Últimos 5 días hábiles');
  });

  describe('grilla y ejes', () => {
    const values = [6.2, 6.4, 6.3, 6.6, 6.5];

    it('hay tres líneas de grilla, cada una a la altura de su marca del eje Y', () => {
      const { container } = renderChart(values);
      const grid = [...container.querySelectorAll('[data-layer="grid"] line')];
      const labels = [...container.querySelectorAll<HTMLElement>('[data-axis="y"] span')];

      expect(grid).toHaveLength(3);
      expect(labels).toHaveLength(3);
      grid.forEach((line, i) => {
        const y = Number(line.getAttribute('y1'));
        expect(line.getAttribute('y2')).toBe(String(y));
        expect(line.getAttribute('x1')).toBe('0');
        expect(line.getAttribute('x2')).toBe('100');
        expect(parseFloat(labels[i].style.top)).toBe(y);
        expect(line).toHaveClass(styles.grid);
      });
      expect(grid.map((l) => Number(l.getAttribute('y1')))).toEqual([0, 50, 100]);
    });

    it('existen las líneas de ambos ejes y tres marcas bajo las fechas del eje X', () => {
      const { container } = renderChart(values);
      const yAxis = container.querySelector('[data-axis-line="y"]')!;
      const xAxis = container.querySelector('[data-axis-line="x"]')!;

      expect([yAxis.getAttribute('x1'), yAxis.getAttribute('x2')]).toEqual(['0', '0']);
      expect([xAxis.getAttribute('y1'), xAxis.getAttribute('y2')]).toEqual(['100', '100']);
      expect(yAxis).toHaveClass(styles.axis);
      expect(xAxis).toHaveClass(styles.axis);

      const ticks = [...container.querySelectorAll('[data-tick="x"]')];
      expect(ticks.map((t) => Number(t.getAttribute('x1')))).toEqual([0, 50, 100]);
      for (const tick of ticks) expect(Number(tick.getAttribute('y2'))).toBeGreaterThan(100);
    });

    it('en el DOM la grilla y los ejes van antes que la línea de datos, y el último punto después', () => {
      const { container, getByTestId } = renderChart(values);
      const before = (a: Element, b: Element) =>
        Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      const data = container.querySelector('polyline')!;
      const grid = container.querySelector('[data-layer="grid"]')!;
      const axes = container.querySelector('[data-layer="axes"]')!;

      expect(before(grid, axes)).toBe(true);
      expect(before(axes, data)).toBe(true);
      expect(before(data, getByTestId('last-point'))).toBe(true);
    });

    it('los colores salen de clases CSS, no del SVG', () => {
      const { container } = renderChart(values);
      for (const el of container.querySelectorAll('svg line, svg polyline')) {
        expect(el.hasAttribute('stroke')).toBe(false);
        expect(el.getAttribute('class')).toBeTruthy();
      }
    });
  });
});
