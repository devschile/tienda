// Entry point del admin — Refine sin routerProvider propio
// (el BrowserRouter ya existe en src/main.tsx; usar dos routers anidados rompe React Router v6)
import { Refine } from '@refinedev/core';
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
      // Sin routerProvider: @refinedev/react-router inyecta un BrowserRouter
      // extra que rompe el router existente en main.tsx.
      // Navegación gestionada directamente con useNavigate/useLocation de react-router-dom.
      authProvider={stubAuthProvider}
      dataProvider={stubDataProvider}
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
