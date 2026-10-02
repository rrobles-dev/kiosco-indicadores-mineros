import { describe, expect, it } from 'vitest';
import { MEMBERS } from './members';

const files = Object.keys(import.meta.glob('/public/members/*.svg'));

describe('MEMBERS', () => {
  it('hay 12 socios con id y nombre únicos', () => {
    expect(MEMBERS).toHaveLength(12);
    expect(new Set(MEMBERS.map((m) => m.id)).size).toBe(12);
    expect(new Set(MEMBERS.map((m) => m.name)).size).toBe(12);
  });

  it('cada logo existe en public/', () => {
    for (const member of MEMBERS) {
      expect(files, member.logo).toContain(`/public${member.logo}`);
    }
  });
});
