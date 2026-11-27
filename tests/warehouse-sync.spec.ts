import { expect, test } from '@playwright/test';

import { cleanupPallet } from './helpers/cleanup';
import { createUniqueSuffix, findFreeStorageSlot, loginAs } from './helpers/auth';

test('A1 is a transfer point and never offers pallet loading', async ({ page }) => {
  await loginAs(page, 'TECHNICIAN');

  const transferSlot = page.getByTestId('slot-A1');
  await expect(transferSlot).toHaveAttribute('aria-label', /transfer point/i);
  await transferSlot.click();

  const inspector = page.getByRole('complementary');
  await expect(inspector).toContainText('A1 is used for shuttle handoff');
  await expect(page.getByRole('button', { name: 'Load Pallet' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Unload Pallet' })).toHaveCount(0);
});

test('pallet load and unload sync across isolated sessions within five seconds', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  let locationCode: string | null = null;

  const suffix = createUniqueSuffix();
  const palletNumber = `PLT-E2E-${suffix}`;
  const barcode = `BC-E2E-${suffix}`;

  try {
    await loginAs(pageA, 'TECHNICIAN');
    await loginAs(pageB, 'AUDITOR');

    const freeSlot = await findFreeStorageSlot(pageA);
    locationCode = freeSlot.code;
    const sessionBSlot = pageB.getByTestId(`slot-${locationCode}`);
    await expect(sessionBSlot).toHaveAttribute('aria-label', /free storage slot/i);

    await freeSlot.button.click();
    await expect(pageA.getByLabel('Destination')).toHaveValue(locationCode);
    await pageA.getByLabel('Pallet Number').fill(palletNumber);
    await pageA.getByLabel('Barcode').fill(barcode);
    await pageA.getByLabel('Item Name').fill('Test Servo');
    await pageA.getByLabel('Quantity').fill('5');
    await pageA.getByRole('button', { name: 'Load Pallet' }).click();

    const sessionASlot = pageA.getByTestId(`slot-${locationCode}`);
    await expect(sessionASlot).toHaveAttribute(
      'aria-label',
      new RegExp(`occupied by ${palletNumber}`),
    );
    await expect(pageA.getByTestId('warehouse-success')).toContainText('loaded');

    await expect(sessionBSlot).toHaveAttribute(
      'aria-label',
      new RegExp(`occupied by ${palletNumber}`),
      { timeout: 5000 },
    );
    await sessionBSlot.click();
    const inspectorB = pageB.getByRole('complementary');
    await expect(inspectorB).toContainText(palletNumber);
    await expect(inspectorB).toContainText(barcode);
    await expect(inspectorB).toContainText('Test Servo');
    await expect(inspectorB).toContainText('5');

    await sessionASlot.click();
    await pageA.getByRole('button', { name: 'Unload Pallet' }).click();
    await expect(sessionASlot).toHaveAttribute('aria-label', /free storage slot/i);
    await expect(pageA.getByTestId('warehouse-success')).toContainText('unloaded');

    await expect(sessionBSlot).toHaveAttribute(
      'aria-label',
      /free storage slot/i,
      { timeout: 5000 },
    );
  } finally {
    try {
      if (locationCode) {
        await cleanupPallet(contextA, pageA, locationCode, palletNumber);
      }
    } finally {
      await Promise.all([contextA.close(), contextB.close()]);
    }
  }
});
