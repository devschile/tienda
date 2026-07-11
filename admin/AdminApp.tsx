import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './hooks/useAdminAuth';
import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductListPage } from './pages/ProductListPage';
import { OrderListPage } from './pages/OrderListPage';
import { LoginPage } from './pages/LoginPage';

export default function AdminApp() {
  const auth = useAdminAuth();

  return (
    <Routes>
      <Route
        path="login"
        element={
          auth.isAuthenticated ? <Navigate to="/admin" replace /> : <LoginPage auth={auth} />
        }
      />

      {/* Rutas protegidas */}
      {auth.isAuthenticated ? (
        <Route element={<AdminLayout auth={auth} />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="orders" element={<OrderListPage />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      )}
    </Routes>
  );
}
