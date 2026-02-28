import { useCallback, useEffect, useRef, useState } from 'react';
import { handDisplayValue, handValue } from '../utils/blackjack';
import { Card } from './Card';
import { CountReveal } from './CountReveal';
import { StatsPanel } from './StatsPanel';
import type { Hand, Card as CardType } from '../types';
import type { GameStats } from '../types';
import styles from './GameTable.module.css';

/** Break a bet amount into chip denominations (greedy, largest first). */
function breakdownBet(amount: number): number[] {
  const chips: number[] = [];
  let remaining = amount;
  for (const d of [100, 25, 10, 5, 1]) {
    while (remaining >= d) {
      chips.push(d);
      remaining -= d;
    }
  }
  return chips;
}

/** Map chip value to CSS color class name. */
function chipColorKey(value: number): string {
  if (value >= 100) return 'chipColor100';
  if (value >= 25) return 'chipColor25';
  if (value >= 10) return 'chipColor10';
  if (value >= 5) return 'chipColor5';
  return 'chipColor1';
}

interface GameTableProps {
  phase: string;
  balance: number;
  currentBet: number;
  minBet: number;
  maxBet: number;
  numDecks: number;
  minDecks: number;
  maxDecks: number;
  setNumDecks: (n: number) => void;
  playerHands: Hand[];
  dealerHand: CardType[];
  currentHandIndex: number;
  runningCount: number;
  trueCount: number;
  decksRemaining: number;
  stats: GameStats;
  setBet: (n: number) => void;
  addChip: (amount: number) => void;
  clearBet: () => void;
  chipDenominations: readonly number[];
  deal: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  runDealerAndSettle: () => void;
  acceptInsurance: () => void;
  declineInsurance: () => void;
  buyIn: () => void;
  buyInCount: number;
  lifetimeEarnings: number;
  playerName: string;
  onOpenLeaderboard: () => void;
  newRound: () => void;
  startNewShoe: () => void;
  clearShuffleMessage: () => void;
  shoeStarted: boolean;
  showShuffleMessage: boolean;
  lastRoundProfit: number;
  resetStats: () => void;
  canDouble: boolean;
  canSplit: boolean;
  faceCardImageUrls?: Partial<Record<'J' | 'Q' | 'K', string>>;
}

export function GameTable({
  phase,
  balance,
  currentBet,
  minBet,
  maxBet,
  numDecks,
  minDecks,
  maxDecks,
  setNumDecks,
  playerHands,
  dealerHand,
  currentHandIndex,
  runningCount,
  trueCount,
  decksRemaining,
  stats,
  addChip,
  clearBet,
  chipDenominations,
  deal,
  hit,
  stand,
  double: doubleFn,
  split,
  runDealerAndSettle,
  acceptInsurance,
  declineInsurance,
  buyIn,
  lifetimeEarnings,
  playerName,
  onOpenLeaderboard,
  newRound,
  startNewShoe,
  clearShuffleMessage,
  shoeStarted,
  showShuffleMessage,
  lastRoundProfit,
  resetStats,
  canDouble,
  canSplit,
  faceCardImageUrls,
}: GameTableProps) {
  const [statsOpen, setStatsOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const dealerAnimatedRef = useRef<Set<string>>(new Set());
  const [overlayKey, setOverlayKey] = useState(0);

  const handleAddChipToBet = useCallback(
    (value: number) => {
      if (value <= 0 || (phase !== 'bet' && phase !== 'result')) return;
      if (currentBet + value <= balance && currentBet + value <= maxBet) addChip(value);
    },
    [phase, currentBet, balance, maxBet, addChip]
  );

  const handleBetAreaClick = useCallback(() => {
    if (selectedChip) handleAddChipToBet(selectedChip);
  }, [selectedChip, handleAddChipToBet]);

  const handleBetAreaDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const value = e.dataTransfer.getData('chip');
      if (value) handleAddChipToBet(Number(value));
    },
    [handleAddChipToBet]
  );

  const handleBetAreaDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Dealer: first delay = reveal hole card, then one card per delay
  useEffect(() => {
    if (phase !== 'dealer') return;
    const delay = dealerHand.length <= 2 ? 1400 : 900;
    const t = setTimeout(runDealerAndSettle, delay);
    return () => clearTimeout(t);
  }, [phase, runDealerAndSettle, dealerHand.length]);

  // Reset dealer animation tracking when starting a new hand
  useEffect(() => {
    if (phase === 'bet') dealerAnimatedRef.current = new Set();
  }, [phase]);

  // Clear shuffle message after delay
  useEffect(() => {
    if (!showShuffleMessage) return;
    const t = setTimeout(clearShuffleMessage, 2500);
    return () => clearTimeout(t);
  }, [showShuffleMessage, clearShuffleMessage]);

  // Trigger result overlay animation on each new result
  useEffect(() => {
    if (phase === 'result') {
      setOverlayKey((k) => k + 1);
    }
  }, [phase]);

  const isPlayerTurn = phase === 'player';
  const currentHand = playerHands[currentHandIndex];
  const handIs21 = currentHand && handValue(currentHand.cards) === 21;
  const canAct =
    isPlayerTurn &&
    currentHand &&
    !currentHand.stood &&
    !currentHand.bust &&
    !currentHand.splitAces &&
    !handIs21;

  // Auto-stand when player has 21 (no option to hit)
  useEffect(() => {
    if (phase !== 'player' || !currentHand || currentHand.stood || currentHand.bust) return;
    if (handValue(currentHand.cards) === 21) stand();
  }, [phase, currentHand, stand]);

  const isBroke = balance === 0 && currentBet === 0 && (phase === 'bet' || phase === 'result');
  const betChips = breakdownBet(currentBet);

  return (
    <div className={styles.table}>
      {showShuffleMessage && (
        <div className={styles.shuffleBanner} role="status">
          Shuffling new shoe…
        </div>
      )}

      <div className={styles.felt}>
        {/* Info panel on felt */}
        <div className={styles.infoPanel}>
          {playerName && (
            <div className={styles.infoPanelName}>{playerName}</div>
          )}
          <div className={styles.infoPanelRow}>
            <div className={styles.infoItem}>
              <span className={styles.infoItemLabel}>Balance</span>
              <span className={styles.infoItemValue} style={{ color: '#8ae88a' }}>${balance}</span>
            </div>
            <div className={styles.infoItemDivider} />
            <div className={styles.infoItem}>
              <span className={styles.infoItemLabel}>Earnings</span>
              <span
                className={styles.infoItemValue}
                style={{ color: lifetimeEarnings >= 0 ? '#8ae88a' : '#f87171' }}
              >
                {lifetimeEarnings >= 0 ? '+' : ''}{lifetimeEarnings}
              </span>
            </div>
            <div className={styles.infoItemDivider} />
            <div className={styles.infoItem}>
              <span className={styles.infoItemLabel}>Count</span>
              <CountReveal
                runningCount={runningCount}
                trueCount={trueCount}
                decksRemaining={decksRemaining}
              />
            </div>
          </div>
          <div className={styles.infoPanelBtns}>
            <button
              type="button"
              className={styles.infoPanelBtn}
              onClick={() => setStatsOpen(true)}
              title="Statistics"
            >
              📊
            </button>
            <button
              type="button"
              className={styles.infoPanelBtn}
              onClick={onOpenLeaderboard}
              title="Leaderboard"
            >
              🏆
            </button>
          </div>
        </div>

        {/* Curved rules text */}
        <svg className={styles.curvedTextSvg} viewBox="0 0 500 85" preserveAspectRatio="xMidYMid meet">
          <defs>
            <path id="mainArc" d="M 25,78 Q 250,6 475,78" fill="none" />
            <path id="subArc" d="M 55,78 Q 250,26 445,78" fill="none" />
          </defs>
          <text
            fill="rgba(212,175,55,0.28)"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="15"
            letterSpacing="3"
          >
            <textPath href="#mainArc" startOffset="50%" textAnchor="middle">
              BLACKJACK PAYS 3 TO 2
            </textPath>
          </text>
          <text
            fill="rgba(212,175,55,0.18)"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="8.5"
            letterSpacing="1.5"
          >
            <textPath href="#subArc" startOffset="50%" textAnchor="middle">
              DEALER MUST STAND ON ALL 17s · INSURANCE PAYS 2 TO 1
            </textPath>
          </text>
        </svg>

        <div className={styles.dealerArea}>
          <div className={styles.areaLabel}>Dealer</div>
          <div className={styles.hand}>
            {dealerHand.map((card, i) => {
              const isLast = i === dealerHand.length - 1;
              const shouldAnimate =
                isLast &&
                (phase === 'dealer' || phase === 'result') &&
                !dealerAnimatedRef.current.has(card.id);
              if (shouldAnimate) dealerAnimatedRef.current.add(card.id);
              return (
                <Card
                  key={card.id}
                  card={card}
                  index={i}
                  faceDown={phase === 'deal' || phase === 'player' || phase === 'insurance' ? i === 1 : false}
                  animateDeal={shouldAnimate}
                  faceCardImageUrls={faceCardImageUrls}
                />
              );
            })}
          </div>
          {dealerHand.length > 0 && (
            <div className={styles.handValue}>
              {phase === 'deal' || phase === 'player' || phase === 'insurance'
                ? handDisplayValue(dealerHand.slice(0, 1))
                : handDisplayValue(dealerHand)}
            </div>
          )}
        </div>

        {/* Decorative arc separator */}
        <div className={styles.tableArc} />

        <div className={styles.playerArea}>
          <div className={styles.hands}>
            {playerHands.map((hand, i) => (
              <div
                key={i}
                className={`${styles.playerHandWrap} ${i === currentHandIndex && phase === 'player' ? styles.active : ''}`}
              >
                <div className={styles.hand}>
                  {hand.cards.map((card, ci) => (
                    <Card key={card.id} card={card} index={ci} faceCardImageUrls={faceCardImageUrls} />
                  ))}
                </div>
                <div className={styles.handMeta}>
                  <span className={styles.betChip}>${hand.bet}</span>
                  <span className={styles.handValue}>
                    {handDisplayValue(hand.cards)}
                    {hand.bust && ' (Bust)'}
                    {hand.blackjack && ' BJ'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className={`${styles.betSection} ${phase !== 'bet' && phase !== 'result' ? styles.betSectionInPlay : ''}`}>
            {/* Bet circle with chip visuals */}
            <div
              className={`${styles.betCircle} ${phase !== 'bet' && phase !== 'result' ? styles.betCircleInPlay : ''}`}
              onClick={phase === 'bet' || phase === 'result' ? handleBetAreaClick : undefined}
              onDragOver={phase === 'bet' || phase === 'result' ? handleBetAreaDragOver : undefined}
              onDrop={phase === 'bet' || phase === 'result' ? handleBetAreaDrop : undefined}
              role={phase === 'bet' || phase === 'result' ? 'button' : undefined}
              tabIndex={phase === 'bet' || phase === 'result' ? 0 : -1}
              onKeyDown={
                phase === 'bet' || phase === 'result'
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleBetAreaClick();
                      }
                    }
                  : undefined
              }
              aria-label={
                phase === 'bet' || phase === 'result'
                  ? selectedChip
                    ? `Place bet: click to add $${selectedChip}`
                    : 'Bet area: select a chip then click here'
                  : `Current bet: $${currentBet}`
              }
            >
              {currentBet > 0 ? (
                <>
                  <div className={styles.chipStack}>
                    {betChips.slice(0, 8).map((chip, i) => (
                      <div
                        key={i}
                        className={`${styles.stackedChip} ${styles[chipColorKey(chip)]}`}
                        style={{ bottom: `${i * 3}px`, zIndex: i + 1 }}
                      />
                    ))}
                  </div>
                  <span className={styles.chipStackTotal}>${currentBet}</span>
                </>
              ) : (
                <span className={styles.betCircleEmpty}>BET</span>
              )}
            </div>
            <div className={styles.chipTrayInline}>
              {chipDenominations.map((value) => {
                const inPlay = phase !== 'bet' && phase !== 'result';
                const disabled = inPlay || value > balance || currentBet + value > maxBet;
                const selected = selectedChip === value && !inPlay;
                return (
                  <div
                    key={value}
                    className={`${styles.chipTrayChip} ${styles[`chip${value}`]} ${selected ? styles.chipSelected : ''} ${disabled ? styles.chipDisabled : ''}`}
                    onClick={() => !disabled && setSelectedChip((prev) => (prev === value ? null : value))}
                    draggable={!disabled}
                    onDragStart={(e) => {
                      if (disabled) return;
                      e.dataTransfer.setData('chip', String(value));
                      e.dataTransfer.effectAllowed = 'copy';
                      e.dataTransfer.setData('text/plain', `$${value}`);
                    }}
                    title={disabled ? (inPlay ? 'Betting closed during hand' : `Can't add $${value}`) : `$${value} — click to select, drag to bet circle`}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={(e) => {
                      if (disabled) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedChip((prev) => (prev === value ? null : value));
                      }
                    }}
                  >
                    ${value}
                  </div>
                );
              })}
            </div>
            {(phase === 'bet' || phase === 'result') && (
              <div className={styles.betActions}>
                {!shoeStarted ? (
                  <div className={styles.deckSelector}>
                    <span className={styles.deckLabel}>Decks:</span>
                    <div className={styles.deckButtons}>
                      {[1, 2, 4, 6, 8].filter((d) => d >= minDecks && d <= maxDecks).map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`${styles.deckBtn} ${numDecks === d ? styles.deckBtnActive : ''}`}
                          onClick={() => setNumDecks(d)}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button type="button" className={styles.newShoeBtn} onClick={startNewShoe}>
                    New shoe
                  </button>
                )}
                {currentBet > 0 && (
                  <button type="button" className={styles.clearBetBtn} onClick={clearBet} title="Clear bet">
                    Clear
                  </button>
                )}
                {!isBroke && (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => {
                      if (phase === 'result') {
                        newRound();
                        setTimeout(deal, 0);
                      } else {
                        deal();
                      }
                    }}
                    disabled={currentBet < minBet}
                  >
                    Deal
                  </button>
                )}
              </div>
            )}
          </div>

          {phase === 'player' && canAct && (
            <div className={styles.actions}>
              <button type="button" className={`${styles.actionBtn} ${styles.actionHit}`} onClick={hit} title="Hit">
                <span className={styles.actionSymbol}>+</span>
                <span className={styles.actionLabel}>Hit</span>
              </button>
              <button type="button" className={`${styles.actionBtn} ${styles.actionStand}`} onClick={stand} title="Stand">
                <span className={styles.actionSymbol}>−</span>
                <span className={styles.actionLabel}>Stand</span>
              </button>
              {canDouble && balance >= (currentHand?.bet ?? 0) && (
                <button type="button" className={`${styles.actionBtn} ${styles.actionDouble}`} onClick={doubleFn} title="Double">
                  <span className={styles.actionSymbol}>2×</span>
                  <span className={styles.actionLabel}>Double</span>
                </button>
              )}
              {canSplit && balance >= (currentHand?.bet ?? 0) && (
                <button type="button" className={`${styles.actionBtn} ${styles.actionSplit}`} onClick={split} title="Split">
                  <span className={styles.actionSymbol}>⁄</span>
                  <span className={styles.actionLabel}>Split</span>
                </button>
              )}
            </div>
          )}

        </div>

        {/* Result overlay (centered, auto-fades) */}
        {phase === 'result' && (
          <div className={styles.resultOverlay} key={overlayKey}>
            <div className={styles.resultOverlayBox}>
              {lastRoundProfit > 0 && playerHands.some((h) => h.blackjack) && (
                <div className={`${styles.resultOverlayText} ${styles.resultOverlayBJ}`}>
                  Blackjack! +${lastRoundProfit}
                </div>
              )}
              {lastRoundProfit > 0 && !playerHands.some((h) => h.blackjack) && (
                <div className={`${styles.resultOverlayText} ${styles.resultOverlayWin}`}>
                  Win +${lastRoundProfit}
                </div>
              )}
              {lastRoundProfit < 0 && (
                <div className={`${styles.resultOverlayText} ${styles.resultOverlayLoss}`}>
                  Lose -${Math.abs(lastRoundProfit)}
                </div>
              )}
              {lastRoundProfit === 0 && (
                <div className={`${styles.resultOverlayText} ${styles.resultOverlayPush}`}>
                  Push
                </div>
              )}
            </div>
          </div>
        )}

        {/* Buy-in overlay */}
        {isBroke && (
          <div className={styles.buyInOverlay}>
            <div className={styles.buyInPrompt}>
              <div className={styles.buyInTitle}>Out of chips!</div>
              <div className={styles.buyInDesc}>Buy in for $1,000 to continue playing.</div>
              <div className={styles.buyInNote}>This will count against your lifetime earnings.</div>
              <button type="button" className={styles.buyInBtn} onClick={buyIn}>
                Buy In — $1,000
              </button>
            </div>
          </div>
        )}

        {/* Insurance prompt overlay */}
        {phase === 'insurance' && (
          <div className={styles.insuranceOverlay}>
            <div className={styles.insurancePrompt}>
              <div className={styles.insuranceTitle}>Insurance?</div>
              <div className={styles.insuranceDesc}>
                Dealer is showing an Ace.
              </div>
              <div className={styles.insuranceCost}>
                Cost: ${Math.floor((playerHands[0]?.bet ?? 0) / 2)}
              </div>
              <div className={styles.insuranceActions}>
                <button
                  type="button"
                  className={`${styles.insuranceBtn} ${styles.insuranceBtnYes}`}
                  onClick={acceptInsurance}
                  disabled={balance < Math.floor((playerHands[0]?.bet ?? 0) / 2)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`${styles.insuranceBtn} ${styles.insuranceBtnNo}`}
                  onClick={declineInsurance}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <StatsPanel
        stats={stats}
        onReset={() => {
          resetStats();
          setStatsOpen(false);
        }}
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
      />
    </div>
  );
}
