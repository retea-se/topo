// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const TestReporter = require('./scripts/test-reporter');

module.exports = defineConfig({
  testDir: './scripts',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['./scripts/test-reporter.js', { outputFile: 'exports/TEST_RUN_REPORT.md' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Console error gate: fail tests on JS errors/warnings
    actionTimeout: 30000,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: undefined, // We start services manually
});
