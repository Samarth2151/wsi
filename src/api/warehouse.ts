import { apiGet, apiPost } from './client';
import type {
  Pallet,
  WarehouseStateResponse,
  WarehouseSummary,
} from '../types/wms';

export interface LoadPalletPayload {
  destination: string;
  pallet_number: string;
  barcode: string;
  item_name: string;
  quantity: number;
}

export interface UnloadPalletPayload {
  location: string;
}

interface LoadPalletResponse {
  pallet: Pallet;
  summary: WarehouseSummary;
}

export function fetchWarehouseState(
  signal?: AbortSignal,
): Promise<WarehouseStateResponse> {
  return apiGet<WarehouseStateResponse>(
    '/api/warehouse/',
    signal ? { signal } : {},
  );
}

export function loadPallet(
  payload: LoadPalletPayload,
): Promise<LoadPalletResponse> {
  return apiPost<LoadPalletResponse, LoadPalletPayload>(
    '/api/warehouse/load/',
    payload,
  );
}

export function unloadPallet(
  payload: UnloadPalletPayload,
): Promise<unknown> {
  return apiPost<unknown, UnloadPalletPayload>(
    '/api/warehouse/unload/',
    payload,
  );
}
