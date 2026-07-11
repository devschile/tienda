// Entry point del admin — Refine + React Router integración
// Vive dentro del BrowserRouter existente en src/main.tsx
import { Refine } from '@refinedev/core';
import routerBindings from '@refinedev/react-router';
import { Routes, Route } from 'react-router-dom';

import { stubAuthProvider, stubDataProvider } from './providers/stubs';
import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductListPage } from './pages/ProductListPage';
import { OrderListPage } from './pages/OrderListPage';
import { LoginPage } from './pages/LoginPage';

export default function AdminApp() {
  return (
    <Refine
      routerProvider={routerBindings}
      authProvider={stubAuthProvider} // Phase 1: reemplazar con authProvider real
      dataProvider={stubDataProvider} // Phase 2: reemplazar con dataProvider real
      resources={[
        {
          name: 'products',
          meta: { label: 'Productos' },
          list: '/admin/products',
          edit: '/admin/products/:id/edit',
          show: '/admin/products/:id',
        },
        {
          name: 'orders',
          meta: { label: 'Pedidos' },
          list: '/admin/orders',
          show: '/admin/orders/:id',
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        disableTelemetry: true,
      }}
    >
      <Routes>
        {/* Login — fuera del layout */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin con layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="orders" element={<OrderListPage />} />
        </Route>
      </Routes>
    </Refine>
  );
}
