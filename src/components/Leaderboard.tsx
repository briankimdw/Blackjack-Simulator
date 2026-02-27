import { useState } from 'react';
import styles from './Leaderboard.module.css';

interface SortedEntry {
  name: string;
  currentBalance: number;
  totalInvested: number;
  handsPlayed: number;
  bestBalance: number;
  lastPlayed: number;
  earnings: number;
}

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
  entries: SortedEntry[];
  currentName: string;
  onNameChange: (name: string) => void;
}

export function Leaderboard({ open, onClose, entries, currentName, onNameChange }: LeaderboardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentName);

  if (!open) return null;

  const handleSave = () => {
    if (draft.trim()) {
      onNameChange(draft.trim());
    }
    setEditing(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🏆 Leaderboard</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Player name */}
        <div className={styles.nameSection}>
          <span className={styles.nameLabel}>Your Name</span>
          {editing ? (
            <div className={styles.nameEdit}>
              <input
                className={styles.nameInput}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={20}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') { setEditing(false); setDraft(currentName); }
                }}
              />
              <button className={styles.nameSaveBtn} onClick={handleSave}>Save</button>
            </div>
          ) : (
            <div className={styles.nameDisplay}>
              <span className={styles.nameValue}>{currentName || 'Not set'}</span>
              <button
                className={styles.nameEditBtn}
                onClick={() => { setDraft(currentName); setEditing(true); }}
              >
                ✎
              </button>
            </div>
          )}
        </div>

        {/* Rankings */}
        {entries.length === 0 ? (
          <div className={styles.empty}>No players yet. Set your name and start playing!</div>
        ) : (
          <div className={styles.table}>
            <div className={`${styles.row} ${styles.rowHeader}`}>
              <span className={styles.colRank}>#</span>
              <span className={styles.colName}>Player</span>
              <span className={styles.colEarnings}>Earnings</span>
              <span className={styles.colHands}>Hands</span>
            </div>
            {entries.map((entry, i) => {
              const isMe = entry.name === currentName;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
              return (
                <div
                  key={entry.name}
                  className={`${styles.row} ${isMe ? styles.rowMe : ''}`}
                >
                  <span className={styles.colRank}>
                    {medal || i + 1}
                  </span>
                  <span className={styles.colName}>
                    {entry.name}
                    {isMe && <span className={styles.youBadge}>YOU</span>}
                  </span>
                  <span className={`${styles.colEarnings} ${entry.earnings >= 0 ? styles.positive : styles.negative}`}>
                    {entry.earnings >= 0 ? '+' : ''}{entry.earnings}
                  </span>
                  <span className={styles.colHands}>{entry.handsPlayed}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.footer}>
          <p className={styles.hint}>
            Share this device with friends to compete! Each player sets a unique name.
          </p>
        </div>
      </div>
    </div>
  );
}
