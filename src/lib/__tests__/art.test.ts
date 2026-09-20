import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { artSlots, artFor, artProps, hasArt } from '../art';
import brief from '../../../art/brief.json';

/**
 * The art slots keep the same contract as the photo and screenshot slots:
 * nothing renders until its file exists, and a file that exists must be the
 * size the slot declares — a mismatch is a squashed plate, not an error.
 */
describe('art slots', () => {
  it('names every file with a version, so the immutable /art cache can never serve a stale byte', () => {
    for (const [name, slot] of Object.entries(artSlots)) {
      expect(slot.file, name).toMatch(/^[a-z-]+\.\d+\.(webp|jpg)$/);
    }
  });

  it('reports a slot as empty until its file exists, and never returns props for an empty one', () => {
    for (const name of Object.keys(artSlots) as (keyof typeof artSlots)[]) {
      const onDisk = fs.existsSync(path.join(process.cwd(), 'public', 'art', artSlots[name].file));
      expect(hasArt(name), name).toBe(onDisk);
      expect(artProps(name) === undefined, name).toBe(!onDisk);
    }
    expect(artProps(undefined)).toBeUndefined();
  });

  it('ships every present file at exactly the size its slot declares', async () => {
    for (const [name, slot] of Object.entries(artSlots)) {
      const file = path.join(process.cwd(), 'public', 'art', slot.file);
      if (!fs.existsSync(file)) continue;
      const meta = await sharp(file).metadata();
      expect([meta.width, meta.height], name).toEqual([slot.width, slot.height]);
    }
  });

  it('has a generation job for every slot, so nothing can be added here without a prompt behind it', () => {
    const jobs = new Set((brief as { name: string }[]).map((j) => j.name));
    for (const [name, slot] of Object.entries(artSlots)) {
      const stem = slot.file.replace(/\.\d+\.(webp|jpg)$/, '');
      expect(jobs.has(stem), `${name} -> ${stem}`).toBe(true);
    }
  });

  it('looks a slot up by industry or city id', () => {
    expect(artFor('ind', 'legal')).toBe('indLegal');
    expect(artFor('city', 'mcallen')).toBe('cityMcallen');
    expect(artFor('service', 'ai')).toBe('serviceAi');
    expect(artFor('ind', 'nope')).toBeUndefined();
  });
});
