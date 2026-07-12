import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { capabilityGroups, expertiseIds } from '../capabilities';

const read = (f: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const en = read('en.json');
const es = read('es.json');

describe('capabilities data', () => {
  it('lists every product exactly once across all groups', () => {
    const all = capabilityGroups.flatMap((g) => g.items);
    const counts = new Map<string, number>();
    for (const x of all) counts.set(x, (counts.get(x) ?? 0) + 1);
    const dups = [...counts].filter(([, n]) => n > 1).map(([x]) => x);
    expect(dups).toEqual([]);
  });

  it('has an EN and ES heading for every group id', () => {
    for (const g of capabilityGroups) {
      expect(en.capabilities.groups[g.id], `en heading ${g.id}`).toBeTruthy();
      expect(es.capabilities.groups[g.id], `es heading ${g.id}`).toBeTruthy();
    }
  });

  it('has an EN and ES phrase for every expertise id', () => {
    for (const id of expertiseIds) {
      expect(en.capabilities.expertise[id], `en expertise ${id}`).toBeTruthy();
      expect(es.capabilities.expertise[id], `es expertise ${id}`).toBeTruthy();
    }
  });
});
