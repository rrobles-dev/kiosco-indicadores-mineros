// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Reel } from './Reel';

afterEach(cleanup);

const renderReel = (onComplete = vi.fn()) => {
  const { container } = render(<Reel onComplete={onComplete} />);
  return { video: container.querySelector('video')!, onComplete };
};

describe('Reel', () => {
  it('llama a onComplete al terminar el video', () => {
    const { video, onComplete } = renderReel();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.ended(video);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('llama a onComplete de inmediato si el video falla al cargar', () => {
    const { video, onComplete } = renderReel();
    fireEvent.error(video);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('tiene muted, autoplay y playsInline, y no se repite en bucle', () => {
    const { video } = renderReel();
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('playsinline');
    expect(video).not.toHaveAttribute('loop');
  });

  it('usa por defecto el video de ejemplo', () => {
    const { video } = renderReel();
    expect(video.getAttribute('src')).toBe('/media/reel-demo.mp4');
  });
});
