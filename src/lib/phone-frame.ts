/**
 * The phone the /platform tour draws around its two customer-side captures —
 * the booking page and the Monday report. Pure, like `tour-pose.ts`, so the
 * client-side story frame can import it; `platform-tour.ts` reads the disk and
 * cannot be.
 *
 * Why a phone at all (2026-10-12). Those two screens are the client's brand,
 * not ours, so they are light on a dark site, and as bare rectangles they read
 * as a page that failed to load its styles. Inside a dark phone the same white
 * reads as a lit screen — the brightness becomes the point instead of an
 * accident — and the frame says the one thing the picture could not: whose
 * phone this is. The captures are taken AT phone size (bis-platform
 * screenshots/capture.spec.ts, `PHONE`), never a desktop layout shrunk into a
 * bezel, which would be a picture of a page nobody sees.
 *
 * Drawn in CSS rather than baked into the PNG, so a re-capture drops straight
 * in, the bezel is sharp at any size, and the capture pipeline keeps producing
 * plain, honest screenshots.
 *
 * Every length here is in device points (an iPhone 13-15: a 390x844 screen),
 * and the CSS turns them into fractions of the phone's own width, so the frame
 * scales as one object.
 */
export const PHONE = {
  screen: { width: 390, height: 844 },
  /** The status bar the frame draws; the capture is the screen below it. */
  statusBar: 47,
  bezel: 12,
  outerRadius: 60,
  screenRadius: 48,
} as const;

export const PHONE_OUTER = {
  width: PHONE.screen.width + 2 * PHONE.bezel,
  height: PHONE.screen.height + 2 * PHONE.bezel,
} as const;

export interface PhoneScreen {
  /** The status bar's clock. Stated per capture so it agrees with the
   *  picture: the booking page is shot at 2 PM, the report arrives at 8. */
  clock: string;
  /**
   * How much of the phone shows, top down, 0-1. The rest runs off the bottom
   * edge of its panel — the device rising into view — because both captures
   * say everything they have to say in the top of the screen, and a whole
   * phone with its lower half blank is the empty white space this exists to
   * get rid of.
   */
  show: number;
  /** The status bar's background: the colour at the top of the capture, so
   *  the bar and the page read as one screen. */
  ground: string;
  /** The status bar's text and icons, for a dark capture (the booking page
   *  since 2026-10-26). Black when absent, as on a light screen. */
  ink?: string;
}

/** The aspect ratio of the visible part of the phone, width / height. */
export function croppedAspect(show: number): number {
  return PHONE_OUTER.width / (PHONE_OUTER.height * show);
}
