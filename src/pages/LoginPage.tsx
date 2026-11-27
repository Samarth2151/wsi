import { ArrowRight, Warehouse } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <main className="login-screen">
        <div className="route-loading" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          Checking your session…
        </div>
      </main>
    );
  }

  if (user) return <Navigate to="/map" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
      navigate('/map', { replace: true });
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Unable to sign in right now. Please try again.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="login-brand-mark" aria-hidden="true">
            <Warehouse size={23} strokeWidth={2.1} />
          </span>
          <span className="login-brand-name">WMS</span>
        </div>

        <p className="login-eyebrow">WAREHOUSE MANAGEMENT</p>
        <h1 id="login-title">Sign in to your workspace</h1>
        <p className="login-description">
          Use your warehouse account to continue to operations.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="form-error" role="alert" aria-live="polite">
              {errorMessage}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              autoComplete="username"
              autoCapitalize="none"
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              autoComplete="current-password"
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button
            className="button button-primary login-submit"
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
            {!isSubmitting && <ArrowRight size={17} aria-hidden="true" />}
          </button>
        </form>

        <p className="login-footer">Secure access for your warehouse team.</p>
      </section>
    </main>
  );
}
