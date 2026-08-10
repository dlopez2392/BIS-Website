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
    const out: Record<string, string> = {};
    for (const [, name, value] of css.slice(open, close).matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
      out[name] = value;
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
      for (const token of ['surface', 'surface-alt', 'ink', 'ink-muted', 'primary', 'accent', 'link']) {
        expect(theme[token], token).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it('reads two genuinely different themes', () => {
    // The whole suite is worthless if both blocks resolve to :root, which is
    // exactly what a looser selector match did.
    expect(light.surface).not.toBe(dark.surface);
    expect(light.ink).not.toBe(dark.ink);
    expect(dark.surface).toBe('#0b0a18');
  });

  for (const [name, theme] of Object.entries({ light, dark })) {
    describe(name, () => {
      for (const bg of ['surface', 'surface-alt'] as const) {
        it(`body and heading text clears AA on ${bg}`, () => {
          expect(contrast(theme.ink, theme[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
          expect(contrast(theme['ink-muted'], theme[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
        });

        it(`accent clears AA on ${bg}`, () => {
          // accent styles the small uppercase eyebrow labels on /work, the city
          // pages, insights categories and contact bullets. 12px bold is NOT
          // "large text", so it needs the full 4.5:1 — cyan-600 failed at 3.52.
          expect(contrast(theme.accent, theme[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
        });

        it(`link text clears AA on ${bg}`, () => {
          // Links use --color-link, not --color-primary: primary at #8b5cf6
          // measured 4.31:1 on a dark card, and most links live on cards.
          expect(contrast(theme.link, theme[bg])).toBeGreaterThanOrEqual(AA_NORMAL);
        });
      }

      it('primary buttons clear at least the large-text floor', () => {
        // Known and accepted: dark-mode white on #8b5cf6 is 4.23:1, which passes
        // for the bold button text it is used on but not for body copy. Pinned
        // here so a palette change cannot quietly push it below 3:1 too.
        expect(contrast(theme['on-primary'], theme.primary)).toBeGreaterThanOrEqual(AA_LARGE);
      });
    });
  }
});
