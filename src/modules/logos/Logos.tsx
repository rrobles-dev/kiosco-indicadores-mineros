import { useEffect, useRef, useState } from 'react';
import type { Member } from '../../config/members';
import { shuffle } from '../../lib/shuffle';
import styles from './Logos.module.css';

interface LogosProps {
  members: Member[];
  random: () => number;
  /** Se llama al terminar la última página. */
  onComplete: () => void;
  pageSize?: number;
  pageMs?: number;
  /** Título accesible del carrusel. */
  title?: string;
}

function paginate<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

export function Logos({
  members,
  random,
  onComplete,
  pageSize = 6,
  pageMs = 8000,
  title = 'Logos',
}: LogosProps) {
  // D-24: el orden se baraja una vez por aparición del módulo (al montarse).
  const [pages] = useState(() => paginate(shuffle(members, random), pageSize));
  const [page, setPage] = useState(0);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    const timer = setTimeout(
      () => {
        if (page + 1 >= pages.length) onCompleteRef.current();
        else setPage(page + 1);
      },
      pages.length === 0 ? 0 : pageMs,
    );
    return () => clearTimeout(timer);
  }, [page, pages.length, pageMs]);

  return (
    <ul className={styles.page} aria-label={title}>
      {(pages[page] ?? []).map((member) =>
        failed.has(member.id) ? null : (
          <li key={member.id} className={styles.item}>
            <img
              className={styles.logo}
              src={member.logo}
              alt={member.name}
              onError={() => {
                console.warn(`Logo no cargó: ${member.id} (${member.logo})`);
                setFailed((prev) => new Set(prev).add(member.id));
              }}
            />
          </li>
        ),
      )}
    </ul>
  );
}
