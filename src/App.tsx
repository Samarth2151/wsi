import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AuditorPage } from './pages/AuditorPage';
import { LoginPage } from './pages/LoginPage';
import { MapPage } from './pages/MapPage';
import { ShuttlePage } from './pages/ShuttlePage';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/map" element={<MapPage />} />
              <Route path="/shuttle" element={<ShuttlePage />} />
              <Route
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'AUDITOR']} />
                }
              >
                <Route path="/auditor" element={<AuditorPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
