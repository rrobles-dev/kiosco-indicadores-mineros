import styles from './Reel.module.css';

interface ReelProps {
  src?: string;
  /** Se llama al terminar el video o de inmediato si falla al cargar (la escena se salta). */
  onComplete: () => void;
}

// Silenciado: los navegadores bloquean la reproducción automática con audio.
export function Reel({ src = '/media/reel-demo.mp4', onComplete }: ReelProps) {
  return (
    <video
      className={styles.reel}
      src={src}
      autoPlay
      muted
      playsInline
      onEnded={onComplete}
      onError={onComplete}
    />
  );
}
