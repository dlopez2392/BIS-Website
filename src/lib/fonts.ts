import { Hanken_Grotesk, Instrument_Serif } from 'next/font/google';

export const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-hanken',
  display: 'swap',
});

// Only the hero headline's accent phrase wears this: an italic serif against
// the grotesque is the one typographic flourish on the site, so it stays
// scoped to the one place it means something.
export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-instrument',
  display: 'swap',
});
