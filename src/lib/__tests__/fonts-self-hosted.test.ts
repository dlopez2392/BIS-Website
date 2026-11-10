import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * A build must not download its fonts. `next/font/google` fetches them while
 * building, and a failed fetch fails the build (two previews in one week).
 * The faces live in `src/fonts` and load through `next/font/local`.
 */
function sources(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sources(full, out);
    else if (/\.(ts|tsx|css)$/.test(entry.name) && !full.includes('__tests__')) out.push(full);
  }
  return out;
}

describe('fonts', () => {
  const src = path.join(process.cwd(), 'src');

  it('are not fetched from Google at build time', () => {
    const offenders = sources(src).filter((file) =>
      /from ['"]next\/font\/google['"]|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(fs.readFileSync(file, 'utf8')),
    );
    expect(offenders.map((f) => path.relative(src, f))).toEqual([]);
  });

  it('every file the font module names is in the repository, with its licence', () => {
    const fontModule = fs.readFileSync(path.join(src, 'lib', 'fonts.ts'), 'utf8');
    const files = [...fontModule.matchAll(/src: '\.\.\/fonts\/([^']+)'/g)].map((m) => m[1]);
    expect(files.length).toBe(2);
    for (const file of files) {
      const bytes = fs.readFileSync(path.join(src, 'fonts', file));
      // "wOF2": a real WOFF2 file, not a placeholder or an error page.
      expect(bytes.subarray(0, 4).toString('latin1'), file).toBe('wOF2');
    }
    expect(fs.readdirSync(path.join(src, 'fonts')).filter((f) => f.startsWith('OFL-')).length).toBe(2);
  });
});
