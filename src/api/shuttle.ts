import { apiGet } from './client';
import type { ShuttleStatus } from '../types/wms';

export function fetchShuttleStatus(signal?: AbortSignal): Promise<ShuttleStatus> {
  return apiGet<ShuttleStatus>('/api/shuttle/', signal ? { signal } : {});
}
