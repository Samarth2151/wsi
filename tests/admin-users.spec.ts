import { expect, test } from '@playwright/test';

import { cleanupUser } from './helpers/cleanup';
import { createUniqueSuffix, getDemoCredentials, loginAs } from './helpers/auth';

test('administrators can create, update, reset, and delete a user safely', async ({
  context,
  page,
}) => {
  const username = `e2e_user_${createUniqueSuffix()}`;
  const initialPassword = `Initial-E2E-${createUniqueSuffix()}`;
  const resetPassword = `Reset-E2E-${createUniqueSuffix()}`;
  let authenticated = false;

  try {
    await loginAs(page, 'ADMIN');
    authenticated = true;
    await page.getByRole('link', { name: 'Users' }).click();

    const adminCredentials = getDemoCredentials('ADMIN');
    const ownRow = page
      .locator('.admin-users-table tbody tr')
      .filter({ hasText: adminCredentials.username });
    await expect(ownRow).toBeVisible();
    await expect(ownRow.getByText('You', { exact: true })).toBeVisible();
    await expect(
      ownRow.getByRole('button', { name: 'Deleting your own account is disabled' }),
    ).toBeDisabled();
    await expect(ownRow.locator('option[value="AUDITOR"]')).toBeDisabled();
    await expect(ownRow.locator('option[value="TECHNICIAN"]')).toBeDisabled();

    await page.getByLabel('Username', { exact: true }).fill(username);
    await page.getByLabel('Password', { exact: true }).fill(initialPassword);
    await page.getByLabel('Role', { exact: true }).selectOption('AUDITOR');

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/users/') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create User' }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);
    await expect(page.getByTestId('users-success')).toContainText(`${username} created`);

    const createdRow = page
      .locator('.admin-users-table tbody tr')
      .filter({ hasText: username });
    await expect(createdRow).toBeVisible();
    await expect(createdRow.getByLabel(`Role for ${username}`, { exact: true })).toHaveValue('AUDITOR');

    await createdRow.getByLabel(`Role for ${username}`, { exact: true }).selectOption('TECHNICIAN');
    await createdRow.getByRole('button', { name: `Save role for ${username}` }).click();
    await expect(page.getByTestId('users-success')).toContainText('updated to TECHNICIAN');
    await expect(createdRow.getByLabel(`Role for ${username}`, { exact: true })).toHaveValue('TECHNICIAN');

    await createdRow.getByRole('button', { name: `Reset password for ${username}` }).click();
    await page.getByLabel(`New password for ${username}`).fill(resetPassword);
    await createdRow.getByRole('button', { name: 'Save Password' }).click();
    await expect(page.getByTestId('users-success')).toHaveText('Password reset successfully.');

    await createdRow.getByRole('button', { name: `Delete ${username}` }).click();
    const confirmation = createdRow.getByRole('group', {
      name: `Confirm deleting ${username}`,
    });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Confirm Delete' }).click();
    await expect(createdRow).toHaveCount(0);
    await expect(page.getByTestId('users-success')).toContainText(`${username} deleted`);
  } finally {
    if (authenticated) {
      await cleanupUser(context, page, username);
    }
  }
});
