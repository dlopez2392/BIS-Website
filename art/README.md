# Art — the Señal system

Every generated piece on this site is **one signal in the dark**: a single
ribbon, filament, membrane or field of light in otherwise empty black. It is
generated **greyscale** and tinted afterwards with the same arithmetic the hero
footage wears (`scripts/bis_tint.py`), so ten assets from ten generations are
one family by construction, and the day the accent moves nothing is
regenerated.

## The run

**From GitHub (no key on your machine):** Actions → *Generate Señal art* →
Run workflow. It reads the `HF_CREDENTIALS` repository secret, makes the jobs
named in its box (the CTA band and the OG plate by default; blank for all
twenty), and returns the takes as an artifact with `index.html`, a contact
sheet showing each slot's four takes side by side. Pick one per slot, then tint
the picks as below.

**Locally:**

    npm run higgsfield -- --jobs art/brief.json [--only cta-band,og-plate]
                                                     # greyscale masters -> art/raw/
    node scripts/art-sheet.mjs art/raw               # contact sheet -> art/raw/index.html
    python3 scripts/art-tint.py art/raw/<name>.png <name> 1 [--crop WxH]
                                                     # tinted WebP -> public/art/<name>.1.webp

`brief.json` is in the order that changes the site most: the CTA band and OG
plate first (every page, every share), then the three service tiles, then the
404 pair, the industry tiles, the header bands and the city plates. Soul jobs
are `batch: 4` — look at four, keep one. `art/raw/` is git-ignored; the
tinted masters under `public/art/` are what ship, and `manifest.json` beside
them records model, prompt and seed per asset so any of it can be re-rolled.

Crops: none for the CTA band (it ships the 16:9 master — with the booking card
in it the band stands ~1.65:1, and a 3:1 crop left only slivers of light under
`cover`) and none for the page headers either (a centre crop to 3.5:1 cut
header-place's horizon off; the page crops with `object-position`), and
`--crop 1200x630 --jpg` for the OG plate.

A take can be mirrored (`sharp().flop()`) before tinting when its light runs
the wrong way — ind-legal's beam narrows left to right that way — and a take
with a bright line along an edge (a scan artefact) is inset-trimmed 16px
before tinting. The manifest records both.

## Writing the prompts: say what is there, never what is not

SOUL V2 has no negative prompt, and naming a thing — even to forbid it — puts
it in the picture. The first run (2026-10-07) proved it: prompts that ended
"no circuit boards, chips, wireframe globes, glowing brains, flares, no
violet, no blue" came back with circuit boards, chips, wireframe globes,
brain-like blobs, flares and violet edges, in almost every take. The brief
now describes only what the frame holds — light, dust, deep black,
black-and-white film — and the rules below are kept by choosing takes, not
by listing what to leave out. Keep it that way when adding a slot: no
"no", "not" or "without" in a prompt.

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
