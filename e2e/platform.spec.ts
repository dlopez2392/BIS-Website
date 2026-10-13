import { test, expect } from '@playwright/test';

/**
 * The /platform tour told as one story (TourStory). On a wide screen one
 * frame stays pinned and follows the step being read; on a phone the page is
 * the plain stack of words and captures it always was.
 */
test.describe('wide', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('one pinned frame follows the step being read', async ({ page }) => {
    await page.goto('/en/platform');
    const story = page.locator('[data-tour]');
    await expect(story).toHaveAttribute('data-live', 'true');
    const label = story.locator('.tour-label');

    // The inline captures step aside for the frame.
    await expect(story.locator('.tour-inline').first()).toBeHidden();
    await expect(story.locator('.tour-frame')).toBeVisible();

    await page.locator('#pipeline h2').scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const el = document.getElementById('pipeline')!;
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + el.offsetHeight / 2);
    });
    await expect(label).toHaveText('Every lead, one board');
    await expect(story.locator('.tour-count')).toHaveText('3 / 5');
    // The frame stayed on screen while the words moved under it.
    const box = (await story.locator('.tour-frame').boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(900);

    await page.evaluate(() => {
      const el = document.getElementById('report')!;
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + el.offsetHeight / 2);
    });
    await expect(label).toHaveText('Your phone, Monday at 8');
    // The customer-side captures are drawn on a phone, and never zoomed: a
    // zoom would crop the bezel that says whose phone it is.
    const layer = story.locator('.tour-layer[data-active]');
    await expect(layer.locator('[data-phone] img')).toBeVisible();
    expect(await layer.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  });

  test('says it is a sample on the frame itself', async ({ page }) => {
    await page.goto('/en/platform');
    await expect(page.locator('.tour-frame figcaption')).toHaveText('Sample account — invented company and data.');
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('no frame: every step carries its own capture', async ({ page }) => {
    await page.goto('/en/platform');
    await expect(page.locator('.tour-frame')).toBeHidden();
    const inline = page.locator('[data-tour-step] .tour-inline img');
    await expect(inline).toHaveCount(5);
    await inline.nth(2).scrollIntoViewIfNeeded();
    await expect(inline.nth(2)).toBeVisible();
  });

  test('the booking page and the report are on a phone, named for whose it is', async ({ page }) => {
    await page.goto('/en/platform');
    for (const [id, name] of [['booking', "Your customer's phone"], ['report', 'Your phone, Monday at 8']]) {
      const step = page.locator(`#${id} .tour-inline`);
      await step.scrollIntoViewIfNeeded();
      await expect(step.locator('[data-phone] img'), id).toBeVisible();
      await expect(step.locator('.phone-label'), id).toHaveText(name);
      // The phone fits the panel across: the page must not scroll sideways.
      const box = (await step.locator('[data-phone]').boundingBox())!;
      expect(box.x, id).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, id).toBeLessThanOrEqual(390);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
