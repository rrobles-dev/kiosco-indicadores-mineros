import styles from './Video.module.css';

interface VideoProps {
  src?: string;
  /** Se llama al terminar el video o de inmediato si falla al cargar (la escena se salta). */
  onComplete: () => void;
}

// Silenciado: los navegadores bloquean la reproducción automática con audio.
export function Video({ src = '/media/video-demo.mp4', onComplete }: VideoProps) {
  return (
    <video
      className={styles.video}
      src={src}
      autoPlay
      muted
      playsInline
      onEnded={onComplete}
      onError={onComplete}
    />
  );
}
