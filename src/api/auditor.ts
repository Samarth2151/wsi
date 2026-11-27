import { apiGet } from './client';
import type { AuditorDashboardResponse } from '../types/wms';

export function fetchAuditorDashboard(
  signal?: AbortSignal,
): Promise<AuditorDashboardResponse> {
  return apiGet<AuditorDashboardResponse>(
    '/api/auditor/dashboard/',
    signal ? { signal } : {},
  );
}
