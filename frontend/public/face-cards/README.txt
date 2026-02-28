Custom face card images (Jack, Queen, King)
============================================

Add your own pictures here (e.g. animals) and they will show on J, Q, K cards.

1. Add image files:
   - jack.png   (or .jpg)  → used for all Jacks
   - queen.png  (or .jpg)  → used for all Queens
   - king.png   (or .jpg)  → used for all Kings

2. In src/App.tsx, uncomment and set FACE_CARD_IMAGE_URLS, e.g.:

   const FACE_CARD_IMAGE_URLS = {
     J: '/face-cards/jack.png',
     Q: '/face-cards/queen.png',
     K: '/face-cards/king.png',
   };

Use any image size; they will be scaled to fit the card center.
Square or portrait images work best.
