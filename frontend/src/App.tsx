import { useState } from 'react';
import { useBlackjackGame } from './hooks/useBlackjackGame';
import { useLeaderboard } from './hooks/useLeaderboard';
import { GameTable } from './components/GameTable';
import { Leaderboard } from './components/Leaderboard';
import './App.css';

/** Custom face card images (e.g. animals). Add jack.png, queen.png, king.png to public/face-cards/ and uncomment below. */
//const FACE_CARD_IMAGE_URLS: Partial<Record<'J' | 'Q' | 'K', string>> | undefined = undefined;
const FACE_CARD_IMAGE_URLS = {
   J: '/face-cards/jack.png',
   Q: '/face-cards/queen.png',
   K: '/face-cards/king.png',
};

export default function App() {
  const game = useBlackjackGame();
  const lb = useLeaderboard(game.balance, game.buyInCount, game.stats.handsPlayed);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

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
        playerName={lb.playerName}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        newRound={game.newRound}
        startNewShoe={game.startNewShoe}
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
      />
    </main>
  );
}
