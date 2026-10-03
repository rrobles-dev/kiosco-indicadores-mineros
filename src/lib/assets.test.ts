import { describe, expect, it } from 'vitest';
import { assetUrl } from './assets';

describe('assetUrl', () => {
  it('con base "/" deja la ruta desde la raíz', () => {
    expect(assetUrl('members/empresa-01.svg', '/')).toBe('/members/empresa-01.svg');
  });

  it('con base de subruta antepone la subruta', () => {
    expect(assetUrl('media/video-demo.mp4', '/kiosco-indicadores-mineros/')).toBe(
      '/kiosco-indicadores-mineros/media/video-demo.mp4',
    );
  });

  it('no genera dobles barras', () => {
    expect(assetUrl('/members/empresa-01.svg', '/kiosco/')).toBe('/kiosco/members/empresa-01.svg');
    expect(assetUrl('members/empresa-01.svg', '/kiosco')).toBe('/kiosco/members/empresa-01.svg');
  });

  it('por defecto usa la base del build', () => {
    expect(assetUrl('media/video-demo.mp4')).toBe(`${import.meta.env.BASE_URL}media/video-demo.mp4`);
  });
});
