import { defineConfig } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

// The dev server reads .env.local, but the test process does not — so specs
// that branch on a NEXT_PUBLIC_* flag saw undefined while the app saw 'true'.
// That mismatch made e2e/chat.spec.ts assert the wrong branch and made
// e2e/chat-context.spec.ts skip silently. Load the same env Next loads.
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: './e2e',
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 120_000 },
  use: { baseURL: 'http://localhost:3000' },
});
