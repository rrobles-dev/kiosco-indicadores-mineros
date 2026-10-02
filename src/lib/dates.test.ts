import { describe, expect, it } from 'vitest';
import { toSantiagoDate } from './dates';

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
