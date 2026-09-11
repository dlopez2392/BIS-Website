import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { photoSlots, hasPhoto, photoSrc } from '../photos';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const locales = { en: read('en.json'), es: read('es.json') };

/**
 * Reads a baseline or progressive JPEG's dimensions from its SOF marker.
 * A dependency-free reader, because the only thing needed here is two numbers.
 */
function jpegSize(buf: Buffer): { width: number; height: number } {
  let i = 2; // skip SOI
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    // SOF0..SOF3 and SOF5..SOF15 carry the frame header; skip DHT/DRI/etc.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error('not a JPEG this reader understands');
}

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

  it('ships each present file at the dimensions its slot declares', () => {
    // next/image takes width and height from the slot, not the file. If they
    // disagree the browser reserves the wrong box and the page shifts as the
    // image lands — a layout-shift bug that no other test here would catch.
    for (const [name, slot] of Object.entries(photoSlots)) {
      const file = path.join(process.cwd(), 'public', 'photos', slot.file);
      if (!fs.existsSync(file)) continue;
      const { width, height } = jpegSize(fs.readFileSync(file));
      expect(width, `${name} width on disk`).toBe(slot.width);
      expect(height, `${name} height on disk`).toBe(slot.height);
    }
  });

  it('carries no EXIF on a file that ships to the public web', () => {
    // Phone and camera files routinely embed GPS coordinates. A portrait on a
    // public page should not disclose where it was taken.
    for (const slot of Object.values(photoSlots)) {
      const file = path.join(process.cwd(), 'public', 'photos', slot.file);
      if (!fs.existsSync(file)) continue;
      const bytes = fs.readFileSync(file);
      expect(bytes.includes(Buffer.from('Exif\0\0', 'binary')), slot.file).toBe(false);
    }
  });
});
