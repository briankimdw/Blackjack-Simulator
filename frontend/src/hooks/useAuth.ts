import { useState, useCallback, useEffect } from 'react';
import {
  apiLogin,
  apiRegister,
  apiGetMe,
  clearTokens,
  hasTokens,
  type UserInfo,
} from '../api/client';

export interface AuthState {
  user: UserInfo | null;
  loading: boolean;
  error: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // On mount, check if we have saved tokens and fetch current user
  useEffect(() => {
    if (!hasTokens()) {
      setLoading(false);
      return;
    }
    apiGetMe()
      .then(setUser)
      .catch(() => {
        clearTokens();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError('');
    setLoading(true);
    try {
      await apiLogin(username, password);
      const me = await apiGetMe();
      setUser(me);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      // Try to parse the body for a nicer message
      if (msg.includes('401')) {
        setError('Invalid username or password');
      } else {
        setError(msg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    setError('');
    setLoading(true);
    try {
      await apiRegister(username, password, displayName);
      // Auto-login after register
      await apiLogin(username, password);
      const me = await apiGetMe();
      setUser(me);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('400')) {
        setError('Username already taken or invalid data');
      } else {
        setError(msg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setError('');
  }, []);

  const clearError = useCallback(() => setError(''), []);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };
}
