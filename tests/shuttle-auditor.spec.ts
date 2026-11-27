import { expect, test } from '@playwright/test';

import { loginAs } from './helpers/auth';

test('technicians can read shuttle identifier, status, battery, and timestamp', async ({ page }) => {
  await loginAs(page, 'TECHNICIAN');
  await page.getByRole('link', { name: 'Shuttle Status' }).click();

  await expect(page.getByRole('heading', { name: 'SHUTTLE-01' })).toBeVisible();
  await expect(page.locator('.shuttle-status-badge')).toContainText(
    /^(IDLE|ACTIVE|CHARGING|MAINTENANCE)$/,
  );
  await expect(page.locator('.shuttle-battery-heading strong')).toHaveText(/^\d+%$/);
  await expect(page.getByText('Last telemetry update')).toBeVisible();
});

test('auditors can review occupancy, chart history, and search inventory', async ({ page }) => {
  await loginAs(page, 'AUDITOR');
  await page.getByRole('link', { name: 'Auditor Dashboard' }).click();

  const totalStorageCard = page.locator('.auditor-kpi-card').filter({
    hasText: 'Total Storage Slots',
  });
  await expect(totalStorageCard).toContainText('24');
  await expect(page.getByTestId('occupancy-chart')).toBeVisible();
  await expect(page.locator('.occupancy-data-table tbody tr')).toHaveCount(7);

  const inventoryTable = page.locator('.inventory-table');
  await expect(inventoryTable).toBeVisible();
  await expect(inventoryTable.getByRole('columnheader', { name: 'Pallet Number' })).toBeVisible();
  const inventoryRows = inventoryTable.locator('tbody tr');
  await expect(inventoryRows.first()).toBeVisible();

  const barcode = (await inventoryRows.first().locator('td').nth(1).innerText()).trim();
  const search = page.getByLabel('Search pallet number, barcode, item, or location');
  await search.fill(barcode);
  await expect(inventoryRows).toHaveCount(1);
  await expect(inventoryRows.first()).toContainText(barcode);

  await search.fill('e2e-no-match-occupancy-inventory');
  await expect(page.getByTestId('inventory-empty-state')).toHaveText(
    'No pallets match your search.',
  );
});
