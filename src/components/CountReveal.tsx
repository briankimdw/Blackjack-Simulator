import { useState } from 'react';
import styles from './CountReveal.module.css';

interface CountRevealProps {
  runningCount: number;
  trueCount: number;
  decksRemaining: number;
}

export function CountReveal({ runningCount, trueCount, decksRemaining }: CountRevealProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Hover to check your count (Hi-Lo)"
    >
      <span className={styles.trigger}>?</span>
      {hover && (
        <div className={styles.tooltip}>
          <div className={styles.title}>Hi-Lo count</div>
          <div className={styles.row}>
            <span>Running count</span>
            <strong>{runningCount > 0 ? `+${runningCount}` : runningCount}</strong>
          </div>
          <div className={styles.row}>
            <span>True count</span>
            <strong>{trueCount > 0 ? `+${trueCount.toFixed(1)}` : trueCount.toFixed(1)}</strong>
          </div>
          <div className={styles.row}>
            <span>Decks left</span>
            <strong>{decksRemaining.toFixed(1)}</strong>
          </div>
          <div className={styles.hint}>2–6: +1 · 7–9: 0 · 10–A: −1</div>
        </div>
      )}
    </div>
  );
}
