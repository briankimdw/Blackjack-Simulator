import { useState, useCallback, useEffect } from 'react';
import type { LeaderboardEntry } from '../types';
import { apiGetLeaderboard, type LeaderboardEntry as ApiLeaderboardEntry, hasTokens } from '../api/client';

const STORAGE_KEY_NAME = 'blackjack-playerName';
const STORAGE_KEY_LB = 'blackjack-leaderboard';
const BUY_IN_AMOUNT = 1000;

function loadLocalEntries(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_LB);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalEntries(entries: LeaderboardEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY_LB, JSON.stringify(entries));
  } catch {}
}

export interface SortedEntry extends LeaderboardEntry {
  earnings: number;
}

export function useLeaderboard(balance: number, buyInCount: number, handsPlayed: number) {
  const [playerName, setPlayerNameState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_NAME) || '';
  });

  const [localEntries, setLocalEntries] = useState<LeaderboardEntry[]>(loadLocalEntries);
  const [apiEntries, setApiEntries] = useState<ApiLeaderboardEntry[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  const lifetimeEarnings = balance - (1 + buyInCount) * BUY_IN_AMOUNT;

  const setPlayerName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 20);
    setPlayerNameState(trimmed);
    try {
      localStorage.setItem(STORAGE_KEY_NAME, trimmed);
    } catch {}
  }, []);

  // Update local leaderboard entry whenever balance or handsPlayed changes
  useEffect(() => {
    if (!playerName) return;
    setLocalEntries((prev) => {
      const next = [...prev];
      const idx = next.findIndex((e) => e.name === playerName);
      const totalInvested = (1 + buyInCount) * BUY_IN_AMOUNT;
      const entry: LeaderboardEntry = {
        name: playerName,
        totalInvested,
        currentBalance: balance,
        handsPlayed,
        bestBalance: balance,
        lastPlayed: Date.now(),
      };
      if (idx >= 0) {
        entry.bestBalance = Math.max(next[idx].bestBalance, balance);
        next[idx] = entry;
      } else {
        next.push(entry);
      }
      saveLocalEntries(next);
      return next;
    });
  }, [playerName, balance, handsPlayed, buyInCount]);

  // Fetch backend leaderboard when authenticated
  const fetchApiLeaderboard = useCallback(async () => {
    if (!hasTokens()) {
      setIsOnline(false);
      return;
    }
    try {
      const data = await apiGetLeaderboard();
      setApiEntries(data);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  // Fetch on mount and periodically
  useEffect(() => {
    fetchApiLeaderboard();
    const interval = setInterval(fetchApiLeaderboard, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchApiLeaderboard]);

  // Merge local + API entries for display
  const sorted: SortedEntry[] = (() => {
    if (isOnline && apiEntries.length > 0) {
      // Use API leaderboard as primary source
      return apiEntries.map((e) => ({
        name: e.display_name || e.username,
        totalInvested: 0,
        currentBalance: e.total_profit,
        handsPlayed: e.total_hands,
        bestBalance: e.total_profit,
        lastPlayed: Date.now(),
        earnings: e.total_profit,
      }));
    }
    // Fallback to local leaderboard
    return [...localEntries]
      .map((e) => ({
        ...e,
        earnings: e.currentBalance - e.totalInvested,
      }))
      .sort((a, b) => b.earnings - a.earnings);
  })();

  return {
    playerName,
    setPlayerName,
    lifetimeEarnings,
    entries: sorted,
    isOnline,
    refreshLeaderboard: fetchApiLeaderboard,
  };
}
