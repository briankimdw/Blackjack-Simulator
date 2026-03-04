import { useState } from 'react';
import styles from './Leaderboard.module.css';
import type { SortedEntry } from '../hooks/useLeaderboard';

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
  entries: SortedEntry[];
  currentName: string;
  onNameChange: (name: string) => void;
  isOnline: boolean;
  isAuthenticated: boolean;
  displayName: string;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Leaderboard({
  open,
  onClose,
  entries,
  currentName,
  onNameChange,
  isOnline,
  isAuthenticated,
  displayName,
  onOpenAuth,
  onLogout,
}: LeaderboardProps) {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline && (
              <span
                style={{
                  fontSize: '0.6rem',
                  color: '#4ade80',
                  background: 'rgba(74,222,128,0.1)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: '1px solid rgba(74,222,128,0.2)',
                }}
              >
                ● LIVE
              </span>
            )}
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        {/* Auth status bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            marginBottom: '12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px',
            fontSize: '0.8rem',
          }}
        >
          {isAuthenticated ? (
            <>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                Signed in as <strong style={{ color: '#ffd54f' }}>{displayName}</strong>
              </span>
              <button
                type="button"
                onClick={onLogout}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: 'rgba(255,255,255,0.6)',
                  padding: '3px 10px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                Sign in to compete globally
              </span>
              <button
                type="button"
                onClick={onOpenAuth}
                style={{
                  background: 'linear-gradient(180deg, #c9a227, #a8841e)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#1a1a1a',
                  padding: '4px 12px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Local name section (for local leaderboard when not authenticated) */}
        {!isAuthenticated && (
          <div className={styles.nameSection}>
            <span className={styles.nameLabel}>Your Local Name</span>
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
        )}

        {/* Rankings */}
        {entries.length === 0 ? (
          <div className={styles.empty}>
            {isOnline
              ? 'No players on the leaderboard yet. Play some hands to get started!'
              : 'No players yet. Set your name and start playing!'}
          </div>
        ) : (
          <div className={styles.table}>
            <div className={`${styles.row} ${styles.rowHeader}`}>
              <span className={styles.colRank}>#</span>
              <span className={styles.colName}>Player</span>
              <span className={styles.colEarnings}>Earnings</span>
              <span className={styles.colHands}>Hands</span>
            </div>
            {entries.map((entry, i) => {
              const effectiveName = isAuthenticated ? displayName : currentName;
              const isMe = entry.name === effectiveName;
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
            {isOnline
              ? 'Live leaderboard — compete with players globally!'
              : 'Local leaderboard — sign in to compete with friends online.'}
          </p>
        </div>
      </div>
    </div>
  );
}
