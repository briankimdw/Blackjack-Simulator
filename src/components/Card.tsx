import type { Card as CardType, Rank } from '../types';
import { isRed, PIP_LAYOUTS } from '../utils/cards';
import styles from './Card.module.css';

const SUIT_SYMBOLS: Record<CardType['suit'], string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export type FaceCardImageUrls = Partial<Record<'J' | 'Q' | 'K', string>>;

interface CardProps {
  card: CardType;
  faceDown?: boolean;
  small?: boolean;
  animateDeal?: boolean;
  faceCardImageUrls?: FaceCardImageUrls;
  /** Position in hand (0-based) — used for z-index stacking so later cards cover earlier ones. */
  index?: number;
}

function isFaceRank(rank: Rank): rank is 'J' | 'Q' | 'K' {
  return rank === 'J' || rank === 'Q' || rank === 'K';
}

export function Card({ card, faceDown, small, animateDeal, faceCardImageUrls, index = 0 }: CardProps) {
  const zStyle = { zIndex: index + 1 } as React.CSSProperties;

  if (faceDown) {
    return (
      <div className={`${styles.card} ${styles.faceDown} ${small ? styles.small : ''}`} style={zStyle}>
        <div className={styles.back} />
      </div>
    );
  }

  const red = isRed(card.suit);
  const symbol = SUIT_SYMBOLS[card.suit];
  const pips = PIP_LAYOUTS[card.rank];
  const isAce = card.rank === 'A';
  const isFace = isFaceRank(card.rank);

  return (
    <div className={`${styles.card} ${red ? styles.red : ''} ${small ? styles.small : ''} ${animateDeal ? styles.animateDeal : ''}`} style={zStyle}>
      {/* Top-left corner */}
      <div className={styles.cornerTL}>
        <span className={styles.cornerRank}>{card.rank}</span>
        <span className={styles.cornerSuit}>{symbol}</span>
      </div>

      {/* Bottom-right corner (upside-down) */}
      <div className={styles.cornerBR}>
        <span className={styles.cornerRank}>{card.rank}</span>
        <span className={styles.cornerSuit}>{symbol}</span>
      </div>

      {/* Number card pips */}
      {pips && pips.map((p, i) => (
        <span
          key={i}
          className={`${styles.pip} ${p.flip ? styles.pipFlip : ''}`}
          style={{ top: `${p.top}%`, left: `${p.left}%` }}
        >
          {symbol}
        </span>
      ))}

      {/* Ace: one large centered pip */}
      {isAce && (
        <span className={styles.acePip}>{symbol}</span>
      )}

      {/* Face cards: custom image or fallback letter */}
      {isFace && (() => {
        const faceRank = card.rank as 'J' | 'Q' | 'K';
        const imgUrl = faceCardImageUrls?.[faceRank];
        return imgUrl ? (
          <div className={styles.faceImageWrap}>
            <img
              src={imgUrl}
              alt={`${faceRank} of ${card.suit}`}
              className={styles.faceImage}
            />
          </div>
        ) : (
          <div className={styles.faceCenter}>
            <span className={styles.faceLetter}>{faceRank}</span>
            <span className={styles.faceSuit}>{symbol}</span>
          </div>
        );
      })()}
    </div>
  );
}
