import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { photoSlots, hasPhoto, photoSrc } from '../photos';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const locales = { en: read('en.json'), es: read('es.json') };

describe('photo slots', () => {
  it('has translated alt text for every slot before the photo arrives', () => {
    // Alt text is copy. Writing it up front means dropping in a file is the
    // only step later, and it can never ship with an empty alt.
    for (const [name, slot] of Object.entries(photoSlots)) {
      for (const [locale, messages] of Object.entries(locales)) {
        const alt = messages.photos.alt[slot.altKey];
        expect(typeof alt, `${locale} alt for ${name}`).toBe('string');
        expect(alt.trim().length, `${locale} alt for ${name}`).toBeGreaterThan(10);
      }
    }
  });

  it('describes the subject rather than naming the file', () => {
    for (const slot of Object.values(photoSlots)) {
      const alt = locales.en.photos.alt[slot.altKey];
      expect(alt).not.toMatch(/\.(jpg|png|webp)/i);
      expect(alt.toLowerCase()).not.toMatch(/^(image|photo|picture) of/);
    }
  });

  it('asks for a real aspect ratio and a web-sized file', () => {
    for (const [name, slot] of Object.entries(photoSlots)) {
      expect(slot.width, `${name} width`).toBeGreaterThan(0);
      expect(slot.height, `${name} height`).toBeGreaterThan(0);
      expect(slot.file, `${name} file`).toMatch(/\.(jpg|jpeg|png|webp)$/i);
    }
  });

  it('reports a slot as empty until its file exists', () => {
    // Guards the whole point of the design: no broken image, no placeholder.
    for (const [name, slot] of Object.entries(photoSlots)) {
      const onDisk = fs.existsSync(path.join(process.cwd(), 'public', 'photos', slot.file));
      expect(hasPhoto(name as keyof typeof photoSlots)).toBe(onDisk);
    }
  });

  it('builds a public path under /photos', () => {
    expect(photoSrc('founder')).toBe('/photos/dan-lopez.jpg');
  });
});
