import { useState, useEffect, useRef } from 'react';
import { useBlackjackGame } from './hooks/useBlackjackGame';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useAuth } from './hooks/useAuth';
import { useGameSession } from './hooks/useGameSession';
import { GameTable } from './components/GameTable';
import { Leaderboard } from './components/Leaderboard';
import { AuthModal } from './components/AuthModal';
import './App.css';

const FACE_CARD_IMAGE_URLS = {
  J: '/face-cards/jack.png',
  Q: '/face-cards/queen.png',
  K: '/face-cards/king.png',
};

export default function App() {
  const game = useBlackjackGame();
  const auth = useAuth();
  const lb = useLeaderboard(game.balance, game.buyInCount, game.stats.handsPlayed);
  const session = useGameSession();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Track previous phase to detect transitions
  const prevPhaseRef = useRef(game.phase);

  // Set player name from auth when logged in
  useEffect(() => {
    if (auth.user && !lb.playerName) {
      lb.setPlayerName(auth.user.display_name || auth.user.username);
    }
  }, [auth.user, lb.playerName, lb.setPlayerName]);

  // Start a backend session when the first hand is dealt
  useEffect(() => {
    if (game.phase === 'player' || game.phase === 'insurance') {
      if (prevPhaseRef.current === 'bet' && auth.isAuthenticated && !session.hasActiveSession()) {
        session.startSession(1000, game.numDecks);
      }
    }
    prevPhaseRef.current = game.phase;
  }, [game.phase, auth.isAuthenticated, game.numDecks, session]);

  // Record hand results when a round completes
  useEffect(() => {
    if (game.phase === 'result' && prevPhaseRef.current !== 'result') {
      if (auth.isAuthenticated && session.hasActiveSession()) {
        session.recordHand(game.playerHands, game.dealerHand, game.runningCount);
      }
      // Refresh leaderboard after each round
      lb.refreshLeaderboard();
    }
    if (game.phase === 'result') {
      prevPhaseRef.current = 'result';
    }
  }, [game.phase, auth.isAuthenticated, game.playerHands, game.dealerHand, game.runningCount, session, lb]);

  // End session when starting new shoe
  const handleStartNewShoe = () => {
    if (auth.isAuthenticated && session.hasActiveSession()) {
      session.endSession(game.balance);
    }
    game.startNewShoe();
  };

  // End session on logout
  const handleLogout = () => {
    if (session.hasActiveSession()) {
      session.endSession(game.balance);
    }
    auth.logout();
    lb.refreshLeaderboard();
  };

  const handleOpenAuth = () => {
    setAuthOpen(true);
    auth.clearError();
  };

  return (
    <main className="app">
      <GameTable
        phase={game.phase}
        balance={game.balance}
        currentBet={game.currentBet}
        minBet={game.minBet}
        maxBet={game.maxBet}
        numDecks={game.numDecks}
        minDecks={game.minDecks}
        maxDecks={game.maxDecks}
        setNumDecks={game.setNumDecks}
        playerHands={game.playerHands}
        dealerHand={game.dealerHand}
        currentHandIndex={game.currentHandIndex}
        runningCount={game.runningCount}
        trueCount={game.trueCount}
        decksRemaining={game.decksRemaining}
        stats={game.stats}
        setBet={game.setBet}
        addChip={game.addChip}
        clearBet={game.clearBet}
        chipDenominations={game.chipDenominations}
        deal={game.deal}
        hit={game.hit}
        stand={game.stand}
        double={game.double}
        split={game.split}
        runDealerAndSettle={game.runDealerAndSettle}
        acceptInsurance={game.acceptInsurance}
        declineInsurance={game.declineInsurance}
        buyIn={game.buyIn}
        buyInCount={game.buyInCount}
        lifetimeEarnings={lb.lifetimeEarnings}
        playerName={auth.user?.display_name || auth.user?.username || lb.playerName}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenAuth={handleOpenAuth}
        isAuthenticated={auth.isAuthenticated}
        newRound={game.newRound}
        startNewShoe={handleStartNewShoe}
        clearShuffleMessage={game.clearShuffleMessage}
        shoeStarted={game.shoeStarted}
        showShuffleMessage={game.showShuffleMessage}
        lastRoundProfit={game.lastRoundProfit}
        resetStats={game.resetStats}
        canDouble={game.canDouble}
        canSplit={game.canSplit}
        faceCardImageUrls={FACE_CARD_IMAGE_URLS}
      />

      <Leaderboard
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        entries={lb.entries}
        currentName={lb.playerName}
        onNameChange={lb.setPlayerName}
        isOnline={lb.isOnline}
        isAuthenticated={auth.isAuthenticated}
        displayName={auth.user?.display_name || auth.user?.username || lb.playerName}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={auth.login}
        onRegister={auth.register}
        error={auth.error}
        loading={auth.loading}
      />
    </main>
  );
}
