/**
 * Thin API client with JWT token management.
 * All requests go through the Vite proxy (/api → http://localhost:8000/api).
 */

const TOKEN_KEY = 'blackjack-access-token';
const REFRESH_KEY = 'blackjack-refresh-token';

function getAccessToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function hasTokens(): boolean {
  return !!getAccessToken();
}

/** Try refreshing the access token using the refresh token. */
async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch('/api/auth/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.access);
    if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Authenticated fetch wrapper.
 * Automatically adds Authorization header and retries once on 401 (token refresh).
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(path, { ...options, headers });

  // If 401, try to refresh and retry once
  if (res.status === 401 && getRefreshToken()) {
    token = await refreshAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      res = await fetch(path, { ...options, headers });
    }
  }

  return res;
}

/** Convenience for JSON responses. */
export async function apiJson<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`API error ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

// ── Auth endpoints ──────────────────────────────────────────────

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
  date_joined: string;
}

export async function apiLogin(username: string, password: string): Promise<AuthTokens> {
  const res = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body);
  }
  const tokens: AuthTokens = await res.json();
  setTokens(tokens.access, tokens.refresh);
  return tokens;
}

export async function apiRegister(
  username: string,
  password: string,
  displayName?: string,
): Promise<{ id: number; username: string }> {
  const res = await fetch('/api/auth/register/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      display_name: displayName || username,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body);
  }
  return res.json();
}

export async function apiGetMe(): Promise<UserInfo> {
  return apiJson<UserInfo>('/api/auth/me/');
}

export async function apiUpdateMe(data: Partial<Pick<UserInfo, 'display_name' | 'email'>>): Promise<UserInfo> {
  return apiJson<UserInfo>('/api/auth/me/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Game endpoints ──────────────────────────────────────────────

export interface GameSession {
  id: number;
  username: string;
  started_at: string;
  ended_at: string | null;
  starting_balance: number;
  final_balance: number | null;
  hands_played: number;
  num_decks: number;
  is_complete: boolean;
  profit: number;
}

export interface HandResult {
  id: number;
  hand_number: number;
  player_cards: string[];
  dealer_cards: string[];
  bet: number;
  payout: number;
  outcome: 'win' | 'loss' | 'push' | 'blackjack';
  running_count: number;
}

export async function apiCreateSession(
  startingBalance: number,
  numDecks: number,
): Promise<{ id: number }> {
  return apiJson('/api/game/sessions/', {
    method: 'POST',
    body: JSON.stringify({ starting_balance: startingBalance, num_decks: numDecks }),
  });
}

export async function apiEndSession(
  sessionId: number,
  finalBalance: number,
  handsPlayed: number,
): Promise<GameSession> {
  return apiJson(`/api/game/sessions/${sessionId}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      final_balance: finalBalance,
      hands_played: handsPlayed,
      is_complete: true,
      ended_at: new Date().toISOString(),
    }),
  });
}

export async function apiRecordHand(
  sessionId: number,
  data: {
    hand_number: number;
    player_cards: string[];
    dealer_cards: string[];
    bet: number;
    payout: number;
    outcome: string;
    running_count: number;
  },
): Promise<HandResult> {
  return apiJson(`/api/game/sessions/${sessionId}/hands/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiGetMyStats(): Promise<{
  total_hands: number;
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  win_rate: number;
  total_profit: number;
  sessions_played: number;
}> {
  return apiJson('/api/game/stats/me/');
}

export interface LeaderboardEntry {
  username: string;
  display_name: string;
  total_profit: number;
  total_hands: number;
  sessions_played: number;
  win_rate: number;
}

export async function apiGetLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiJson('/api/game/leaderboard/');
}
