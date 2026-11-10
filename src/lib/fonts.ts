import localFont from 'next/font/local';

// Both faces are served from this repository (`src/fonts`, SIL Open Font
// License, the licence text beside each file). They used to come from
// `next/font/google`, which downloads them during every build: when that
// download failed, the build failed, twice in one week on previews whose code
// was fine. A build now needs nothing from the network for its type.
//
// The files are the same Latin subsets Google served. Hanken Grotesk is one
// variable file, so 400, 600, 700 and 800 all come from it.
export const hankenGrotesk = localFont({
  src: '../fonts/hanken-grotesk-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-hanken',
  display: 'swap',
});

// Only the hero headline's accent phrase wears this: an italic serif against
// the grotesque is the one typographic flourish on the site, so it stays
// scoped to the one place it means something.
export const instrumentSerif = localFont({
  src: '../fonts/instrument-serif-latin-400-italic.woff2',
  weight: '400',
  style: 'italic',
  variable: '--font-instrument',
  display: 'swap',
});
