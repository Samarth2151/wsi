import type { BrowserContext, Page } from '@playwright/test';

import type { ManagedUser } from '../../src/api/users';
import type { WarehouseStateResponse } from '../../src/types/wms';

const ACCESS_TOKEN_KEY = 'wms_access_token';

export function getTestApiBaseUrl(): string {
  const configuredUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL;
  const uiBaseUrl = process.env.UI_BASE_URL?.replace(/\/+$/, '');
  const inferredUrl =
    uiBaseUrl === 'https://wsi-wine.vercel.app'
      ? 'https://wms-api-y8iy.onrender.com'
      : 'http://127.0.0.1:8000';

  const apiBaseUrl = configuredUrl || inferredUrl;
  return apiBaseUrl.replace(/\/+$/, '');
}

async function getAuthorizationHeaders(page: Page): Promise<Record<string, string>> {
  const token = await page.evaluate((key) => window.localStorage.getItem(key), ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Cannot clean up test data without an authenticated session.');
  return { Authorization: `Bearer ${token}` };
}

export async function cleanupPallet(
  context: BrowserContext,
  page: Page,
  locationCode: string,
  palletNumber: string,
): Promise<void> {
  const headers = await getAuthorizationHeaders(page);
  const stateResponse = await context.request.get(
    `${getTestApiBaseUrl()}/api/warehouse/`,
    { headers, timeout: 5000 },
  );
  if (!stateResponse.ok()) {
    throw new Error(`Could not inspect warehouse state during cleanup (${stateResponse.status()}).`);
  }

  const state = (await stateResponse.json()) as WarehouseStateResponse;
  const location = state.locations.find((item) => item.code === locationCode);
  if (location?.pallet?.pallet_number !== palletNumber) return;

  const unloadResponse = await context.request.post(
    `${getTestApiBaseUrl()}/api/warehouse/unload/`,
    {
      data: { location: locationCode },
      headers,
      timeout: 5000,
    },
  );
  if (!unloadResponse.ok()) {
    throw new Error(`Could not remove test pallet during cleanup (${unloadResponse.status()}).`);
  }
}

function isManagedUser(value: unknown): value is ManagedUser {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.username === 'string' &&
    (candidate.role === 'ADMIN' || candidate.role === 'AUDITOR' || candidate.role === 'TECHNICIAN') &&
    typeof candidate.is_active === 'boolean' &&
    typeof candidate.date_joined === 'string'
  );
}

export async function cleanupUser(
  context: BrowserContext,
  page: Page,
  username: string,
): Promise<void> {
  const headers = await getAuthorizationHeaders(page);
  const listResponse = await context.request.get(`${getTestApiBaseUrl()}/api/users/`, {
    headers,
    timeout: 5000,
  });
  if (!listResponse.ok()) {
    throw new Error(`Could not inspect users during cleanup (${listResponse.status()}).`);
  }

  const payload: unknown = await listResponse.json();
  if (!Array.isArray(payload) || !payload.every(isManagedUser)) {
    throw new Error('The user list response was invalid during test cleanup.');
  }

  const target = payload.find((item) => item.username === username);
  if (!target) return;

  const deleteResponse = await context.request.delete(
    `${getTestApiBaseUrl()}/api/users/${target.id}/`,
    { headers, timeout: 5000 },
  );
  if (!deleteResponse.ok() && deleteResponse.status() !== 404) {
    throw new Error(`Could not remove test user during cleanup (${deleteResponse.status()}).`);
  }
}
