export type UserRole = 'ADMIN' | 'AUDITOR' | 'TECHNICIAN';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface Pallet {
  id: number;
  pallet_number: string;
  barcode: string;
  item_name: string;
  quantity: number;
  location_code: string;
  loaded_at: string;
  loaded_by_username: string | null;
}

export interface StorageLocation {
  code: string;
  column: string;
  row: number;
  location_type: 'TRANSFER' | 'STORAGE';
  status: 'TRANSFER' | 'FREE' | 'OCCUPIED';
  pallet: Pallet | null;
}

export interface WarehouseSummary {
  total_storage: number;
  occupied_count: number;
  free_count: number;
}

export interface WarehouseStateResponse {
  summary: WarehouseSummary;
  locations: StorageLocation[];
}

export interface ShuttleStatus {
  identifier: string;
  status: string;
  battery_percentage: number;
  updated_at: string;
}

export interface OccupancyHistoryPoint {
  date: string;
  occupied_count: number;
  free_count: number;
}

export interface AuditorDashboardResponse {
  summary: WarehouseSummary & { utilization_percent: number };
  history: OccupancyHistoryPoint[];
  pallets: Pallet[];
}
