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
      // El logo se publica bajo la base del build; en disco está en /public.
      const file = `/public/${member.logo.slice(import.meta.env.BASE_URL.length)}`;
      const content = svgs[file];
      expect(content, file).toBeDefined();
      expect(content, file).toMatch(SVG_START);
    }
  });
});
