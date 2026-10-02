import { describe, expect, it } from 'vitest';
import { isFresh } from './freshness';
import type { FreshnessRule } from '../types/indicators';

const sameDay: FreshnessRule = { kind: 'sameDay' };
const maxAge4: FreshnessRule = { kind: 'maxAgeDays', days: 4 };
const sameMonth: FreshnessRule = { kind: 'sameMonth' };

// Mediodía en Chile: lejos de los bordes de cambio de día.
const at = (isoDate: string) => new Date(`${isoDate}T16:00:00.000Z`);

describe('isFresh', () => {
  it('UF de hoy es vigente', () => {
    expect(isFresh('2026-10-02', sameDay, at('2026-10-02'))).toBe(true);
  });

  it('UF de ayer no es vigente', () => {
    expect(isFresh('2026-10-01', sameDay, at('2026-10-02'))).toBe(false);
  });

  it('lunes con dólar del viernes: vigente (3 días)', () => {
    expect(isFresh('2026-10-02', maxAge4, at('2026-10-05'))).toBe(true);
  });

  it('Fiestas Patrias: cobre del 17-09 vigente el 21-09 (4 días)', () => {
    expect(isFresh('2026-09-17', maxAge4, at('2026-09-21'))).toBe(true);
  });

  it('Fiestas Patrias: cobre del 17-09 no vigente el 22-09 (5 días)', () => {
    expect(isFresh('2026-09-17', maxAge4, at('2026-09-22'))).toBe(false);
  });

  it('UTM de septiembre no es vigente el 1 de octubre', () => {
    expect(isFresh('2026-09-01', sameMonth, at('2026-10-01'))).toBe(false);
  });

  it('UTM de octubre es vigente el 1 de octubre', () => {
    expect(isFresh('2026-10-01', sameMonth, at('2026-10-01'))).toBe(true);
  });

  it('mismo mes de otro año no es vigente', () => {
    expect(isFresh('2025-10-01', sameMonth, at('2026-10-01'))).toBe(false);
  });

  it('cruza el cambio de mes en el cálculo de días', () => {
    expect(isFresh('2026-09-29', maxAge4, at('2026-10-03'))).toBe(true);
    expect(isFresh('2026-09-29', maxAge4, at('2026-10-04'))).toBe(false);
  });

  describe('zona horaria: en Chile aún es 1 de octubre', () => {
    const now = new Date('2026-10-02T02:30:00.000Z');

    it('UF 2026-10-01 es vigente', () => {
      expect(isFresh('2026-10-01', sameDay, now)).toBe(true);
    });

    it('UF 2026-10-02 no es vigente por ser futura', () => {
      expect(isFresh('2026-10-02', sameDay, now)).toBe(false);
    });
  });

  it('fecha futura en maxAgeDays no es vigente', () => {
    expect(isFresh('2026-10-03', maxAge4, at('2026-10-02'))).toBe(false);
  });

  it('fecha futura en sameMonth no es vigente', () => {
    expect(isFresh('2026-10-20', sameMonth, at('2026-10-02'))).toBe(false);
  });
});
