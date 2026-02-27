import { useState, useCallback, useEffect } from 'react';
import type { LeaderboardEntry } from '../types';

const STORAGE_KEY_NAME = 'blackjack-playerName';
const STORAGE_KEY_LB = 'blackjack-leaderboard';
const BUY_IN_AMOUNT = 1000;

function loadEntries(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_LB);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: LeaderboardEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY_LB, JSON.stringify(entries));
  } catch {}
}

export function useLeaderboard(balance: number, buyInCount: number, handsPlayed: number) {
  const [playerName, setPlayerNameState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_NAME) || '';
  });

  const [entries, setEntries] = useState<LeaderboardEntry[]>(loadEntries);

  const lifetimeEarnings = balance - (1 + buyInCount) * BUY_IN_AMOUNT;

  const setPlayerName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 20);
    setPlayerNameState(trimmed);
    try {
      localStorage.setItem(STORAGE_KEY_NAME, trimmed);
    } catch {}
  }, []);

  // Update leaderboard entry whenever balance or handsPlayed changes
  useEffect(() => {
    if (!playerName) return;
    setEntries((prev) => {
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
      saveEntries(next);
      return next;
    });
  }, [playerName, balance, handsPlayed, buyInCount]);

  const sorted = [...entries]
    .map((e) => ({
      ...e,
      earnings: e.currentBalance - e.totalInvested,
    }))
    .sort((a, b) => b.earnings - a.earnings);

  return {
    playerName,
    setPlayerName,
    lifetimeEarnings,
    entries: sorted,
  };
}
