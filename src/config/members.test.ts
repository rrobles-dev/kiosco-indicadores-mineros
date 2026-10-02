import { describe, expect, it } from 'vitest';
import { MEMBERS } from './members';

const svgs = import.meta.glob<string>('/public/members/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const SVG_START = /^<svg\b[^>]*\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/;

describe('MEMBERS', () => {
  it('hay 12 socios con id y nombre únicos', () => {
    expect(MEMBERS).toHaveLength(12);
    expect(new Set(MEMBERS.map((m) => m.id)).size).toBe(12);
    expect(new Set(MEMBERS.map((m) => m.name)).size).toBe(12);
  });

  it('cada logo existe en public/ y empieza con <svg que declara el xmlns de SVG', () => {
    for (const member of MEMBERS) {
      const content = svgs[`/public${member.logo}`];
      expect(content, member.logo).toBeDefined();
      expect(content, member.logo).toMatch(SVG_START);
    }
  });
});
