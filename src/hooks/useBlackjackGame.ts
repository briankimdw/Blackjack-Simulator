import { useCallback, useReducer } from 'react';
import type { Card, Hand, GameStats } from '../types';
import { createDeck, shuffle, hiLoValue } from '../utils/cards';
import {
  handValue,
  isBust,
  isBlackjack,
  dealerShouldHit,
  canDouble,
  canSplit,
} from '../utils/blackjack';
import { INITIAL_STATS } from '../types';

const DEFAULT_DECKS = 6;
const MIN_DECKS = 1;
const MAX_DECKS = 8;
const INITIAL_BALANCE = 1000;
const MIN_BET = 1;
const MAX_BET = 500;
const CARDS_PER_DECK = 52;

type GameState = {
  balance: number;
  deck: Card[];
  numDecks: number;
  cutCardAt: number;
  playerHands: Hand[];
  dealerHand: Card[];
  phase: 'bet' | 'deal' | 'player' | 'dealer' | 'result';
  currentHandIndex: number;
  currentBet: number;
  runningCount: number;
  stats: GameStats;
  shoeStarted: boolean;
  showShuffleMessage: boolean;
  /** Net profit from the last completed round (positive = win, negative = loss, 0 = push). */
  lastRoundProfit: number;
};

/** Cut card at 50–75% through the deck (shuffle when this many cards remain). */
function getCutCardPosition(deckLength: number): number {
  return Math.floor(deckLength * (0.25 + Math.random() * 0.25));
}

function createNewShoe(numDecks: number): { deck: Card[]; cutCardAt: number } {
  const deck = shuffle(createDeck(numDecks));
  const cutCardAt = getCutCardPosition(deck.length);
  return { deck, cutCardAt };
}

const CHIP_DENOMINATIONS = [1, 5, 10, 25, 100] as const;

const initialShoe = createNewShoe(DEFAULT_DECKS);
const initialGameState: GameState = {
  balance: INITIAL_BALANCE,
  deck: initialShoe.deck,
  numDecks: DEFAULT_DECKS,
  cutCardAt: initialShoe.cutCardAt,
  playerHands: [],
  dealerHand: [],
  phase: 'bet',
  currentHandIndex: 0,
  currentBet: 0,
  runningCount: 0,
  stats: loadStats(),
  shoeStarted: false,
  showShuffleMessage: false,
  lastRoundProfit: 0,
};

function loadStats(): GameStats {
  try {
    const s = localStorage.getItem('blackjack-stats');
    if (s) return { ...INITIAL_STATS, ...JSON.parse(s) };
  } catch (_) {}
  return { ...INITIAL_STATS };
}

function saveStats(stats: GameStats) {
  try {
    localStorage.setItem('blackjack-stats', JSON.stringify(stats));
  } catch (_) {}
}

function draw(state: GameState, n: number): { cards: Card[]; newState: GameState; didShuffle: boolean } {
  const cards: Card[] = [];
  let deck = [...state.deck];
  let runningCount = state.runningCount;
  let didShuffle = false;

  for (let i = 0; i < n && deck.length > 0; i++) {
    const card = deck.shift()!;
    cards.push(card);
    runningCount += hiLoValue(card.rank);
  }

  // Reshuffle when we hit the cut card (50–75% through the deck)
  if (deck.length <= state.cutCardAt) {
    const newShoe = createNewShoe(state.numDecks);
    deck = newShoe.deck;
    runningCount = 0;
    didShuffle = true;
    state = { ...state, cutCardAt: newShoe.cutCardAt };
  }

  return {
    cards,
    newState: { ...state, deck, runningCount, showShuffleMessage: didShuffle || state.showShuffleMessage },
    didShuffle,
  };
}

type Action =
  | { type: 'SET_BET'; payload: number }
  | { type: 'ADD_CHIP'; payload: number }
  | { type: 'CLEAR_BET' }
  | { type: 'SET_NUM_DECKS'; payload: number }
  | { type: 'DEAL' }
  | { type: 'HIT' }
  | { type: 'STAND' }
  | { type: 'DOUBLE' }
  | { type: 'SPLIT' }
  | { type: 'DEALER_PLAY' }
  | { type: 'NEW_ROUND' }
  | { type: 'START_NEW_SHOE' }
  | { type: 'CLEAR_SHUFFLE_MESSAGE' }
  | { type: 'RESET_STATS' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_BET': {
      const bet = Math.max(0, Math.min(MAX_BET, Math.floor(action.payload)));
      return { ...state, currentBet: bet };
    }

    case 'ADD_CHIP': {
      if (state.phase !== 'bet' && state.phase !== 'result') return state;
      const add = Math.floor(action.payload);
      if (add <= 0) return state;
      const amountToAdd = Math.min(add, state.balance, MAX_BET - state.currentBet);
      if (amountToAdd <= 0) return state;
      return {
        ...state,
        balance: state.balance - amountToAdd,
        currentBet: state.currentBet + amountToAdd,
      };
    }

    case 'CLEAR_BET': {
      if (state.phase !== 'bet' && state.phase !== 'result') return state;
      return {
        ...state,
        balance: state.balance + state.currentBet,
        currentBet: 0,
      };
    }

    case 'SET_NUM_DECKS': {
      const numDecks = Math.max(MIN_DECKS, Math.min(MAX_DECKS, Math.floor(action.payload)));
      if (state.phase !== 'bet' || state.shoeStarted) return state;
      const newShoe = createNewShoe(numDecks);
      return {
        ...state,
        numDecks,
        deck: newShoe.deck,
        cutCardAt: newShoe.cutCardAt,
        runningCount: 0,
      };
    }

    case 'DEAL': {
      if (state.phase !== 'bet' || state.currentBet < MIN_BET) return state;
      let s: GameState = { ...state };
      let result = draw(s, 2);
      const playerCards = result.cards;
      s = result.newState;
      result = draw(s, 2);
      const dealerCards = result.cards;
      s = result.newState;
      const hand: Hand = {
        cards: playerCards,
        bet: state.currentBet,
      };
      if (isBlackjack(playerCards)) {
        hand.blackjack = true;
        hand.stood = true;
      }
      const dealtState: GameState = {
        ...s,
        playerHands: [hand],
        dealerHand: dealerCards,
        currentHandIndex: 0,
        shoeStarted: true,
      };
      // Dealer has blackjack (e.g. K up, A hole): settle immediately, no player action
      if (isBlackjack(dealerCards)) {
        return runSettlement(dealtState);
      }
      return {
        ...dealtState,
        phase: isBlackjack(playerCards) ? 'dealer' : 'player',
        lastRoundProfit: 0,
      };
    }

    case 'HIT': {
      if (state.phase !== 'player') return state;
      const currentHand = state.playerHands[state.currentHandIndex];
      if (currentHand.stood || currentHand.bust || currentHand.splitAces) return state;
      const result = draw(state, 1);
      const newCards = [...currentHand.cards, result.cards[0]];
      const bust = isBust(newCards);
      const is21 = handValue(newCards) === 21;
      const autoStand = bust || is21;
      const updatedHands = result.newState.playerHands.map((h, i) =>
        i === state.currentHandIndex
          ? { ...h, cards: newCards, bust, stood: autoStand }
          : h
      );
      let phase: GameState['phase'] = 'player';
      let currentHandIndex = state.currentHandIndex;
      if (autoStand) {
        const next = findNextActiveHand(updatedHands, state.currentHandIndex);
        if (next === -1) phase = 'dealer';
        else currentHandIndex = next;
      }
      return {
        ...result.newState,
        playerHands: updatedHands,
        phase,
        currentHandIndex,
      };
    }

    case 'STAND': {
      if (state.phase !== 'player') return state;
      const hands = state.playerHands.map((h, i) =>
        i === state.currentHandIndex ? { ...h, stood: true } : h
      );
      const next = findNextActiveHand(hands, state.currentHandIndex);
      if (next === -1) return { ...state, playerHands: hands, phase: 'dealer', currentHandIndex: 0 };
      return { ...state, playerHands: hands, currentHandIndex: next };
    }

    case 'DOUBLE': {
      if (state.phase !== 'player') return state;
      const hand = state.playerHands[state.currentHandIndex];
      if (!canDouble(hand) || state.balance < hand.bet) return state;
      let s: GameState = { ...state, balance: state.balance - hand.bet };
      const result = draw(s, 1);
      const newCards = [...hand.cards, result.cards[0]];
      const bust = isBust(newCards);
      s = result.newState;
      const updatedHands = s.playerHands.map((h, i) =>
        i === state.currentHandIndex
          ? { ...h, cards: newCards, bet: hand.bet * 2, doubled: true, stood: true, bust }
          : h
      );
      const next = findNextActiveHand(updatedHands, state.currentHandIndex);
      return {
        ...s,
        balance: s.balance,
        playerHands: updatedHands,
        phase: next === -1 ? 'dealer' : 'player',
        currentHandIndex: next === -1 ? 0 : next,
      };
    }

    case 'SPLIT': {
      if (state.phase !== 'player') return state;
      const hand = state.playerHands[state.currentHandIndex];
      if (!canSplit(hand) || state.balance < hand.bet) return state;
      const isAcesSplit = hand.cards[0].rank === 'A' && hand.cards[1].rank === 'A';
      let s: GameState = { ...state, balance: state.balance - hand.bet };
      const result = draw(s, 2);
      s = result.newState;
      const [c1, c2] = result.cards;
      const newHands = [...state.playerHands];
      const hand1: Hand = {
        ...hand,
        cards: [hand.cards[0], c1],
        bet: hand.bet,
        ...(isAcesSplit && { splitAces: true, stood: true }),
      };
      const hand2: Hand = {
        ...hand,
        cards: [hand.cards[1], c2],
        bet: hand.bet,
        ...(isAcesSplit && { splitAces: true, stood: true }),
      };
      newHands[state.currentHandIndex] = hand1;
      newHands.splice(state.currentHandIndex + 1, 0, hand2);
      if (isAcesSplit) {
        return { ...s, playerHands: newHands, phase: 'dealer', currentHandIndex: 0 };
      }
      return { ...s, playerHands: newHands };
    }

    case 'DEALER_PLAY': {
      if (state.phase !== 'dealer') return state;
      // If every hand is bust or blackjack, dealer only reveals (no draw) then settle (BJ pays 3:2)
      if (state.playerHands.every((h) => h.bust || h.blackjack)) {
        return runSettlement(state);
      }
      // Dealer draws one card at a time
      if (!dealerShouldHit(state.dealerHand)) {
        return runSettlement(state);
      }
      const result = draw(state, 1);
      const dealerCards = [...state.dealerHand, ...result.cards];
      const nextState = { ...result.newState, dealerHand: dealerCards };
      if (!dealerShouldHit(dealerCards)) {
        return runSettlement(nextState);
      }
      return { ...nextState, phase: 'dealer' };
    }

    case 'NEW_ROUND':
      return {
        ...state,
        balance: state.balance,
        currentBet: state.currentBet,
        stats: state.stats,
        numDecks: state.numDecks,
        deck: state.deck,
        cutCardAt: state.cutCardAt,
        runningCount: state.runningCount,
        playerHands: [],
        dealerHand: [],
        phase: 'bet',
        shoeStarted: state.shoeStarted,
        showShuffleMessage: state.showShuffleMessage,
        lastRoundProfit: 0,
      };

    case 'START_NEW_SHOE': {
      const newShoe = createNewShoe(state.numDecks);
      return {
        ...state,
        deck: newShoe.deck,
        cutCardAt: newShoe.cutCardAt,
        runningCount: 0,
        playerHands: [],
        dealerHand: [],
        phase: 'bet',
        currentBet: 0,
        shoeStarted: false,
        showShuffleMessage: false,
      };
    }

    case 'CLEAR_SHUFFLE_MESSAGE':
      return { ...state, showShuffleMessage: false };

    case 'RESET_STATS':
      saveStats(INITIAL_STATS);
      return { ...state, stats: { ...INITIAL_STATS } };

    default:
      return state;
  }
}

function findNextActiveHand(hands: Hand[], after: number): number {
  for (let i = after + 1; i < hands.length; i++) {
    if (!hands[i].stood && !hands[i].bust) return i;
  }
  for (let i = 0; i < after; i++) {
    if (!hands[i].stood && !hands[i].bust) return i;
  }
  return -1;
}

function runSettlement(state: GameState): GameState {
  const dealerVal = handValue(state.dealerHand);
  const dealerBust = dealerVal > 21;
  const dealerBJ = isBlackjack(state.dealerHand);
  let balance = state.balance;
  const stats = { ...state.stats };
  stats.handsPlayed += state.playerHands.length;
  stats.countHistory = [...stats.countHistory.slice(-99), state.runningCount];
  stats.maxCount = Math.max(stats.maxCount, state.runningCount);
  stats.minCount = Math.min(stats.minCount, state.runningCount);

  // Track net profit across all hands.
  // Bets were already deducted from balance when chips were placed,
  // so we track payouts vs bets to compute the real profit.
  let totalBets = 0;
  let totalPayouts = 0;

  for (const hand of state.playerHands) {
    totalBets += hand.bet;

    if (hand.blackjack) {
      stats.blackjacks++;
      if (dealerBJ) {
        balance += hand.bet;
        totalPayouts += hand.bet;
        stats.pushes++;
      } else {
        balance += hand.bet * 2.5;
        totalPayouts += hand.bet * 2.5;
        stats.wins++;
        stats.totalProfit += hand.bet * 1.5;
      }
      continue;
    }
    if (hand.bust) {
      stats.losses++;
      stats.totalProfit -= hand.bet;
      continue;
    }
    const playerVal = handValue(hand.cards);
    if (dealerBust) {
      balance += hand.bet * 2;
      totalPayouts += hand.bet * 2;
      stats.wins++;
      stats.totalProfit += hand.bet;
    } else if (dealerBJ) {
      stats.losses++;
      stats.totalProfit -= hand.bet;
    } else if (playerVal > dealerVal) {
      balance += hand.bet * 2;
      totalPayouts += hand.bet * 2;
      stats.wins++;
      stats.totalProfit += hand.bet;
    } else if (playerVal < dealerVal) {
      stats.losses++;
      stats.totalProfit -= hand.bet;
    } else {
      balance += hand.bet;
      totalPayouts += hand.bet;
      stats.pushes++;
    }
  }
  saveStats(stats);
  const lastRoundProfit = totalPayouts - totalBets;
  return { ...state, balance, stats, phase: 'result' as const, currentBet: 0, lastRoundProfit };
}

export function useBlackjackGame() {
  const [state, dispatch] = useReducer(reducer, initialGameState);

  const setBet = useCallback((amount: number) => dispatch({ type: 'SET_BET', payload: amount }), []);
  const addChip = useCallback((amount: number) => dispatch({ type: 'ADD_CHIP', payload: amount }), []);
  const clearBet = useCallback(() => dispatch({ type: 'CLEAR_BET' }), []);
  const deal = useCallback(() => dispatch({ type: 'DEAL' }), []);
  const hit = useCallback(() => dispatch({ type: 'HIT' }), []);
  const stand = useCallback(() => dispatch({ type: 'STAND' }), []);
  const double = useCallback(() => dispatch({ type: 'DOUBLE' }), []);
  const split = useCallback(() => dispatch({ type: 'SPLIT' }), []);
  const resetStats = useCallback(() => dispatch({ type: 'RESET_STATS' }), []);

  const runDealerAndSettle = useCallback(() => {
    if (state.phase === 'dealer') dispatch({ type: 'DEALER_PLAY' });
  }, [state.phase]);

  const newRound = useCallback(() => dispatch({ type: 'NEW_ROUND' }), []);
  const startNewShoe = useCallback(() => dispatch({ type: 'START_NEW_SHOE' }), []);
  const clearShuffleMessage = useCallback(() => dispatch({ type: 'CLEAR_SHUFFLE_MESSAGE' }), []);

  const currentHand = state.playerHands[state.currentHandIndex];
  const decksRemaining = state.deck.length / CARDS_PER_DECK;
  const trueCount = decksRemaining > 0 ? state.runningCount / decksRemaining : 0;

  const setNumDecks = useCallback(
    (n: number) => dispatch({ type: 'SET_NUM_DECKS', payload: n }),
    []
  );

  return {
    ...state,
    currentHand,
    trueCount,
    decksRemaining,
    setNumDecks,
    setBet,
    addChip,
    clearBet,
    deal,
    hit,
    stand,
    double,
    split,
    runDealerAndSettle,
    newRound,
    startNewShoe,
    clearShuffleMessage,
    resetStats,
    canDouble: currentHand ? canDouble(currentHand) : false,
    canSplit: currentHand ? canSplit(currentHand) : false,
    minBet: MIN_BET,
    maxBet: MAX_BET,
    minDecks: MIN_DECKS,
    maxDecks: MAX_DECKS,
    chipDenominations: CHIP_DENOMINATIONS,
  };
}
