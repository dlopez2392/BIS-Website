import fs from 'node:fs';
import path from 'node:path';

/**
 * Art slots — the generated pieces of the Señal system (see art/README.md).
 *
 * Same contract as `lib/photos.ts` and `lib/platform-tour.ts`: a slot renders
 * only when its file is on disk, so a page never ships a broken image, and an
 * asset can land on its own with no code change. Every file here is
 * decorative — it carries `alt=""` — because the system forbids words, faces
 * and places in the art; what a page says, it says in text.
 *
 * Files are versioned (`name.1.webp`) and cached immutably; a changed asset
 * is a new version, never an overwrite. `scripts/art-tint.py` writes them.
 */
export interface ArtSlot {
  file: string;
  width: number;
  height: number;
}

const wide = (name: string): ArtSlot => ({ file: `${name}.1.webp`, width: 2048, height: 1152 });

export const artSlots = {
  ctaBand: { file: 'cta-band.1.webp', width: 2048, height: 683 },
  ogPlate: { file: 'og-plate.1.jpg', width: 1200, height: 630 },
  notFoundWide: wide('not-found-wide'),
  notFoundTall: { file: 'not-found-tall.1.webp', width: 1152, height: 2048 },
  headerWork: { file: 'header-work.1.webp', width: 2048, height: 585 },
  headerIndustries: { file: 'header-industries.1.webp', width: 2048, height: 585 },
  headerPlace: { file: 'header-place.1.webp', width: 2048, height: 585 },
  serviceAi: wide('service-ai'),
  serviceInfra: wide('service-infra'),
  serviceWeb: wide('service-web'),
  indLegal: wide('ind-legal'),
  indMedical: wide('ind-medical'),
  indLogistics: wide('ind-logistics'),
  indTrades: wide('ind-trades'),
  indAgriculture: wide('ind-agriculture'),
  cityHarlingen: wide('city-harlingen'),
  cityMcallen: wide('city-mcallen'),
  cityBrownsville: wide('city-brownsville'),
  cityEdinburg: wide('city-edinburg'),
  cityWeslaco: wide('city-weslaco'),
} as const satisfies Record<string, ArtSlot>;

export type ArtSlotName = keyof typeof artSlots;

const PUBLIC_ART = path.join(process.cwd(), 'public', 'art');

/** Evaluated on the server at build time; these pages are prerendered. */
export function hasArt(name: ArtSlotName): boolean {
  return fs.existsSync(path.join(PUBLIC_ART, artSlots[name].file));
}

export function artSrc(name: ArtSlotName): string {
  return `/art/${artSlots[name].file}`;
}

/** The three props an <Image> needs, or undefined while the file is absent. */
export interface ArtProps { src: string; width: number; height: number }
export function artProps(name: ArtSlotName | undefined): ArtProps | undefined {
  if (!name || !hasArt(name)) return undefined;
  const { width, height } = artSlots[name];
  return { src: artSrc(name), width, height };
}

/** The slot for an industry or city id, so pages can look one up by id. */
export function artFor(kind: 'ind' | 'city' | 'service', id: string): ArtSlotName | undefined {
  const key = kind + id.charAt(0).toUpperCase() + id.slice(1);
  return key in artSlots ? (key as ArtSlotName) : undefined;
}
