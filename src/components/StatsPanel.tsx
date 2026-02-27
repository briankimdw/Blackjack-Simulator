import type { GameStats } from '../types';
import styles from './StatsPanel.module.css';

interface StatsPanelProps {
  stats: GameStats;
  onReset: () => void;
  open: boolean;
  onClose: () => void;
}

export function StatsPanel({ stats, onReset, open, onClose }: StatsPanelProps) {
  if (!open) return null;

  const winRate =
    stats.handsPlayed > 0
      ? ((stats.wins / stats.handsPlayed) * 100).toFixed(1)
      : '—';
  const pushRate =
    stats.handsPlayed > 0
      ? ((stats.pushes / stats.handsPlayed) * 100).toFixed(1)
      : '—';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Statistics</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={styles.grid}>
          <div className={styles.item}>
            <span className={styles.label}>Hands played</span>
            <span className={styles.value}>{stats.handsPlayed}</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>Wins</span>
            <span className={styles.value}>{stats.wins}</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>Losses</span>
            <span className={styles.value}>{stats.losses}</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>Pushes</span>
            <span className={styles.value}>{stats.pushes}</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>Blackjacks</span>
            <span className={styles.value}>{stats.blackjacks}</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>Win rate</span>
            <span className={styles.value}>{winRate}%</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>Push rate</span>
            <span className={styles.value}>{pushRate}%</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>Total profit</span>
            <span className={`${styles.value} ${stats.totalProfit >= 0 ? styles.positive : styles.negative}`}>
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit}
            </span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>Max count</span>
            <span className={styles.value}>{stats.maxCount > 0 ? `+${stats.maxCount}` : stats.maxCount}</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>Min count</span>
            <span className={styles.value}>{stats.minCount > 0 ? `+${stats.minCount}` : stats.minCount}</span>
          </div>
        </div>
        {stats.countHistory.length > 0 && (
          <div className={styles.countHistory}>
            <span className={styles.label}>Last counts (running)</span>
            <div className={styles.countBars}>
              {stats.countHistory.slice(-20).map((c, i) => (
                <div
                  key={i}
                  className={styles.countBar}
                  style={{
                    height: `${Math.min(100, Math.max(0, 50 + c * 5))}%`,
                    backgroundColor: c > 0 ? 'rgba(100, 180, 120, 0.8)' : c < 0 ? 'rgba(200, 100, 100, 0.8)' : 'rgba(255,255,255,0.2)',
                  }}
                  title={`Count: ${c}`}
                />
              ))}
            </div>
          </div>
        )}
        <div className={styles.footer}>
          <button type="button" className={styles.resetBtn} onClick={onReset}>
            Reset statistics
          </button>
        </div>
      </div>
    </div>
  );
}
