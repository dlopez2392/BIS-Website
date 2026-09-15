import fs from 'node:fs';
import path from 'node:path';

/**
 * The /platform tour — what a client's own workspace looks like, section by
 * section.
 *
 * NOT to be confused with `lib/platform.ts`, which is the embed CONTRACT for
 * the form and booking iframes this site already runs on. That file is how the
 * site TALKS to app.bis-rgv.com; this one is how the site SELLS it.
 *
 * Every screenshot on this page comes from a demo account seeded by
 * `packages/db/src/demo/` in the bis-platform repo — an invented HVAC company
 * called Resaca Air. That matters for two reasons. It is why each section can
 * quote real interface copy before any image exists, and it is why the page
 * says so out loud: passing invented customers off as a real client's would be
 * a fabricated case study, and the disclosure is also the stronger sell —
 * nobody has to wonder which parts were blurred out.
 */

/**
 * A capture the Phase 2 screenshot pipeline produces. Dimensions are the
 * INTRINSIC size of the file, and the pipeline is expected to match them
 * exactly — `next/image` needs them to reserve layout, and a mismatch shows up
 * as a squashed screenshot rather than an error.
 */
export interface ShotSlot {
  /** File name under public/screenshots/ */
  file: string;
  width: number;
  height: number;
}

/**
 * A section of the tour. `id` is the anchor, the i18n key under
 * `platform.sections`, and the alt-text key — one string, so a section cannot
 * end up with its heading and its screenshot out of step.
 */
export interface TourSection {
  id: string;
  shot: ShotSlot;
  /** Renders the image first on wide screens, so the page alternates. */
  reversed?: boolean;
  /**
   * A line of real interface copy, quoted as TEXT rather than only shown in
   * the picture. Present on the sections where the words themselves are the
   * proof — the Spanish call being the clearest case. Keyed under
   * `platform.sections.<id>.quote`, with `quoteSource` naming where it is from.
   */
  quoted?: boolean;
}

/**
 * Order is the argument, not a list of features.
 *
 * Spanish comes second — immediately after the hero — because it is the one
 * thing no competitor in this market has, and on the rest of the site it is a
 * single line. The call log comes third rather than the pipeline, because a
 * log that admits two calls were spam is what makes the pipeline's numbers
 * believable afterwards.
 */
export const tourSections = [
  { id: 'spanish', shot: { file: 'call-detail-es.png', width: 2560, height: 1600 }, quoted: true },
  { id: 'calls', shot: { file: 'call-log.png', width: 2560, height: 1600 }, reversed: true },
  { id: 'pipeline', shot: { file: 'pipeline.png', width: 2560, height: 1600 } },
  { id: 'booking', shot: { file: 'booking-page.png', width: 1280, height: 1600 }, reversed: true },
  { id: 'report', shot: { file: 'weekly-report.png', width: 1280, height: 1600 } },
] as const satisfies readonly TourSection[];

export type TourSectionId = (typeof tourSections)[number]['id'];

/**
 * One tour capture, by id, for the pages that borrow a single screenshot
 * rather than running the whole tour (`PlatformProof` on the homepage, /work
 * and the industry pages).
 *
 * A lookup rather than five exported constants: `tourSections` is already the
 * single place a capture's file and dimensions are declared, and a second
 * declaration is how the website and the capture pipeline would drift apart
 * again. `TourSectionId` keeps a typo a compile error rather than a runtime
 * `undefined` that renders nothing and looks like the render-only-if-present
 * rule doing its job.
 */
export function tourShot(id: TourSectionId): ShotSlot {
  const section = tourSections.find((s) => s.id === id);
  if (!section) throw new Error(`tourShot: no section "${id}"`);
  return section.shot;
}

/** The hero capture, above the fold and separate from the alternating tour. */
export const heroShot: ShotSlot = {
  file: 'dashboard-dark.png', width: 2560, height: 1600,
};

const PUBLIC_SHOTS = path.join(process.cwd(), 'public', 'screenshots');

/**
 * Whether a capture is on disk. Same rule as `lib/photos.ts`: a slot renders
 * only when its file exists, so the page ships today and gains its screenshots
 * the moment the pipeline drops them in — no code change, and never a grey
 * placeholder box in production.
 *
 * Deliberately a separate pair from `hasPhoto`/`photoSrc` rather than a shared
 * generic. Photography and product captures have different lifecycles (a shoot
 * versus a script in another repo) and different homes on disk; the rule is
 * worth copying, the three lines are not worth abstracting.
 */
export function hasShot(slot: ShotSlot): boolean {
  return fs.existsSync(path.join(PUBLIC_SHOTS, slot.file));
}

export function shotSrc(slot: ShotSlot): string {
  return `/screenshots/${slot.file}`;
}

/** Every capture the page can show — what the Phase 2 pipeline must produce. */
export function allShots(): ShotSlot[] {
  return [heroShot, ...tourSections.map((s) => s.shot)];
}
