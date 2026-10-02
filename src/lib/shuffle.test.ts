import { describe, expect, it } from 'vitest';
import { shuffle } from './shuffle';

describe('shuffle', () => {
  const items = [1, 2, 3, 4, 5, 6];

  it('devuelve una permutación y no modifica el original', () => {
    const copy = [...items];
    const result = shuffle(items, () => 0.3);
    expect(items).toEqual(copy);
    expect([...result].sort()).toEqual(copy);
  });

  it('con random determinista da siempre el mismo orden', () => {
    expect(shuffle(items, () => 0)).toEqual(shuffle(items, () => 0));
    expect(shuffle(items, () => 0)).toEqual([2, 3, 4, 5, 6, 1]);
  });

  it('con random cercano a 1 conserva el orden', () => {
    expect(shuffle(items, () => 0.999)).toEqual(items);
  });

  it('maneja listas vacías y de un elemento', () => {
    expect(shuffle([], () => 0)).toEqual([]);
    expect(shuffle([1], () => 0)).toEqual([1]);
  });
});
