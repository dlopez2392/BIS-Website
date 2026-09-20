# Art — the Señal system

Every generated piece on this site is **one signal in the dark**: a single
ribbon, filament, membrane or field of light in otherwise empty black. It is
generated **greyscale** and tinted afterwards with the same arithmetic the hero
footage wears (`scripts/bis_tint.py`), so ten assets from ten generations are
one family by construction, and the day the accent moves nothing is
regenerated.

## The run

    npm run higgsfield -- --jobs art/brief.json      # greyscale masters -> art/raw/
    python3 scripts/art-tint.py art/raw/<name>.png <name> 1 [--crop WxH]
                                                     # tinted WebP -> public/art/<name>.1.webp

`brief.json` is in the order that changes the site most: the CTA band and OG
plate first (every page, every share), then the three service tiles, then the
404 pair, the industry tiles, the header bands and the city plates. Soul jobs
are `batch: 4` — look at four, keep one. `art/raw/` is git-ignored; the
tinted masters under `public/art/` are what ship, and `manifest.json` beside
them records model, prompt and seed per asset so any of it can be re-rolled.

Crops for the wide surfaces: `--crop 2048x683` for the CTA band (3:1),
`--crop 2048x585` for page headers (3.5:1), `--jpg` for the OG plate.

## Rules that keep it one family

- One light source, one gesture, one frame. Light enters at an edge and
  leaves at an edge; it never starts or stops inside the frame.
- At least 55% of every frame is black. Type never sits on a tile; where type
  sits on art (hero, CTA band, page headers, 404) it uses the hero's scrims.
- No people, no places, no fake interfaces, no words. People are photographed
  or absent — never generated. A generated Valley is a fabricated claim about
  somewhere real.
- Icons are SVG (lucide): 16 / 20 / 28 only, stroke 2 at 16 and 1.75 above.

Slots render only when their file exists (`src/lib/art.ts`), so assets can
land one at a time with no code change.
