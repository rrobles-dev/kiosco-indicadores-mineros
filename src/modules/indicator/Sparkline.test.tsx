// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Sparkline } from './Sparkline';

afterEach(cleanup);

const obs = (values: number[]) =>
  values.map((value, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, value }));

describe('Sparkline', () => {
  it('no dibuja nada con menos de 2 puntos', () => {
    expect(render(<Sparkline series={obs([1])} points={30} />).container).toBeEmptyDOMElement();
    cleanup();
    expect(render(<Sparkline series={[]} points={30} />).container).toBeEmptyDOMElement();
  });

  it('dibuja una polyline con un punto por valor', () => {
    const { container } = render(<Sparkline series={obs([1, 3, 2])} points={30} />);
    const points = container.querySelector('polyline')!.getAttribute('points')!.split(' ');
    expect(points).toEqual(['0.00,30.00', '50.00,0.00', '100.00,15.00']);
  });

  it('una serie plana se dibuja al centro', () => {
    const { container } = render(<Sparkline series={obs([5, 5])} points={30} />);
    expect(container.querySelector('polyline')!.getAttribute('points')).toBe('0.00,15.00 100.00,15.00');
  });
});
