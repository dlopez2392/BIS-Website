// Ordered case studies for /work. Copy lives in the `work` i18n namespace
// (work.cases.<id>.*), so adding an engagement is: append an entry here, write
// its EN + ES copy, done — the page renders whatever this list contains and the
// coverage test in __tests__/work.test.ts fails loudly if a locale is missing.
//
// `cta` is what closes the entry:
//   'call'  — the tap-to-call block (only honest for something a visitor can
//             dial themselves);
//   'visit' — a link out to something a visitor can open and use themselves,
//             no sign-up (Prism's public demo);
//   'tour'  — a link into this site's own /platform tour, for a case that is
//             the platform itself (the Resaca Air demo account);
//   'none'  — ends the card after the facts, which is what a client
//             engagement will normally want.
//
// `media` is optional: a short film and/or a screen gallery shown between the
// summary and the facts. Files live under public/ with a version in the name,
// so they are cached as immutable and a new cut is a new URL.

import { heroShot, shotSrc, tourShot, type ShotSlot } from './platform-tour';

export interface VideoSlot {
  /** Paths under public/, both encodes of the same cut. */
  webm: string;
  mp4: string;
  poster: string;
  width: number;
  height: number;
}

/** A screenshot that exists in a light and a dark capture of the same screen. */
export interface ThemedShot {
  id: string;
  light: string;
  dark: string;
  width: number;
  height: number;
}

export interface WorkMedia {
  video?: VideoSlot;
  /** One wide screen, shown large. */
  desktop?: ThemedShot;
  /** Phone-sized screens, shown in a row under it. */
  phones?: readonly ThemedShot[];
}

export const PRISM_URL = 'https://prism.bis-rgv.com';

/** The 30-second spots, re-encoded for the web from the 1080x1920 masters. */
export const BIS_AD: VideoSlot = {
  webm: '/video/bis-ad.1.webm',
  mp4: '/video/bis-ad.1.mp4',
  poster: '/video/bis-ad-poster.1.webp',
  width: 720,
  height: 1280,
};

export const PRISM_AD: VideoSlot = {
  webm: '/video/prism-ad.1.webm',
  mp4: '/video/prism-ad.1.mp4',
  poster: '/video/prism-ad-poster.1.webp',
  width: 720,
  height: 1280,
};

const prismShot = (id: string, kind: 'desktop' | 'phone'): ThemedShot => ({
  id,
  light: `/work/prism/${id}-${kind}-light.1.webp`,
  dark: `/work/prism/${id}-${kind}-dark.1.webp`,
  ...(kind === 'desktop' ? { width: 1600, height: 1000 } : { width: 780, height: 1688 }),
});

/** Captured from the live demo household on prism.bis-rgv.com, 2026-09-30. */
export const PRISM_MEDIA: WorkMedia = {
  video: PRISM_AD,
  desktop: prismShot('overview', 'desktop'),
  phones: [prismShot('future', 'phone'), prismShot('goals', 'phone'), prismShot('spending', 'phone')],
};

/**
 * One capture of the platform, from the same files the /platform tour shows
 * (`lib/platform-tour.ts`). The capture pipeline shoots each screen in one
 * theme only, so both sides of the pair are the same file: the dashboard is
 * dark because operators default to dark, and the booking page and report
 * are the client's own brand whatever the reader's theme.
 */
const platformShot = (id: string, slot: ShotSlot): ThemedShot => ({
  id,
  light: shotSrc(slot),
  dark: shotSrc(slot),
  width: slot.width,
  height: slot.height,
});

/**
 * Resaca Air is the demo account the platform's screenshots come from: an
 * invented HVAC company, seeded by bis-platform's `packages/db/src/demo/`.
 * The case says so in its label, its summary and its caption. Passing it off
 * as a client would be the fabricated case study this page promises not to
 * publish.
 */
export const RESACA_MEDIA: WorkMedia = {
  desktop: platformShot('dashboard', heroShot),
  phones: [platformShot('booking', tourShot('booking')), platformShot('report', tourShot('report'))],
};

export type WorkCase =
  | { id: 'sofia'; cta: 'call'; media?: undefined }
  | { id: 'prism'; cta: 'visit'; href: string; media: WorkMedia }
  | { id: 'resaca'; cta: 'tour'; media: WorkMedia };

export const workCases: readonly WorkCase[] = [
  { id: 'sofia', cta: 'call' },
  { id: 'resaca', cta: 'tour', media: RESACA_MEDIA },
  { id: 'prism', cta: 'visit', href: PRISM_URL, media: PRISM_MEDIA },
];

export type WorkCaseId = WorkCase['id'];

/** Text keys every case must define in both locales. */
export const workCaseTextKeys = [
  'label',
  'title',
  'summary',
  'factsHeading',
  'builtHeading',
  'builtBody',
  'stackHeading',
] as const;

/** List keys every case must define in both locales. */
export const workCaseListKeys = ['facts', 'stack'] as const;

/** Text keys required only by cases whose `cta` is 'call'. */
export const workCallCtaKeys = [
  'tryHeading', 'tryBody', 'tryNote', 'tryNoteLink',
  // The browser panel offered alongside the number, for readers who
  // will not dial one.
  'tryBrowserTitle', 'tryBrowserBlurb',
] as const;

/** Text keys required only by cases whose `cta` is 'visit'. */
export const workVisitCtaKeys = ['visitHeading', 'visitBody', 'visitLink', 'visitNewTab'] as const;

/** Text keys required only by cases whose `cta` is 'tour'. */
export const workTourCtaKeys = ['tourHeading', 'tourBody', 'tourLink'] as const;

/** Text keys required only by cases that carry media. */
export const workMediaKeys = ['galleryCaption'] as const;

/** Text keys required only by cases whose media includes a film. */
export const workVideoKeys = ['videoLabel'] as const;
