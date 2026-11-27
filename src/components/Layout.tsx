import { Outlet } from 'react-router-dom';

import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="workspace-layout">
      <Navbar />
      <main className="page-content">
        <Outlet />
      </main>
      <footer className="app-footer">
        <span>Warehouse operations</span>
        <span>Built for the people who keep things moving.</span>
      </footer>
    </div>
  );
}
