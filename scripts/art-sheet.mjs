#!/usr/bin/env node
/**
 * A contact sheet for a Señal run: one page, every slot, its four takes side
 * by side, so choosing is a single look instead of opening eighty files.
 *
 *     node scripts/art-sheet.mjs art/raw     # -> art/raw/index.html
 *
 * The images are referenced by relative path, so the page works straight out
 * of the downloaded artifact folder with nothing to serve. Takes are labelled
 * 1-4 exactly as the generator numbered them, which is the number a pick
 * names ("cta-band 3").
 */
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] ?? 'art/raw';
const files = readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
const slots = new Map();
for (const f of files) {
  const m = f.match(/^(.*?)(?:-(\d))?\.(png|jpe?g|webp)$/i);
  if (!m) continue;
  const [, name, take = '1'] = m;
  if (!slots.has(name)) slots.set(name, []);
  slots.get(name).push({ f, take });
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sections = [...slots].map(([name, takes]) => `
  <section>
    <h2>${esc(name)}</h2>
    <div class="takes">
      ${takes.map((t) => `<figure><a href="${esc(t.f)}"><img src="${esc(t.f)}" alt="${esc(name)} take ${t.take}" loading="lazy"></a><figcaption>${esc(name)} ${t.take}</figcaption></figure>`).join('\n      ')}
    </div>
  </section>`).join('\n');

writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Señal run — pick one per slot</title>
<style>
  body { margin: 0; padding: 24px; background: #0b0a18; color: #f3f0ff; font: 15px/1.5 system-ui, sans-serif; }
  h1 { font-size: 20px; margin: 0 0 4px; } p { color: #b9b2d6; margin: 0 0 24px; }
  section { margin-bottom: 36px; } h2 { font: 600 13px ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; color: #22d3ee; }
  .takes { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  figure { margin: 0; } img { width: 100%; display: block; border-radius: 8px; border: 1px solid #262340; }
  figcaption { font: 12px ui-monospace, monospace; color: #b9b2d6; margin-top: 4px; }
</style>
<h1>Señal run — pick one take per slot</h1>
<p>Greyscale masters; the brand tint is applied after you pick. Reply with the names under the ones you want, e.g. “cta-band 3, og-plate 1”.</p>
${sections}
`);
console.log(`${slots.size} slots, ${files.length} images -> ${path.join(dir, 'index.html')}`);
