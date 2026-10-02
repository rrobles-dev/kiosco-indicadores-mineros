// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INDICATOR_MODULES } from '../config/modules';
import { indicadores, recepcion } from '../config/profiles';
import type { IndicatorId, IndicatorModuleState } from '../types/indicators';
import { ProfileLayout } from './ProfileLayout';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const ALL: IndicatorId[] = ['uf', 'dolar', 'euro', 'utm', 'libra_cobre'];

function makeStates(
  overrides: Partial<Record<IndicatorId, IndicatorModuleState['status']>> = {},
): Record<IndicatorId, IndicatorModuleState> {
  return Object.fromEntries(
    ALL.map((id): [IndicatorId, IndicatorModuleState] => {
      const status = overrides[id] ?? 'fresh';
      if (status === 'empty' || status === 'loading') return [id, { id, status }];
      return [
        id,
        {
          id,
          status,
          reading: {
            id,
            current: { date: '2026-10-02', value: 100 },
            source: 'mindicador',
            fetchedAt: '2026-10-02T19:00:00.000Z',
          },
        },
      ];
    }),
  ) as Record<IndicatorId, IndicatorModuleState>;
}

const label = (id: IndicatorId) => INDICATOR_MODULES.find((c) => c.id === id)!.label;
const heading = (id: IndicatorId) => screen.queryByRole('heading', { name: label(id) });
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

function renderProfile(
  profile = recepcion,
  states = makeStates(),
  random: () => number = () => 0,
) {
  return render(
    <ProfileLayout profile={profile} configs={INDICATOR_MODULES} states={states} random={random} />,
  );
}

describe('ProfileLayout main-strip (recepcion)', () => {
  it('avanza de escena a los 15 s y vuelve al inicio', () => {
    renderProfile();
    expect(heading('libra_cobre')).toBeInTheDocument();
    expect(heading('dolar')).toBeNull();

    advance(14_999);
    expect(heading('libra_cobre')).toBeInTheDocument();

    advance(1);
    expect(heading('libra_cobre')).toBeNull();
    expect(heading('dolar')).toBeInTheDocument();
    expect(heading('euro')).toBeInTheDocument();

    advance(15_000);
    expect(heading('uf')).toBeInTheDocument();
    expect(heading('utm')).toBeInTheDocument();

    advance(15_000);
    expect(heading('libra_cobre')).toBeInTheDocument();
  });

  it('salta una escena con todos sus módulos empty', () => {
    renderProfile(recepcion, makeStates({ dolar: 'empty', euro: 'empty' }));
    expect(heading('libra_cobre')).toBeInTheDocument();

    advance(15_000);
    expect(heading('dolar')).toBeNull();
    expect(heading('uf')).toBeInTheDocument();
    expect(heading('utm')).toBeInTheDocument();
  });

  it('una escena con un solo módulo empty se muestra con el otro', () => {
    renderProfile(recepcion, makeStates({ dolar: 'empty' }));
    advance(15_000);
    expect(heading('dolar')).toBeNull();
    expect(heading('euro')).toBeInTheDocument();
  });

  it('la franja muestra los cinco en minimal y oculta los empty', () => {
    renderProfile(recepcion, makeStates({ utm: 'empty' }));
    const strip = within(screen.getByRole('complementary'));
    for (const id of ['uf', 'dolar', 'euro', 'libra_cobre'] as const) {
      expect(strip.getByText(label(id))).toBeInTheDocument();
    }
    expect(strip.queryByText(label('utm'))).toBeNull();
  });

  it('muestra el mensaje cuando no hay nada reproducible', () => {
    const states = makeStates(Object.fromEntries(ALL.map((id) => [id, 'empty'])));
    renderProfile(recepcion, states);
    expect(screen.getByText('Indicadores no disponibles por el momento')).toBeInTheDocument();
    expect(screen.queryByRole('complementary')?.children).toHaveLength(0);
  });

  it('se recupera del mensaje cuando llegan datos', () => {
    const empty = makeStates(Object.fromEntries(ALL.map((id) => [id, 'empty'])));
    const { rerender } = renderProfile(recepcion, empty);
    expect(screen.getByText('Indicadores no disponibles por el momento')).toBeInTheDocument();

    rerender(
      <ProfileLayout profile={recepcion} configs={INDICATOR_MODULES} states={makeStates()} random={() => 0} />,
    );
    advance(5000);
    expect(screen.queryByText('Indicadores no disponibles por el momento')).toBeNull();
    expect(heading('libra_cobre')).toBeInTheDocument();
  });
});

describe('ProfileLayout featured-sidebar (indicadores)', () => {
  it('la barra lateral muestra los demás indicadores y omite el destacado', () => {
    renderProfile(indicadores);
    const featured = ALL.find((id) => heading(id))!;
    const side = within(screen.getByRole('complementary'));

    expect(side.queryByText(label(featured))).toBeNull();
    for (const id of ALL.filter((i) => i !== featured)) {
      expect(side.getByText(label(id))).toBeInTheDocument();
    }
  });

  it('cada escena es un solo indicador large y cambia cada 15 s', () => {
    renderProfile(indicadores);
    const shown = new Set<IndicatorId>();
    for (let i = 0; i < 5; i++) {
      const visible = ALL.filter((id) => heading(id));
      expect(visible).toHaveLength(1);
      shown.add(visible[0]);
      advance(15_000);
    }
    expect(shown.size).toBe(5);
  });
});
