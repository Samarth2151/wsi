import { randomUUID } from 'node:crypto';
import { expect, type Locator, type Page } from '@playwright/test';

import type { UserRole } from '../../src/types/wms';

export type DemoRole = UserRole;

export interface DemoCredentials {
  username: string;
  password: string;
}

export interface FreeStorageSlot {
  code: string;
  button: Locator;
}

const ENVIRONMENT_KEYS: Record<DemoRole, { username: string; password: string }> = {
  ADMIN: {
    username: 'EVAL_ADMIN_USERNAME',
    password: 'EVAL_ADMIN_PASSWORD',
  },
  AUDITOR: {
    username: 'EVAL_AUDITOR_USERNAME',
    password: 'EVAL_AUDITOR_PASSWORD',
  },
  TECHNICIAN: {
    username: 'EVAL_TECHNICIAN_USERNAME',
    password: 'EVAL_TECHNICIAN_PASSWORD',
  },
};

// These local-only placeholders match wms-api/.env.example; evaluation runs should set EVAL_*.
const LOCAL_DEMO_DEFAULTS: Record<DemoRole, DemoCredentials> = {
  ADMIN: { username: 'demo_admin', password: 'replace-me-admin' },
  AUDITOR: { username: 'demo_auditor', password: 'replace-me-auditor' },
  TECHNICIAN: { username: 'demo_technician', password: 'replace-me-technician' },
};

export function getDemoCredentials(role: DemoRole): DemoCredentials {
  const keys = ENVIRONMENT_KEYS[role];
  const defaults = LOCAL_DEMO_DEFAULTS[role];

  return {
    username: process.env[keys.username]?.trim() || defaults.username,
    password: process.env[keys.password] || defaults.password,
  };
}

export function createUniqueSuffix(): string {
  return `${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export async function loginAs(page: Page, role: DemoRole): Promise<void> {
  const credentials = getDemoCredentials(role);

  await page.goto('/login');
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByRole('heading', { name: 'Warehouse Map' })).toBeVisible();
}

export async function findFreeStorageSlot(page: Page): Promise<FreeStorageSlot> {
  await expect(page.getByTestId('slot-A1')).toBeVisible();
  const button = page.getByRole('button', { name: /free storage slot/i }).first();
  await expect(button, 'The map should have a free storage slot.').toBeVisible();

  const testId = await button.getAttribute('data-testid');
  const code = testId?.replace(/^slot-/, '');
  if (!code || !/^(?:A[2-5]|[B-E][1-5])$/.test(code)) {
    throw new Error('The map did not expose a valid free storage slot from A2 through E5.');
  }

  return { code, button };
}
