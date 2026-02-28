import type { Card, Rank, Suit } from '../types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/** Hi-Lo card counting value: 2-6 => +1, 7-9 => 0, 10/J/Q/K/A => -1 */
export function hiLoValue(rank: Rank): number {
  if (rank === '2' || rank === '3' || rank === '4' || rank === '5' || rank === '6') return 1;
  if (rank === '7' || rank === '8' || rank === '9') return 0;
  return -1; // 10, J, Q, K, A
}

/**
 * Builds a shoe of one or more 52-card decks. Every card is created from
 * SUITS × RANKS (4×13 = 52 per deck); 
 * No duplicates cna form this way since we only draw from this array of unique cards.
 * Default is 6 decks.
 */
export function createDeck(decks: number = 6): Card[] {
  const cards: Card[] = [];
  let id = 0;
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ suit, rank, id: `card-${id++}` });
      }
    }
  }
  return cards;
}

/** Fisher Yates shuffle algorithm shuffles a finite sequence in a radndom order 
 * The algorithm ensures that each possible permutation of the sequence is equally likely to occur, 
 */
export function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function cardDisplayName(card: Card): string {
  const suitSymbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  return `${card.rank}${suitSymbols[card.suit]}`;
}

/** Helper function to check if a suit is red (hearts or diamonds) to ensure color is correct in UI*/
export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export type PipPos = { top: number; left: number; flip?: boolean };

/**
 * Pip positions as percentage offsets [top%, left%] within the card.
 * Matches standard playing card layouts. Pips below center are flipped 180°.
 * Left column ~28%, center ~50%, right column ~72%.
 */
export const PIP_LAYOUTS: Record<string, PipPos[]> = {
  '2': [
    { top: 28, left: 50 },
    { top: 72, left: 50, flip: true },
  ],
  '3': [
    { top: 25, left: 50 },
    { top: 50, left: 50 },
    { top: 75, left: 50, flip: true },
  ],
  '4': [
    { top: 28, left: 35 },
    { top: 28, left: 65 },
    { top: 72, left: 35, flip: true },
    { top: 72, left: 65, flip: true },
  ],
  '5': [
    { top: 28, left: 35 },
    { top: 28, left: 65 },
    { top: 50, left: 50 },
    { top: 72, left: 35, flip: true },
    { top: 72, left: 65, flip: true },
  ],
  '6': [
    { top: 25, left: 35 },
    { top: 50, left: 35 },
    { top: 75, left: 35, flip: true },
    { top: 25, left: 65 },
    { top: 50, left: 65 },
    { top: 75, left: 65, flip: true },
  ],
  '7': [
    { top: 25, left: 35 },
    { top: 50, left: 35 },
    { top: 75, left: 35, flip: true },
    { top: 37, left: 50 },
    { top: 25, left: 65 },
    { top: 50, left: 65 },
    { top: 75, left: 65, flip: true },
  ],
  '8': [
    { top: 25, left: 35 },
    { top: 50, left: 35 },
    { top: 75, left: 35, flip: true },
    { top: 37, left: 50 },
    { top: 63, left: 50, flip: true },
    { top: 25, left: 65 },
    { top: 50, left: 65 },
    { top: 75, left: 65, flip: true },
  ],
  '9': [
    { top: 22, left: 35 },
    { top: 39, left: 35 },
    { top: 61, left: 35, flip: true },
    { top: 78, left: 35, flip: true },
    { top: 50, left: 50 },
    { top: 22, left: 65 },
    { top: 39, left: 65 },
    { top: 61, left: 65, flip: true },
    { top: 78, left: 65, flip: true },
  ],
  '10': [
    { top: 22, left: 35 },
    { top: 39, left: 35 },
    { top: 61, left: 35, flip: true },
    { top: 78, left: 35, flip: true },
    { top: 30, left: 50 },
    { top: 70, left: 50, flip: true },
    { top: 22, left: 65 },
    { top: 39, left: 65 },
    { top: 61, left: 65, flip: true },
    { top: 78, left: 65, flip: true },
  ],
};
