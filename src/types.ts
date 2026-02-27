export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type GamePhase = 'bet' | 'deal' | 'player' | 'dealer' | 'result';

export interface Hand {
  cards: Card[];
  bet: number;
  doubled?: boolean;
  stood?: boolean;
  bust?: boolean;
  blackjack?: boolean;
  /** True when this hand came from splitting aces (one card only, no hit/stand). */
  splitAces?: boolean;
}

export interface GameStats {
  handsPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  totalProfit: number;
  maxCount: number;
  minCount: number;
  countHistory: number[];
}

export const INITIAL_STATS: GameStats = {
  handsPlayed: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  blackjacks: 0,
  totalProfit: 0,
  maxCount: 0,
  minCount: 0,
  countHistory: [],
};
