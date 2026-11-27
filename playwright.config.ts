import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile:
          process.env.PLAYWRIGHT_JSON_OUTPUT_FILE || 'test-results/results.json',
      },
    ],
  ],
  use: {
    baseURL:
      process.env.UI_BASE_URL ||
      process.env.BASE_URL ||
      'http://127.0.0.1:5173',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
