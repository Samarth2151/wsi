import { useEffect, useState, type FormEvent } from 'react';

import type { ManagedUser } from '../../api/users';
import type { UserRole } from '../../types/wms';

interface UserTableRowProps {
  user: ManagedUser;
  isSelf: boolean;
  isBusy: boolean;
  onChangeRole: (id: number, role: UserRole) => Promise<boolean>;
  onResetPassword: (id: number, password: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

const ROLES: UserRole[] = ['ADMIN', 'AUDITOR', 'TECHNICIAN'];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function UserTableRow({
  user,
  isSelf,
  isBusy,
  onChangeRole,
  onResetPassword,
  onDelete,
}: UserTableRowProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  useEffect(() => {
    setSelectedRole(user.role);
  }, [user.role]);

  const handleRoleSave = () => {
    if (selectedRole !== user.role) {
      void onChangeRole(user.id, selectedRole);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    setPasswordError(null);
    const succeeded = await onResetPassword(user.id, newPassword);
    if (succeeded) {
      setNewPassword('');
      setIsPasswordFormOpen(false);
    }
  };

  const roleCannotSave = selectedRole === user.role || (isSelf && selectedRole !== 'ADMIN');

  return (
    <tr data-testid={`user-row-${user.id}`}>
      <th className="admin-username-cell" scope="row">
        <span>{user.username}</span>
        {isSelf && <span className="you-badge">You</span>}
      </th>
      <td>
        <div className="role-edit-control">
          <label className="visually-hidden" htmlFor={`user-role-${user.id}`}>
            Role for {user.username}
          </label>
          <select
            data-testid={`role-select-${user.id}`}
            disabled={isBusy}
            id={`user-role-${user.id}`}
            onChange={(event) => setSelectedRole(event.target.value as UserRole)}
            value={selectedRole}
          >
            {ROLES.map((role) => (
              <option disabled={isSelf && role !== 'ADMIN'} key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button
            aria-label={`Save role for ${user.username}`}
            className="admin-small-button"
            data-testid={`save-role-${user.id}`}
            disabled={isBusy || roleCannotSave}
            onClick={handleRoleSave}
            type="button"
          >
            Save
          </button>
        </div>
      </td>
      <td>
        <span className={`user-status-badge ${user.is_active ? 'is-active' : 'is-inactive'}`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>{formatDate(user.date_joined)}</td>
      <td>
        <div className="user-row-actions">
          <button
            aria-expanded={isPasswordFormOpen}
            aria-label={`${isPasswordFormOpen ? 'Cancel password reset for' : 'Reset password for'} ${user.username}`}
            className="admin-small-button admin-small-button--quiet"
            data-testid={`reset-password-toggle-${user.id}`}
            disabled={isBusy}
            onClick={() => {
              setIsPasswordFormOpen((open) => !open);
              setPasswordError(null);
            }}
            type="button"
          >
            {isPasswordFormOpen ? 'Cancel reset' : 'Reset Password'}
          </button>
          {isSelf ? (
            <button
              aria-label="Deleting your own account is disabled"
              className="admin-small-button admin-small-button--danger"
              data-testid={`delete-user-${user.id}`}
              disabled
              type="button"
            >
              Delete
            </button>
          ) : (
            <button
              aria-label={`Delete ${user.username}`}
              className="admin-small-button admin-small-button--danger"
              data-testid={`delete-user-${user.id}`}
              disabled={isBusy}
              onClick={() => setIsDeleteConfirmationOpen(true)}
              type="button"
            >
              Delete
            </button>
          )}
        </div>

        {isPasswordFormOpen && (
          <form className="inline-reset-form" onSubmit={(event) => void handlePasswordSubmit(event)}>
            <label htmlFor={`user-password-${user.id}`}>New password for {user.username}</label>
            <input
              autoComplete="new-password"
              disabled={isBusy}
              id={`user-password-${user.id}`}
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
            {passwordError && <span className="inline-form-error" role="alert">{passwordError}</span>}
            <button className="admin-small-button" disabled={isBusy} type="submit">
              {isBusy ? 'Saving…' : 'Save Password'}
            </button>
          </form>
        )}

        {isDeleteConfirmationOpen && !isSelf && (
          <div className="delete-confirmation" role="group" aria-label={`Confirm deleting ${user.username}`}>
            <p>Delete {user.username}? This removes their account access.</p>
            <div>
              <button
                className="admin-small-button admin-small-button--danger"
                data-testid={`confirm-delete-user-${user.id}`}
                disabled={isBusy}
                onClick={() => void onDelete(user.id)}
                type="button"
              >
                Confirm Delete
              </button>
              <button
                className="admin-small-button admin-small-button--quiet"
                disabled={isBusy}
                onClick={() => setIsDeleteConfirmationOpen(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}
