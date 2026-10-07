import { test, expect, type Page } from '@playwright/test';

/**
 * A page header's type must read over its Señal plate, whatever the plate.
 *
 * The first version laid the plate full-bleed behind the headline and intro;
 * measured this way, the intro fell to 1.3–3.3:1 and the industries headline
 * to 1.2:1. `PageHeader` now sets type and light side by side. A plate is
 * swapped by dropping a file in public/art, with no code change, so this is
 * the check that a new take cannot quietly put light back behind the words.
 *
 * Method: hide the text, screenshot exactly its box, and take the 98th
 * percentile luminance of what is behind it — near the worst pixel, not the
 * average, because one bright streak under a word is what a reader trips on.
 * The text colour is composited over that pixel, as the browser would.
 * Thresholds are WCAG AA: 3:1 for the headline (large text), 4.5:1 for the
 * intro.
 */
const PAGES = ['/en/work', '/en/industries', '/en/service-area', '/en/service-area/brownsville', '/en/service-area/edinburg'];
const WIDTHS = [390, 1440];

async function worstContrast(page: Page, selector: string): Promise<number> {
  const el = page.locator(selector).first();
  const box = await el.boundingBox();
  if (!box) throw new Error(`${selector} has no box`);
  const color = await el.evaluate((n: HTMLElement) => {
    const c = getComputedStyle(n).color;
    n.style.color = 'transparent';
    return c;
  });
  const png = (await page.screenshot({ clip: box })).toString('base64');
  await el.evaluate((n: HTMLElement) => { n.style.color = ''; });
  return page.evaluate(async ({ png, color }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);
    const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const lum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const px: [number, number, number, number][] = [];
    for (let i = 0; i < data.length; i += 4) px.push([lum(data[i], data[i + 1], data[i + 2]), data[i], data[i + 1], data[i + 2]]);
    px.sort((a, b) => a[0] - b[0]);
    const bg = px[Math.floor(px.length * 0.98)];
    const [r, g, b, a = 1] = color.match(/[\d.]+/g)!.map(Number);
    const text = [r, g, b].map((v, k) => a * v + (1 - a) * bg[k + 1]) as [number, number, number];
    return (lum(...text) + 0.05) / (bg[0] + 0.05);
  }, { png, color });
}

for (const width of WIDTHS) {
  for (const path of PAGES) {
    test(`header type reads over its plate: ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path, { waitUntil: 'networkidle' });
      // The plate is the point of the test: it must be there, and painted.
      const plate = page.locator('[data-page-header] img').first();
      await expect(plate).toBeVisible();
      await expect.poll(() => plate.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);

      expect(await worstContrast(page, '[data-page-header] h1')).toBeGreaterThanOrEqual(3);
      expect(await worstContrast(page, '[data-page-header] h1 + p')).toBeGreaterThanOrEqual(4.5);
    });
  }
}
