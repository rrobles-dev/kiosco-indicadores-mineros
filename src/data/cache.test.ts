import { describe, expect, it } from 'vitest';
import { createReadingCache } from './cache';
import type { IndicatorReading } from '../types/indicators';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

const KEY = 'kiosco:v1:reading:uf';

const reading: IndicatorReading = {
  id: 'uf',
  current: { date: '2026-10-02', value: 41073.57 },
  series: [
    { date: '2026-10-01', value: 41065.38 },
    { date: '2026-10-02', value: 41073.57 },
  ],
  source: 'findic',
  fetchedAt: '2026-10-02T19:00:00.000Z',
};

describe('createReadingCache', () => {
  it('escribe y lee una lectura con la clave por indicador', () => {
    const storage = new MemoryStorage();
    const cache = createReadingCache(storage);
    cache.write(reading);
    expect(storage.getItem(KEY)).not.toBeNull();
    expect(cache.read('uf')).toEqual(reading);
  });

  it('devuelve undefined si no hay nada guardado', () => {
    expect(createReadingCache(new MemoryStorage()).read('uf')).toBeUndefined();
  });

  it.each([
    ['JSON inválido', '{no es json'],
    ['id distinto', JSON.stringify({ ...reading, id: 'dolar' })],
    ['valor no finito', JSON.stringify({ ...reading, current: { date: '2026-10-02', value: null } })],
    ['valor de texto', JSON.stringify({ ...reading, current: { date: '2026-10-02', value: 'abc' } })],
    ['fecha inválida', JSON.stringify({ ...reading, current: { date: '2026-02-30', value: 1 } })],
    ['fecha con formato ISO completo', JSON.stringify({ ...reading, current: { date: '2026-10-02T03:00:00.000Z', value: 1 } })],
    ['no es objeto', '42'],
  ])('elimina la clave y devuelve undefined con %s', (_name, stored) => {
    const storage = new MemoryStorage();
    storage.setItem(KEY, stored);
    expect(createReadingCache(storage).read('uf')).toBeUndefined();
    expect(storage.getItem(KEY)).toBeNull();
  });

  it('write no lanza si setItem lanza', () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(() => createReadingCache(storage).write(reading)).not.toThrow();
  });

  it('read no lanza si getItem lanza', () => {
    const storage = new MemoryStorage();
    storage.getItem = () => {
      throw new Error('SecurityError');
    };
    expect(createReadingCache(storage).read('uf')).toBeUndefined();
  });
});
