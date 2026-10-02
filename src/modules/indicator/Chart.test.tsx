// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Chart } from './Chart';

afterEach(cleanup);

const obs = (values: number[]) =>
  values.map((value, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, value }));
const fmt = (n: number) => String(n);

describe('Chart', () => {
  it('no dibuja nada con menos de 2 puntos', () => {
    expect(render(<Chart series={obs([1])} points={30} mode="full" formatValue={fmt} />).container).toBeEmptyDOMElement();
    cleanup();
    expect(render(<Chart series={[]} points={30} mode="minmax" formatValue={fmt} />).container).toBeEmptyDOMElement();
  });

  it('dibuja una polyline con un punto por valor', () => {
    const { container } = render(<Chart series={obs([1, 3, 2])} points={30} mode="minmax" formatValue={fmt} />);
    expect(container.querySelector('polyline')!.getAttribute('points')!.split(' ')).toEqual([
      '0.00,100.00',
      '50.00,0.00',
      '100.00,50.00',
    ]);
  });

  it('una serie plana se dibuja al centro', () => {
    const { container } = render(<Chart series={obs([5, 5])} points={30} mode="minmax" formatValue={fmt} />);
    expect(container.querySelector('polyline')!.getAttribute('points')).toBe('0.00,50.00 100.00,50.00');
  });

  it('el último punto destacado queda a la altura del último valor', () => {
    const { getByTestId } = render(<Chart series={obs([1, 3, 2])} points={30} mode="full" formatValue={fmt} />);
    expect(getByTestId('last-point').style.top).toBe('50%');
  });
});
