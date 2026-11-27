import { expect, test } from '@playwright/test';

import { findFreeStorageSlot, loginAs } from './helpers/auth';

test('technicians see operational navigation and cannot open restricted routes', async ({ page }) => {
  await loginAs(page, 'TECHNICIAN');

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(navigation.getByRole('link', { name: 'Warehouse Map' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Shuttle Status' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Auditor Dashboard' })).toHaveCount(0);
  await expect(navigation.getByRole('link', { name: 'Users' })).toHaveCount(0);

  await page.goto('/auditor');
  await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
});

test('auditors can inspect slots read-only but cannot open user management', async ({ page }) => {
  await loginAs(page, 'AUDITOR');

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(navigation.getByRole('link', { name: 'Warehouse Map' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Shuttle Status' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Auditor Dashboard' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Users' })).toHaveCount(0);

  const occupiedSlot = page.getByRole('button', { name: /occupied by/i }).first();
  if (await occupiedSlot.count()) {
    await occupiedSlot.click();
    await expect(page.getByRole('complementary')).toContainText('Pallet Number');
  } else {
    const freeSlot = await findFreeStorageSlot(page);
    await freeSlot.button.click();
    await expect(page.getByText('Slot is currently free (read-only access)')).toBeVisible();
  }

  await expect(page.getByRole('button', { name: 'Load Pallet' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Unload Pallet' })).toHaveCount(0);

  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
});

test('administrators see all warehouse navigation links', async ({ page }) => {
  await loginAs(page, 'ADMIN');

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(navigation.getByRole('link', { name: 'Warehouse Map' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Shuttle Status' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Auditor Dashboard' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Users' })).toBeVisible();
});
