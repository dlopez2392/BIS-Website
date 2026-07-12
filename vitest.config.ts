import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    // next-intl's ESM build imports the bare specifier "next/navigation" (no
    // extension); this Next.js version's package.json has no "exports" map,
    // so when Vitest hands next-intl to Node's native ESM loader (as an
    // externalized SSR dep) resolution fails, even though webpack/Next's own
    // bundler tolerates it fine. Forcing it through Vite's own resolver (which
    // does find the extensionless file) fixes it.
    server: { deps: { inline: [/next-intl/] } },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
