// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Video } from './Video';

afterEach(cleanup);

const renderVideo = (onComplete = vi.fn()) => {
  const { container } = render(<Video onComplete={onComplete} />);
  return { video: container.querySelector('video')!, onComplete };
};

describe('Video', () => {
  it('llama a onComplete al terminar el video', () => {
    const { video, onComplete } = renderVideo();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.ended(video);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('llama a onComplete de inmediato si el video falla al cargar', () => {
    const { video, onComplete } = renderVideo();
    fireEvent.error(video);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('tiene muted, autoplay y playsInline, y no se repite en bucle', () => {
    const { video } = renderVideo();
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('playsinline');
    expect(video).not.toHaveAttribute('loop');
  });

  it('usa por defecto el video de ejemplo', () => {
    const { video } = renderVideo();
    expect(video.getAttribute('src')).toBe('/media/video-demo.mp4');
  });
});
