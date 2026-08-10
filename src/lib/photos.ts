import fs from 'node:fs';
import path from 'node:path';

/**
 * Photography slots. Each one names a file under `public/photos/`; the site
 * renders the slot only when that file actually exists, so a page never ships
 * a broken image or a grey placeholder box while we wait for a shoot.
 *
 * Adding a photo is: drop the file in with the exact name below, push. No code
 * change. See docs/brand/photography.md for sizes and crops.
 */
export interface PhotoSlot {
  /** File name under public/photos/ */
  file: string;
  /** Intrinsic dimensions of the file we are asking for. */
  width: number;
  height: number;
  /** i18n key under `photos.alt` — alt text is copy, so it is translated. */
  altKey: string;
}

export const photoSlots = {
  founder: { file: 'dan-lopez.jpg', width: 800, height: 1000, altKey: 'founder' },
} as const satisfies Record<string, PhotoSlot>;

export type PhotoSlotName = keyof typeof photoSlots;

const PUBLIC_PHOTOS = path.join(process.cwd(), 'public', 'photos');

/**
 * Whether the asset for a slot is present. Evaluated on the server at build
 * time — these pages are prerendered, so this costs nothing at request time.
 */
export function hasPhoto(name: PhotoSlotName): boolean {
  return fs.existsSync(path.join(PUBLIC_PHOTOS, photoSlots[name].file));
}

export function photoSrc(name: PhotoSlotName): string {
  return `/photos/${photoSlots[name].file}`;
}
