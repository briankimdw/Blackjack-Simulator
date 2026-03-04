import { useState } from 'react';
import styles from './AuthModal.module.css';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string, displayName?: string) => Promise<void>;
  error: string;
  loading: boolean;
}

export function AuthModal({ open, onClose, onLogin, onRegister, error, loading }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!username.trim()) { setLocalError('Username is required'); return; }
    if (!password.trim()) { setLocalError('Password is required'); return; }
    if (password.length < 8) { setLocalError('Password must be at least 8 characters'); return; }

    try {
      if (mode === 'login') {
        await onLogin(username.trim(), password);
      } else {
        await onRegister(username.trim(), password, displayName.trim() || undefined);
      }
      // Success — clear form and close
      setUsername('');
      setPassword('');
      setDisplayName('');
      onClose();
    } catch {
      // Error is handled by the parent hook
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setLocalError('');
  };

  const displayError = localError || error;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{mode === 'login' ? '🔑 Sign In' : '📝 Create Account'}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className={styles.subtitle}>
          {mode === 'login'
            ? 'Sign in to save your stats and compete on the leaderboard.'
            : 'Create an account to track your progress and compete with friends.'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="auth-display">Display Name</label>
              <input
                id="auth-display"
                className={styles.input}
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others see you (optional)"
                disabled={loading}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Min 8 characters' : 'Enter password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
            />
          </div>

          {displayError && <div className={styles.error}>{displayError}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className={styles.switchRow}>
          <span className={styles.switchText}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button type="button" className={styles.switchBtn} onClick={switchMode} disabled={loading}>
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
