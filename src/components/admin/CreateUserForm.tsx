import { useState, type FormEvent } from 'react';

import type { CreateUserPayload } from '../../api/users';
import type { UserRole } from '../../types/wms';

interface CreateUserFormProps {
  isSubmitting: boolean;
  serverError: string | null;
  onCreate: (payload: CreateUserPayload) => Promise<boolean>;
}

const ROLES: UserRole[] = ['ADMIN', 'AUDITOR', 'TECHNICIAN'];

export function CreateUserForm({
  isSubmitting,
  serverError,
  onCreate,
}: CreateUserFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('AUDITOR');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setValidationError('Enter a username.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    setValidationError(null);
    const succeeded = await onCreate({
      username: trimmedUsername,
      password,
      role,
    });

    if (succeeded) {
      setUsername('');
      setPassword('');
      setRole('AUDITOR');
    }
  };

  const errorMessage = validationError ?? serverError;

  return (
    <section className="admin-panel" aria-labelledby="create-user-title">
      <div className="admin-panel-heading">
        <div>
          <p className="section-eyebrow">NEW ACCOUNT</p>
          <h2 id="create-user-title">Create a user</h2>
        </div>
      </div>
      <form className="create-user-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="form-field">
          <label htmlFor="new-user-username">Username</label>
          <input
            autoComplete="off"
            disabled={isSubmitting}
            id="new-user-username"
            maxLength={150}
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
        </div>
        <div className="form-field">
          <label htmlFor="new-user-password">Password</label>
          <input
            autoComplete="new-password"
            disabled={isSubmitting}
            id="new-user-password"
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
        <div className="form-field">
          <label htmlFor="new-user-role">Role</label>
          <select
            disabled={isSubmitting}
            id="new-user-role"
            name="role"
            onChange={(event) => setRole(event.target.value as UserRole)}
            value={role}
          >
            {ROLES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <button
          className="admin-primary-button"
          data-testid="create-user-submit"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Creating…' : 'Create User'}
        </button>
        {errorMessage && (
          <p className="data-error-banner create-user-error" role="alert">
            {errorMessage}
          </p>
        )}
      </form>
    </section>
  );
}
