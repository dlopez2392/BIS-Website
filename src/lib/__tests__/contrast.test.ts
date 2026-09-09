import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Reads the palette straight out of globals.css so the test cannot drift from
 * what ships. A colour token is a design decision; a failing ratio is a bug.
 */
function palette(): { light: Record<string, string>; dark: Record<string, string> } {
  const css = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'globals.css'), 'utf8');
  // Anchored on the rule's opening brace: a bare indexOf('.dark') matches the
  // `@custom-variant dark (&:where(.dark, .dark *))` line first, which made an
  // earlier version of this parser read :root twice and never test dark mode.
  const block = (selector: string) => {
    const rule = new RegExp(`${selector.replace('.', '\\.')}\\s*\\{`).exec(css);
    if (!rule) throw new Error(`contrast test: no "${selector}" rule in globals.css`);
    const open = rule.index + rule[0].length - 1;
    const close = css.indexOf('}', open);
    const body = css.slice(open, close);

    // Every custom property in the rule, hexes and var() references alike.
    // The palette is now a ladder (--surface-*, --text-*, --accent) with the
    // semantic --color-* names aliased onto it, so a parser that only read
    // literal hexes would find no --color-* value at all and pass vacuously.
    const raw: Record<string, string> = {};
    for (const [, name, value] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) raw[name] = value.trim();

    const resolve = (value: string, seen = new Set<string>()): string => {
      const ref = /^var\((--[\w-]+)\)$/.exec(value);
      if (!ref) return value;
      if (seen.has(ref[1])) throw new Error(`contrast test: --${ref[1]} is a circular alias`);
      seen.add(ref[1]);
      const target = raw[ref[1]];
      if (!target) throw new Error(`contrast test: ${value} resolves to nothing in "${selector}"`);
      return resolve(target, seen);
    };

    const out: Record<string, string> = {};
    for (const [name, value] of Object.entries(raw)) {
      if (!name.startsWith('--color-')) continue;
      const resolved = resolve(value);
      if (/^#[0-9a-fA-F]{6}$/.test(resolved)) out[name.slice('--color-'.length)] = resolved;
    }
    return out;
  };
  return { light: block(':root'), dark: block('.dark') };
}

function luminance(hex: string): number {
  const channels = hex
    .replace('#', '')
    .match(/../g)!
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL = 4.5;
/** WCAG's large-text threshold: 18.66px bold or 24px regular. */
const AA_LARGE = 3;

describe('palette contrast', () => {
  const { light, dark } = palette();

  it('parses both themes out of globals.css', () => {
    for (const theme of [light, dark]) {
      for (const token of ['surface', 'surface-alt', 'ink', 'ink-muted', 'primary', 'accent', 'link', 'accent-label']) {
        expect(theme[token], token).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it('reads two genuinely different themes', () => {
    // The whole suite is worthless if both blocks resolve to :root, which is
    // exactly what a looser selector match did.
    expect(light.surface).not.toBe(dark.surface);
    expect(light.ink).not.toBe(dark.ink);
    // The platform's dark page surface. Retargeted, not removed: this is the
    // anchor proving the parser reached the .dark rule rather than :root twice.
    expect(dark.surface).toBe('#0e0d14');
  });

  for (const [name, theme] of Object.entries({ light, dark })) {
    describe(name, () => {
      for (const bg of ['surface', 'surface-alt'] as const) {
        it(`body and heading text clears AA on ${bg}`, () => {
          expect(contrast(theme.ink, theme[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
          expect(contrast(theme['ink-muted'], theme[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
        });

        it(`accent clears AA on ${bg}`, () => {
          // Accent is now the platform's violet and marks emphasis, bullets and
          // icons rather than the eyebrows. Still text-sized in places, so it
          // still owes the full 4.5:1.
          expect(contrast(theme.accent, theme[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
        });

        it(`the .label eyebrow clears AA on ${bg}`, () => {
          // 11px mono uppercase is NOT "large text", so it needs 4.5:1. This is
          // why the label role uses --text-2 and not the platform's --text-3,
          // which measures 3.22:1 on the page and 3.49:1 on a card.
          expect(contrast(theme['accent-label'], theme[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
        });

        it(`link text clears AA on ${bg}`, () => {
          // Links use --color-link, not --color-primary: primary at #8b5cf6
          // measured 4.31:1 on a dark card, and most links live on cards.
          expect(contrast(theme.link, theme[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
        });
      }

      it('primary buttons clear at least the large-text floor', () => {
        // Both modes now clear AA outright: light is white on #6d28d9 (7.10:1)
        // and dark is #111111 on #8b7cf7 (5.69:1) — the platform's own choice
        // of a dark foreground on the lighter violet. Keeping the large-text
        // floor as the assertion so the intent stays "never below 3:1".
        expect(contrast(theme['on-primary'], theme.primary)).toBeGreaterThanOrEqual(AA_LARGE);
      });
    });
  }
});
