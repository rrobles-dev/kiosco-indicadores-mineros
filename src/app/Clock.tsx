import { useEffect, useState } from 'react';
import { formatSantiagoClock, msUntilNextMinute } from '../lib/dates';
import styles from './Clock.module.css';

interface ClockProps {
  /** Nombre de la organización; si no está definido no se muestra nada en su lugar. */
  organization?: string;
  now?: () => Date;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

const defaultNow = () => new Date();
const defaultSetTimer = (callback: () => void, ms: number) => setTimeout(callback, ms);
const defaultClearTimer = (handle: unknown) =>
  clearTimeout(handle as ReturnType<typeof setTimeout>);

export function Clock({
  organization,
  now = defaultNow,
  setTimer = defaultSetTimer,
  clearTimer = defaultClearTimer,
}: ClockProps) {
  const [text, setText] = useState(() => formatSantiagoClock(now()));

  useEffect(() => {
    // Espera el inicio del minuto siguiente; desde ahí, cada tick programa el
    // siguiente cambio de minuto (60 s) sin acumular desfase.
    let handle: unknown;
    const schedule = () => {
      handle = setTimer(() => {
        setText(formatSantiagoClock(now()));
        schedule();
      }, msUntilNextMinute(now()));
    };
    schedule();
    return () => clearTimer(handle);
  }, [now, setTimer, clearTimer]);

  return (
    <header className={styles.bar}>
      {organization ? <span className={styles.organization}>{organization}</span> : null}
      <span className={styles.clock}>{text}</span>
    </header>
  );
}
