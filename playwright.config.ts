import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  // eigener Port nur für die Tests, damit sie nie einen anderen Server erwischen
  use: { baseURL: 'http://localhost:5199' },
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    port: 5199,
    reuseExistingServer: false,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testMatch: /desktop\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['iPhone 13'] }, testMatch: /mobile\.spec\.ts/ },
  ],
})
