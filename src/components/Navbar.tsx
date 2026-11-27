import { LogOut, Menu, Warehouse, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/wms';

interface NavigationItem {
  label: string;
  to: string;
  allowedRoles?: UserRole[];
}

const navigationItems: NavigationItem[] = [
  { label: 'Warehouse Map', to: '/map' },
  { label: 'Shuttle Status', to: '/shuttle' },
  {
    label: 'Auditor Dashboard',
    to: '/auditor',
    allowedRoles: ['ADMIN', 'AUDITOR'],
  },
  { label: 'Users', to: '/admin/users', allowedRoles: ['ADMIN'] },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null;

  const visibleItems = navigationItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(user.role),
  );

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <header className="site-header">
      <div className="navbar-inner">
        <NavLink className="brand" to="/map" aria-label="WMS warehouse home">
          <span className="brand-mark" aria-hidden="true">
            <Warehouse size={20} strokeWidth={2.2} />
          </span>
          <span className="brand-copy">
            <span className="brand-title">WMS</span>
            <span className="brand-subtitle">Warehouse Management</span>
          </span>
        </NavLink>

        <button
          className="mobile-menu-button"
          type="button"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>

        <nav
          className="primary-navigation"
          id="primary-navigation"
          aria-label="Primary navigation"
          data-open={isMenuOpen}
        >
          {visibleItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive ? 'navigation-link is-active' : 'navigation-link'
              }
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div
          className="account-controls"
          role="group"
          aria-label="Account controls"
        >
          <div className="account-identity">
            <span className="account-username">{user.username}</span>
            <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>
              {user.role}
            </span>
          </div>
          <button className="logout-button" type="button" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
