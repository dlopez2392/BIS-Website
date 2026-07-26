import { test, expect } from '@playwright/test';

test('the widget posts locale and the locale-prefixed path', async ({ page }) => {
  // In-test guard, matching e2e/chat.spec.ts. Do NOT hoist this to file scope:
  // the (condition, description) form of test.skip is only valid inside a test
  // or a describe block; at module scope Playwright throws.
  test.skip(process.env.NEXT_PUBLIC_AI_ENABLED !== 'true', 'assistant disabled');

  let body: { locale?: string; path?: string; messages?: unknown[] } | undefined;

  await page.route('**/api/chat', async (route) => {
    body = route.request().postDataJSON();
    // Empty stream: the assertion is about the request, not the reply.
    await route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: '' });
  });

  await page.goto('/es/capabilities');
  await page.getByTestId('chat-launcher').click();
  await page.getByTestId('chat-input').fill('hola');
  await page.getByTestId('chat-input').press('Enter');

  await expect.poll(() => body?.locale, { timeout: 10_000 }).toBe('es');
  expect(body?.path).toBe('/es/capabilities');
  expect(Array.isArray(body?.messages)).toBe(true);
});
