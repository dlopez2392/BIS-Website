import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { palette, MARK_GRADIENT } from '../brand-palette';

const root = process.cwd();
const css = fs.readFileSync(path.join(root, 'src', 'app', 'globals.css'), 'utf8');

/** Every .tsx that ships, tests excluded. */
function sources(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== '__tests__') walk(full); }
      else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) out.push(full);
    }
  };
  walk(path.join(root, 'src'));
  return out;
}

/** The value of a custom property inside a given rule. */
function token(selector: string, name: string): string {
  const rule = new RegExp(`${selector.replace('.', '\\.')}\\s*\\{`).exec(css)!;
  const open = rule.index + rule[0].length - 1;
  const body = css.slice(open, css.indexOf('}', open));
  return new RegExp(`${name}:\\s*([^;]+);`).exec(body)![1].trim();
}

describe('design system — shared with app.bis-rgv.com', () => {
  it('has no cyan left anywhere', () => {
    // The site ran a violet primary against a cyan accent. The platform has
    // one hue and reserves the others for status, so cyan is gone: from the
    // palette, from the hero's tint and glows, and from the app icons.
    const cyan = /#0891b2|#0e7490|#22d3ee|#06b6d4|14,\s*116,\s*144|34,\s*211,\s*238/i;
    const offenders = [
      ...(cyan.test(css) ? ['src/app/globals.css'] : []),
      ...sources().filter((f) => cyan.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(root, f)),
    ];
    expect(offenders).toEqual([]);
  });

  it('uses only the three sanctioned radii', () => {
    // 8px controls, 11px cards, 999px pills. Tailwind's own scale offers a
    // dozen; five of them were in use here before this converged.
    const offenders: string[] = [];
    for (const f of sources()) {
      const found = fs.readFileSync(f, 'utf8').match(/\brounded-(?!ctl\b|card\b|pill\b)[a-z0-9-]+/g);
      if (found) offenders.push(`${path.relative(root, f)}: ${[...new Set(found)].join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('spells the eyebrow treatment once, as .label', () => {
    // 31 call sites wrote it longhand, which is how one of them ends up bold
    // and the rest semibold. The class owns size, face, tracking and colour.
    expect(css).toMatch(/\.label\s*\{/);
    const longhand = sources().filter((f) =>
      /uppercase[^"]*tracking-(widest|\[0\.14em\])/.test(fs.readFileSync(f, 'utf8')),
    );
    expect(longhand.map((f) => path.relative(root, f))).toEqual([]);
  });

  it('keeps brand-palette.ts in step with the css tokens', () => {
    // Emails and satori images cannot read a custom property, so these values
    // are duplicated by necessity. Duplicated by necessity still drifts.
    const light = (name: string) => token(':root', name);
    expect(palette.surface).toBe(light('--surface-0'));
    expect(palette.surfaceAlt).toBe(light('--surface-1'));
    expect(palette.ink).toBe(light('--text-1'));
    expect(palette.inkMuted).toBe(light('--text-2'));
    expect(palette.inkFaint).toBe(light('--text-3'));
    expect(palette.line).toBe(light('--line'));
    expect(palette.accent).toBe(light('--accent'));
    expect(palette.good).toBe(light('--good'));
    expect(palette.warn).toBe(light('--warn'));
    expect(palette.crit).toBe(light('--crit'));
    // The dark accent doubles as the mark's bright stop.
    expect(palette.accentBright).toBe(token('.dark', '--accent'));
    expect(MARK_GRADIENT).toContain(palette.accent);
    expect(MARK_GRADIENT).toContain(palette.accentBright);
  });

  it('carries the platform ladder in both themes', () => {
    for (const mode of [':root', '.dark']) {
      for (const t of ['--surface-0', '--surface-1', '--surface-2', '--surface-3',
                       '--line', '--line-strong', '--text-1', '--text-2', '--text-3',
                       '--accent', '--accent-strong', '--accent-dim', '--ring-glow',
                       '--shadow-card']) {
        expect(token(mode, t), `${mode} ${t}`).toBeTruthy();
      }
    }
  });
});
