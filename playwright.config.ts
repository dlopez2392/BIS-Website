import { defineConfig } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

// The dev server reads .env.local, but the test process does not — so specs
// that branch on a NEXT_PUBLIC_* flag saw undefined while the app saw 'true'.
// That mismatch made e2e/chat.spec.ts assert the wrong branch and made
// e2e/chat-context.spec.ts skip silently. Load the same env Next loads.
loadEnvConfig(process.cwd());

// .env.local is gitignored, so on a fresh clone (or any machine other than
// this one) NEXT_PUBLIC_AI_ENABLED is simply absent and both chat specs
// silently skip their real assertions — the exact class of bug the
// loadEnvConfig() call above just fixed. Set it explicitly, for both the
// server the specs talk to (webServer.env) and the test process reading it
// (process.env), so the specs always run rather than quietly no-op.
process.env.NEXT_PUBLIC_AI_ENABLED = 'true';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Playwright defaults webServer.env to process.env when omitted, and
    // process.env already carries the override set above — but the flag is
    // spelled out here too, explicitly, so it can never again depend on an
    // implicit default or a gitignored file.
    env: { ...process.env, NEXT_PUBLIC_AI_ENABLED: 'true' } as Record<string, string>,
  },
  use: { baseURL: 'http://localhost:3000' },
});
