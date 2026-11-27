import { expect, test } from '@playwright/test';

test('home page shows the warehouse app shell without browser errors', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Warehouse Management System' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Inventory status' }),
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
