/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const buildEnv = process.env.BUILD_ENV || 'local';
const buildVersion = (process.env.BUILD_VERSION || 'local').replace(/^v/, '');
const googleOAuthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID ?? '';
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  base: '/codeplug-tool/',
  plugins: [react()],
  define: {
    __BUILD_ENV__: JSON.stringify(buildEnv),
    __BUILD_VERSION__: JSON.stringify(buildVersion),
    __GOOGLE_OAUTH_CLIENT_ID__: JSON.stringify(googleOAuthClientId),
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    reporters: isGitHubActions
      ? ['default', ['junit', { outputFile: 'test-results/junit.xml', addFileAttribute: true }]]
      : ['default'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/**/*.d.ts'],
      reporter: ['text', 'json-summary', 'lcov'],
    },
  },
});
