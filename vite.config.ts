/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig(({ mode }) => {
  // Vite does not load `.env*` into process.env before this file runs — use loadEnv so
  // `.env.local` works for local dev (GH Actions injects GOOGLE_OAUTH_CLIENT_ID via env).
  const env = loadEnv(mode, process.cwd(), '');
  const buildEnv = env.BUILD_ENV || process.env.BUILD_ENV || 'local';
  const buildVersion = (env.BUILD_VERSION || process.env.BUILD_VERSION || 'local').replace(
    /^v/,
    '',
  );
  const googleOAuthClientId =
    env.GOOGLE_OAUTH_CLIENT_ID ?? process.env.GOOGLE_OAUTH_CLIENT_ID ?? '';

  return {
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
  };
});
