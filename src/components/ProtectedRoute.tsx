import type { ReactNode } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/wms';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: ReactNode;
}

export function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="route-loading" role="status" aria-live="polite">
        <span className="loading-indicator" aria-hidden="true" />
        Restoring your session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <section className="access-denied" aria-labelledby="access-denied-title">
        <p className="page-eyebrow">RESTRICTED AREA</p>
        <h1 id="access-denied-title">Access Denied</h1>
        <p>Your account does not have permission to view this page.</p>
        <Link className="button button-secondary" to="/map">
          Return to warehouse map
        </Link>
      </section>
    );
  }

  return children ? children : <Outlet />;
}
