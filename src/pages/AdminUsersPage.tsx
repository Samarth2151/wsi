import { useCallback, useRef, useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';

import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
  type CreateUserPayload,
} from '../api/users';
import { CreateUserForm } from '../components/admin/CreateUserForm';
import { UserTableRow } from '../components/admin/UserTableRow';
import { PageHeading } from '../components/PageHeading';
import { useAbortableResource } from '../hooks/useAbortableResource';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/wms';
import { ApiError } from '../api/client';
import '../styles/data-pages.css';

function getActionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldMessages = Object.entries(error.fields).flatMap(([field, messages]) =>
      messages.map((message) => `${field}: ${message}`),
    );
    return [error.message, ...fieldMessages].join(' ');
  }
  return error instanceof Error
    ? error.message
    : 'The user management action could not be completed. Please try again.';
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, error, isLoading, isRefreshing, refresh } =
    useAbortableResource(fetchUsers);
  const [isMutating, setIsMutating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mutationInFlightRef = useRef(false);

  const runUserMutation = useCallback(
    async (
      request: () => Promise<unknown>,
      successText: string,
      errorTarget: 'create' | 'actions' = 'actions',
    ): Promise<boolean> => {
      if (mutationInFlightRef.current) return false;
      mutationInFlightRef.current = true;
      setIsMutating(true);
      setCreateError(null);
      setActionError(null);
      setSuccessMessage(null);

      try {
        await request();
        await refresh();
        setSuccessMessage(successText);
        return true;
      } catch (requestError: unknown) {
        const message = getActionErrorMessage(requestError);
        if (errorTarget === 'create') setCreateError(message);
        else setActionError(message);
        return false;
      } finally {
        mutationInFlightRef.current = false;
        setIsMutating(false);
      }
    },
    [refresh],
  );

  const handleCreateUser = useCallback(
    (payload: CreateUserPayload) =>
      runUserMutation(
        () => createUser(payload),
        `User ${payload.username} created successfully.`,
        'create',
      ),
    [runUserMutation],
  );

  const handleChangeRole = useCallback(
    (id: number, role: UserRole) =>
      runUserMutation(
        () => updateUser(id, { role }),
        `User role updated to ${role}.`,
      ),
    [runUserMutation],
  );

  const handleResetPassword = useCallback(
    (id: number, password: string) =>
      runUserMutation(
        () => updateUser(id, { password }),
        'Password reset successfully.',
      ),
    [runUserMutation],
  );

  const handleDeleteUser = useCallback(
    (id: number) => {
      const target = users?.find((managedUser) => managedUser.id === id);
      return runUserMutation(
        () => deleteUser(id),
        target ? `User ${target.username} deleted.` : 'User deleted.',
      );
    },
    [runUserMutation, users],
  );

  return (
    <div className="page-stack data-page admin-users-page">
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="User Management"
        description="Create accounts and manage roles for your warehouse team."
      />

      <div className="data-page-toolbar">
        <p className="data-page-caption">
          {users ? `${users.length} registered users` : 'Manage warehouse access'}
        </p>
        <button
          aria-label="Refresh user list"
          className="data-refresh-button"
          data-testid="users-refresh"
          disabled={isLoading || isRefreshing || isMutating}
          onClick={() => void refresh()}
          type="button"
        >
          <RefreshCw size={15} aria-hidden="true" />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <p className="data-error-banner" data-testid="users-load-error" role="alert">
          {error}
        </p>
      )}
      {actionError && (
        <p className="data-error-banner" data-testid="users-action-error" role="alert">
          {actionError}
        </p>
      )}
      {successMessage && (
        <p className="data-success-banner" data-testid="users-success" role="status">
          {successMessage}
        </p>
      )}

      <CreateUserForm
        isSubmitting={isMutating}
        onCreate={handleCreateUser}
        serverError={createError}
      />

      <section className="admin-panel" aria-labelledby="users-list-title">
        <div className="admin-panel-heading">
          <div>
            <p className="section-eyebrow">TEAM ACCESS</p>
            <h2 id="users-list-title">Registered users</h2>
          </div>
          <Users size={20} aria-hidden="true" />
        </div>

        {isLoading && !users ? (
          <div className="data-loading-panel" role="status" aria-live="polite">
            <span className="loading-indicator" aria-hidden="true" />
            Loading users…
          </div>
        ) : users && users.length > 0 ? (
          <div className="responsive-table-scroll" role="region" aria-label="Registered users table" tabIndex={0}>
            <table className="data-table admin-users-table">
              <thead>
                <tr>
                  <th scope="col">Username</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Date Joined</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((managedUser) => (
                  <UserTableRow
                    isBusy={isMutating}
                    isSelf={managedUser.id === currentUser?.id}
                    key={managedUser.id}
                    onChangeRole={handleChangeRole}
                    onDelete={handleDeleteUser}
                    onResetPassword={handleResetPassword}
                    user={managedUser}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : users ? (
          <p className="admin-empty-state">No users are registered.</p>
        ) : !error ? (
          <div className="data-loading-panel" role="status">Preparing user list…</div>
        ) : null}
      </section>
    </div>
  );
}
