// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

const video = () => document.querySelector('video');
const logos = () => screen.queryByRole('list', { name: 'Socios' });
const allEmpty = () => makeStates(Object.fromEntries(ALL.map((id) => [id, 'empty'])));
const UNAVAILABLE = 'Indicadores no disponibles por el momento';

// Cada escena programa su timer tras renderizar: no se pueden encadenar dos en un solo avance.
const goToReel = () => {
  advance(15_000);
  advance(15_000);
};

describe('ProfileLayout main-strip (recepcion)', () => {
  it('recorre cobre, dólar y euro, reel, UF y UTM, logos y vuelve al inicio', () => {
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
    expect(video()).not.toBeNull();
    expect(heading('dolar')).toBeNull();

    // El reel no avanza por tiempo corto: espera a que termine el video.
    advance(20_000);
    expect(video()).not.toBeNull();
    fireEvent.ended(video()!);
    expect(video()).toBeNull();
    expect(heading('uf')).toBeInTheDocument();
    expect(heading('utm')).toBeInTheDocument();

    advance(15_000);
    expect(logos()).not.toBeNull();

    // Dos páginas de 8 s y vuelve al inicio.
    advance(8000);
    expect(logos()).not.toBeNull();
    advance(8000);
    expect(logos()).toBeNull();
    expect(heading('libra_cobre')).toBeInTheDocument();
  });

  it('si el video del reel falla, la escena se salta de inmediato', () => {
    renderProfile();
    goToReel();
    fireEvent.error(video()!);
    expect(video()).toBeNull();
    expect(heading('uf')).toBeInTheDocument();
  });

  it('el reel avanza por el tope de 90 s si el video nunca termina', () => {
    renderProfile();
    goToReel();
    advance(89_999);
    expect(video()).not.toBeNull();
    advance(1);
    expect(video()).toBeNull();
    expect(heading('uf')).toBeInTheDocument();
  });

  it('la franja permanece en todas las escenas, incluidos el reel y los logos', () => {
    renderProfile();
    const stripHas = () => {
      const strip = within(screen.getByRole('complementary'));
      for (const id of ALL) expect(strip.getByText(label(id))).toBeInTheDocument();
    };
    stripHas();
    advance(15_000);
    stripHas();
    advance(15_000);
    expect(video()).not.toBeNull();
    stripHas();
    fireEvent.ended(video()!);
    advance(15_000);
    expect(logos()).not.toBeNull();
    stripHas();
  });

  it('salta una escena con todos sus módulos empty', () => {
    renderProfile(recepcion, makeStates({ dolar: 'empty', euro: 'empty' }));
    expect(heading('libra_cobre')).toBeInTheDocument();

    advance(15_000);
    expect(heading('dolar')).toBeNull();
    expect(video()).not.toBeNull();
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

  it('con todos los indicadores empty sigue mostrando el reel y los logos', () => {
    renderProfile(recepcion, allEmpty());
    expect(video()).not.toBeNull();
    expect(screen.queryByText(UNAVAILABLE)).toBeNull();
    expect(screen.getByRole('complementary')).toBeEmptyDOMElement();
  });
});

describe('ProfileLayout sin nada reproducible', () => {
  it('muestra el mensaje cuando ninguna escena es reproducible', () => {
    renderProfile(indicadores, allEmpty());
    expect(screen.getByText(UNAVAILABLE)).toBeInTheDocument();
  });

  it('se recupera del mensaje cuando llegan datos', () => {
    const { rerender } = renderProfile(indicadores, allEmpty());
    expect(screen.getByText(UNAVAILABLE)).toBeInTheDocument();

    rerender(
      <ProfileLayout profile={indicadores} configs={INDICATOR_MODULES} states={makeStates()} random={() => 0} />,
    );
    advance(5000);
    expect(screen.queryByText(UNAVAILABLE)).toBeNull();
    expect(ALL.some((id) => heading(id))).toBe(true);
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
