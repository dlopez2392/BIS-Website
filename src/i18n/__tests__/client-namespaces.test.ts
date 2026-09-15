import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CLIENT_NAMESPACES, clientMessages } from '../client-namespaces';

const SRC = path.join(process.cwd(), 'src');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : walk(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

/** Every `useTranslations('x.y')` in the app, as its top-level namespace. */
function namespacesReadByHook(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const file of walk(SRC)) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/useTranslations\(\s*'([^']+)'/g)) {
      const ns = m[1]!.split('.')[0]!;
      found.set(ns, [...(found.get(ns) ?? []), path.relative(SRC, file)]);
    }
  }
  return found;
}

describe('the client message payload', () => {
  /**
   * The load-bearing one. `useTranslations` reads from
   * NextIntlClientProvider, so it can run in the browser — and a namespace
   * the provider was never given does not fail the build. It throws in a real
   * visitor's browser, on a live marketing page, only on whichever page
   * renders that component.
   *
   * This is the drift that will actually happen: someone adds a client
   * component months from now, reaches for a namespace, and nothing tells
   * them. It tells them here instead.
   */
  it('provides every namespace any component reads with useTranslations', () => {
    for (const [ns, files] of namespacesReadByHook()) {
      expect(
        (CLIENT_NAMESPACES as readonly string[]).includes(ns),
        `"${ns}" is read by ${files.join(', ')} but is not in CLIENT_NAMESPACES — ` +
        `it would be undefined in the browser. Add it there.`,
      ).toBe(true);
    }
  });

  /**
   * The other direction, and the reason this file exists at all. A namespace
   * nobody reads with the hook is pure payload on every page view, so this
   * fails when one stops being needed rather than letting the list quietly
   * grow back into the whole catalogue.
   */
  it('ships nothing the client never reads', () => {
    const read = namespacesReadByHook();
    for (const ns of CLIENT_NAMESPACES) {
      expect(
        read.has(ns),
        `"${ns}" is in CLIENT_NAMESPACES but no component reads it with ` +
        `useTranslations — it is dead weight in every page's payload. Remove it.`,
      ).toBe(true);
    }
  });

  it('narrows the catalogue instead of copying it', () => {
    const full = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'messages', 'en.json'), 'utf8'),
    ) as Record<string, unknown>;
    const slim = clientMessages(full);

    expect(Object.keys(slim).sort()).toEqual([...CLIENT_NAMESPACES].sort());
    // The saving is the whole point, so assert it rather than trusting it:
    // measured at ~77KB -> ~18KB when this landed.
    const bytes = (o: unknown) => Buffer.byteLength(JSON.stringify(o));
    expect(bytes(slim)).toBeLessThan(bytes(full) / 2);
  });

  it('drops a namespace that is missing from a locale rather than emitting undefined', () => {
    expect(clientMessages({ nav: { a: 1 } })).toEqual({ nav: { a: 1 } });
    expect('chat' in clientMessages({ nav: {} })).toBe(false);
  });
});
