# Blackjack Card Counting Practice

A browser app to practice **Hi-Lo card counting** while playing a full blackjack game with betting, hit/stand/double/split, and statistics.

## Run the app

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Features

- **Full blackjack** – 6-deck shoe, dealer stands on all 17s, blackjack pays 3:2, double down and split (including double after split).
- **Betting** – Set your bet with the slider, then press Deal. Starting balance: $1000.
- **Count practice** – Hi-Lo system: 2–6 = +1, 7–9 = 0, 10–A = −1. **Hover over the "?" next to "Count"** to see the current running count, true count, and decks remaining so you can check your count without peeking during play.
- **Statistics** – Click **View stats** to see hands played, wins/losses/pushes, blackjacks, win rate, total profit, and count history. Stats are saved in your browser (localStorage).

## Build

```bash
npm run build
```

Output is in the `dist` folder. Serve it with any static host or `npm run preview`.
