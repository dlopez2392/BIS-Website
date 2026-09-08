import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { Wordmark } from '../Wordmark';
import { business } from '@/lib/seo/business';
import { WORDMARK } from '@/lib/brand';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));

describe('Wordmark', () => {
  it('sets the initialism in caps', () => {
    const { container } = render(<Wordmark />);
    expect(container.textContent).toBe('BIS>');
  });

  it('announces the company name, not the two characters on screen', () => {
    render(<Wordmark />);
    expect(screen.getByLabelText(business.name)).toBeTruthy();
  });

  it('is spelled in exactly one file', () => {
    // The lowercase mark shipped for months because the string was written out
    // separately in the header, the footer, the OG share card and two email
    // templates — so fixing any one of them left the rest wrong. Five surfaces
    // render it five different ways; none of them may spell it again.
    const dir = path.join(process.cwd(), 'src');
    const source = path.join(dir, 'lib', 'brand.ts');
    const offenders: string[] = [];
    const walk = (p: string) => {
      for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
        const full = path.join(p, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name) && full !== source && !full.includes('__tests__')) {
          if (/\bbis(&gt;|>)/i.test(fs.readFileSync(full, 'utf8'))) offenders.push(path.relative(dir, full));
        }
      }
    };
    walk(dir);
    expect(offenders).toEqual([]);
  });

  it('is set in caps at the source', () => {
    expect(WORDMARK).toBe('BIS>');
  });

  it('capitalises BIS in the copyright line too, in both locales', () => {
    for (const f of ['en.json', 'es.json']) {
      expect(read(f).footer.rights, f).toContain('BIS.');
      expect(read(f).footer.rights, f).not.toMatch(/\bbis\./);
    }
  });
});
