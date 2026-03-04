import { useRef, useCallback } from 'react';
import {
  apiCreateSession,
  apiEndSession,
  apiRecordHand,
  hasTokens,
} from '../api/client';
import type { Card as CardType, Hand } from '../types';
import { cardDisplayName } from '../utils/cards';
import { handValue } from '../utils/blackjack';

/**
 * Tracks the current game session on the backend.
 * Only active when the user is authenticated. Silently no-ops otherwise.
 */
export function useGameSession() {
  const sessionIdRef = useRef<number | null>(null);
  const handCountRef = useRef(0);

  /** Start a new session on the backend. */
  const startSession = useCallback(async (startingBalance: number, numDecks: number) => {
    if (!hasTokens()) return;
    try {
      const { id } = await apiCreateSession(startingBalance, numDecks);
      sessionIdRef.current = id;
      handCountRef.current = 0;
    } catch (err) {
      console.warn('Failed to create game session:', err);
      sessionIdRef.current = null;
    }
  }, []);

  /** Record a completed hand. */
  const recordHand = useCallback(async (
    playerHands: Hand[],
    dealerHand: CardType[],
    runningCount: number,
  ) => {
    if (!hasTokens() || sessionIdRef.current === null) return;
    const sessionId = sessionIdRef.current;

    for (const hand of playerHands) {
      handCountRef.current++;
      const playerCards = hand.cards.map(cardDisplayName);
      const dealerCards = dealerHand.map(cardDisplayName);

      let outcome: string;
      let payout = 0;

      if (hand.blackjack) {
        outcome = 'blackjack';
        payout = Math.floor(hand.bet * 2.5);
      } else if (hand.bust) {
        outcome = 'loss';
        payout = 0;
      } else {
        const playerVal = handValue(hand.cards);
        const dealerVal = handValue(dealerHand);
        const dealerBust = dealerVal > 21;

        if (dealerBust || playerVal > dealerVal) {
          outcome = 'win';
          payout = hand.bet * 2;
        } else if (playerVal < dealerVal) {
          outcome = 'loss';
          payout = 0;
        } else {
          outcome = 'push';
          payout = hand.bet;
        }
      }

      try {
        await apiRecordHand(sessionId, {
          hand_number: handCountRef.current,
          player_cards: playerCards,
          dealer_cards: dealerCards,
          bet: hand.bet,
          payout,
          outcome,
          running_count: runningCount,
        });
      } catch (err) {
        console.warn('Failed to record hand:', err);
      }
    }
  }, []);

  /** End the current session. */
  const endSession = useCallback(async (finalBalance: number) => {
    if (!hasTokens() || sessionIdRef.current === null) return;
    try {
      await apiEndSession(sessionIdRef.current, finalBalance, handCountRef.current);
    } catch (err) {
      console.warn('Failed to end game session:', err);
    } finally {
      sessionIdRef.current = null;
      handCountRef.current = 0;
    }
  }, []);

  const hasActiveSession = useCallback(() => sessionIdRef.current !== null, []);

  return {
    startSession,
    recordHand,
    endSession,
    hasActiveSession,
  };
}
