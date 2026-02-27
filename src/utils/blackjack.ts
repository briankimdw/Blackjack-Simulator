/** Basic Blackjack logic  */

import type { Card, Hand } from '../types';
import type { Rank } from '../types';

export function cardNumericValue(rank: Card['rank']): number | 'A' {
  if (rank === 'A') return 'A';
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank, 10);
}

/** Best hand value (Ace = 1 or 11). Returns 22 if bust. */
export function handValue(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    const v = cardNumericValue(c.rank);
    if (v === 'A') aces++;
    else total += v;
  }
  total += aces; // count all aces as 1 first
  while (aces > 0 && total + 10 <= 21) {
    total += 10;
    aces--;
  }
  return total;
}

/** Low total (all aces as 1). */
function handValueLow(cards: Card[]): number {
  let total = 0;
  for (const c of cards) {
    const v = cardNumericValue(c.rank);
    if (v === 'A') total += 1;
    else total += v;
  }
  return total;
}

/** Display string for hand value: "4/14" for soft, "16" for hard, "22 (Bust)" for bust. */
export function handDisplayValue(cards: Card[]): string {
  if (cards.length === 0) return '';
  const low = handValueLow(cards);
  const hasAce = cards.some((c) => c.rank === 'A');
  const high = hasAce && low + 10 <= 21 ? low + 10 : low;
  if (low > 21) return `${low} (Bust)`;
  if (hasAce && low !== high) return `${low}/${high}`;
  return String(high);
}

export function isBust(cards: Card[]): boolean {
  return handValue(cards) > 21;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

export function isSoft17(cards: Card[]): boolean {
  const v = handValue(cards);
  if (v !== 17) return false;
  return cards.some(c => c.rank === 'A');
}

/** Dealer stands on all 17s (S17 rule). */
export function dealerShouldHit(cards: Card[]): boolean {
  const v = handValue(cards);
  if (v >= 17) return false;
  return true;
}

/** Can only double on first 2 cards and not be able to hit after. No double after split aces. */
export function canDouble(hand: Hand): boolean {
  return hand.cards.length === 2 && !hand.doubled && !hand.stood && !hand.bust && !hand.splitAces;
}

/** Split value: 10/J/Q/K all count as 10, so any two of them can split. */
function splitValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank, 10);
}

export function canSplit(hand: Hand): boolean {
  if (hand.cards.length !== 2 || hand.splitAces) return false;
  return splitValue(hand.cards[0].rank) === splitValue(hand.cards[1].rank);
}
