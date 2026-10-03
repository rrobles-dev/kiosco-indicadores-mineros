import { describe, expect, it } from 'vitest';
import { formatSantiagoClock, msUntilNextMinute, toSantiagoDate } from './dates';

describe('toSantiagoDate', () => {
  it('horario de verano (UTC-3): medianoche local', () => {
    expect(toSantiagoDate('2026-10-02T03:00:00.000Z')).toBe('2026-10-02');
  });

  it('un segundo antes de medianoche local', () => {
    expect(toSantiagoDate('2026-10-02T02:59:59.000Z')).toBe('2026-10-01');
  });

  it('horario de invierno (UTC-4): medianoche local', () => {
    expect(toSantiagoDate('2026-07-15T04:00:00.000Z')).toBe('2026-07-15');
  });

  it('lanza error con un string que no es fecha', () => {
    expect(() => toSantiagoDate('no-es-fecha')).toThrow();
  });
});

describe('formatSantiagoClock', () => {
  it('día de la semana en minúsculas, fecha dd-mm-aaaa y hora HH:mm', () => {
    expect(formatSantiagoClock(new Date('2026-10-02T20:45:00.000Z'))).toBe('viernes 02-10-2026 · 17:45');
  });

  it('cambia de día a la medianoche de Chile, no a la de UTC', () => {
    expect(formatSantiagoClock(new Date('2026-10-03T02:59:00.000Z'))).toBe('viernes 02-10-2026 · 23:59');
    expect(formatSantiagoClock(new Date('2026-10-03T03:00:00.000Z'))).toBe('sábado 03-10-2026 · 00:00');
  });

  it('usa 00 para la medianoche, no 24', () => {
    expect(formatSantiagoClock(new Date('2026-07-15T04:00:00.000Z'))).toBe('miércoles 15-07-2026 · 00:00');
  });

  it('cambio de horario: al pasar de UTC-3 a UTC-4 la hora local se repite', () => {
    expect(formatSantiagoClock(new Date('2026-04-05T02:30:00.000Z'))).toBe('sábado 04-04-2026 · 23:30');
    expect(formatSantiagoClock(new Date('2026-04-05T03:30:00.000Z'))).toBe('sábado 04-04-2026 · 23:30');
  });
});

describe('msUntilNextMinute', () => {
  it('cuenta hasta el inicio del minuto siguiente', () => {
    expect(msUntilNextMinute(new Date('2026-10-02T20:45:12.500Z'))).toBe(47_500);
  });

  it('justo al inicio de un minuto espera el minuto completo', () => {
    expect(msUntilNextMinute(new Date('2026-10-02T20:45:00.000Z'))).toBe(60_000);
  });
});
