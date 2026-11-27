import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type { UserRole } from '../types/wms';

export interface ManagedUser {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  role?: UserRole;
  is_active?: boolean;
  password?: string;
}

export function fetchUsers(signal?: AbortSignal): Promise<ManagedUser[]> {
  return apiGet<ManagedUser[]>('/api/users/', signal ? { signal } : {});
}

export function createUser(payload: CreateUserPayload): Promise<ManagedUser> {
  return apiPost<ManagedUser, CreateUserPayload>('/api/users/', payload);
}

export function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<ManagedUser> {
  return apiPatch<ManagedUser, UpdateUserPayload>(`/api/users/${id}/`, payload);
}

export function deleteUser(id: number): Promise<void> {
  return apiDelete<void>(`/api/users/${id}/`);
}
