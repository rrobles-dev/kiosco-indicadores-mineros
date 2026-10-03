// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Clock } from './Clock';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const text = () => screen.getByRole('banner').textContent;

describe('Clock', () => {
  it('muestra día, fecha y hora en America/Santiago', () => {
    vi.setSystemTime(new Date('2026-10-02T20:45:12.000Z'));
    render(<Clock />);
    expect(text()).toBe('viernes 02-10-2026 · 17:45');
  });

  it('se actualiza al inicio del minuto siguiente y luego cada 60 s', () => {
    vi.setSystemTime(new Date('2026-10-02T20:45:12.000Z'));
    render(<Clock />);

    advance(47_999);
    expect(text()).toContain('17:45');
    advance(1);
    expect(text()).toContain('17:46');

    advance(59_999);
    expect(text()).toContain('17:46');
    advance(1);
    expect(text()).toContain('17:47');
  });

  it('cambia de día a la medianoche de Chile', () => {
    vi.setSystemTime(new Date('2026-10-03T02:59:30.000Z'));
    render(<Clock />);
    expect(text()).toBe('viernes 02-10-2026 · 23:59');

    advance(30_000);
    expect(text()).toBe('sábado 03-10-2026 · 00:00');
  });

  it('usa el now y los timers inyectados', () => {
    const now = () => new Date('2026-10-02T20:45:59.000Z');
    const setTimer = vi.fn(() => 'handle');
    const clearTimer = vi.fn();
    const { unmount } = render(<Clock now={now} setTimer={setTimer} clearTimer={clearTimer} />);

    expect(text()).toBe('viernes 02-10-2026 · 17:45');
    expect(setTimer).toHaveBeenCalledWith(expect.any(Function), 1_000);
    unmount();
    expect(clearTimer).toHaveBeenCalledWith('handle');
  });

  it('muestra el nombre de la organización si está configurado', () => {
    vi.setSystemTime(new Date('2026-10-02T20:45:00.000Z'));
    render(<Clock organization="Organización de ejemplo" />);
    expect(screen.getByText('Organización de ejemplo')).toBeInTheDocument();
  });

  it('sin organización no muestra nada en su lugar', () => {
    vi.setSystemTime(new Date('2026-10-02T20:45:00.000Z'));
    render(<Clock />);
    expect(screen.getByRole('banner').children).toHaveLength(1);
  });
});
