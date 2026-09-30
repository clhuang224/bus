import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.test.ts',
  forbidOnly: Boolean(process.env.CI),
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 720 },
    geolocation: { latitude: 25.0599, longitude: 121.5397 },
    permissions: ['geolocation'],
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  webServer: {
    command:
      'pnpm --filter @bus/shared build && pnpm run build && pnpm exec vite preview --outDir build/client --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_API_BASE_URL: '',
      VITE_PROXY_API_BASE_URL: '/api/tdx',
      VITE_GA_ID: '',
    },
  },
})
