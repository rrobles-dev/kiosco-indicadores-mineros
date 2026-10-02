// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMBERS } from '../../config/members';
import { Logos } from './Logos';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const names = () => screen.getAllByRole('img').map((img) => img.getAttribute('alt'));
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

/** Random determinista que avanza entre apariciones. */
function lcg(seed: number) {
  let state = seed;
  return () => (state = (state * 48271) % 2147483647) / 2147483647;
}

describe('Logos', () => {
  it('pagina 12 logos en 2 páginas de 6, sin repetir ni omitir ninguno', () => {
    render(<Logos members={MEMBERS} random={lcg(7)} onComplete={vi.fn()} />);
    const first = names();
    expect(first).toHaveLength(6);

    advance(8000);
    const second = names();
    expect(second).toHaveLength(6);

    expect([...first, ...second].sort()).toEqual(MEMBERS.map((m) => m.name).sort());
  });

  it('el orden cambia entre dos apariciones del módulo', () => {
    const random = lcg(42);
    const appearance = () => {
      const { unmount } = render(<Logos members={MEMBERS} random={random} onComplete={vi.fn()} />);
      const order = [names()];
      advance(8000);
      order.push(names());
      unmount();
      return order.flat();
    };

    const a = appearance();
    const b = appearance();
    expect(a).not.toEqual(b);
    expect([...a].sort()).toEqual([...b].sort());
  });

  it('con el mismo random da el mismo orden (determinista)', () => {
    const first = render(<Logos members={MEMBERS} random={lcg(5)} onComplete={vi.fn()} />);
    const a = names();
    first.unmount();
    render(<Logos members={MEMBERS} random={lcg(5)} onComplete={vi.fn()} />);
    expect(names()).toEqual(a);
  });

  it('cada página dura lo mismo y onComplete llega al terminar la última', () => {
    const onComplete = vi.fn();
    render(<Logos members={MEMBERS} random={lcg(1)} onComplete={onComplete} />);
    const first = names();

    advance(7999);
    expect(names()).toEqual(first);
    advance(1);
    expect(names()).not.toEqual(first);
    expect(onComplete).not.toHaveBeenCalled();

    advance(7999);
    expect(onComplete).not.toHaveBeenCalled();
    advance(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('el orden no cambia al re-renderizar dentro de la misma aparición', () => {
    const { rerender } = render(<Logos members={MEMBERS} random={lcg(3)} onComplete={vi.fn()} />);
    const before = names();
    rerender(<Logos members={MEMBERS} random={lcg(99)} onComplete={vi.fn()} />);
    expect(names()).toEqual(before);
  });

  it('un onComplete nuevo en un re-render no reinicia el temporizador de la página', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Logos members={MEMBERS} random={lcg(3)} onComplete={first} />);
    advance(8000);
    advance(4000);
    rerender(<Logos members={MEMBERS} random={lcg(3)} onComplete={second} />);
    advance(4000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('si un logo no carga, se oculta sin romper la página', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Logos members={MEMBERS} random={lcg(2)} onComplete={vi.fn()} />);
    const images = screen.getAllByRole('img');
    fireEvent.error(images[0]);
    expect(screen.getAllByRole('img')).toHaveLength(5);
    expect(screen.queryByAltText(images[0].getAttribute('alt')!)).toBeNull();
  });

  it('si un logo no carga, registra console.warn con su id y su ruta', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Logos members={MEMBERS} random={lcg(2)} onComplete={vi.fn()} />);
    const image = screen.getAllByRole('img')[0];
    const member = MEMBERS.find((m) => m.name === image.getAttribute('alt'))!;

    fireEvent.error(image);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0].join(' ')).toContain(member.id);
    expect(warn.mock.calls[0].join(' ')).toContain(member.logo);
  });

  it('el título accesible es "Logos" por defecto', () => {
    render(<Logos members={MEMBERS} random={lcg(1)} onComplete={vi.fn()} />);
    expect(screen.getByRole('list', { name: 'Logos' })).toBeInTheDocument();
  });

  it('usa el título configurado como título accesible', () => {
    render(<Logos members={MEMBERS} random={lcg(1)} onComplete={vi.fn()} title="Patrocinadores" />);
    expect(screen.getByRole('list', { name: 'Patrocinadores' })).toBeInTheDocument();
  });

  it('sin socios, completa de inmediato', () => {
    const onComplete = vi.fn();
    render(<Logos members={[]} random={lcg(1)} onComplete={onComplete} />);
    advance(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
