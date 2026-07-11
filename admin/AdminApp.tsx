// Admin entry point — Phase 0: solo routing + layout
// Refine se incorpora en Phase 1 (auth) y Phase 2 (data hooks)
import { Routes, Route } from 'react-router-dom';

import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductListPage } from './pages/ProductListPage';
import { OrderListPage } from './pages/OrderListPage';
import { LoginPage } from './pages/LoginPage';

// Rutas RELATIVAS — AdminApp se monta bajo /admin/* en main.tsx
// React Router v6 resuelve desde el segmento padre, no desde la raíz
export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />

      {/* Layout compartido */}
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="orders" element={<OrderListPage />} />
      </Route>
    </Routes>
  );
}
