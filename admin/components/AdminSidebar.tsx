import { useLogout } from '@refinedev/core';
import { useLocation, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, LogOut, ChevronRight, Store } from 'lucide-react';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/products', label: 'Productos', icon: Package },
  { to: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
];

export function AdminSidebar() {
  const { mutate: logout } = useLogout();
  const location = useLocation();

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
            <Store className="h-4 w-4 text-slate-300" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">devsChile™</p>
            <p className="text-slate-500 text-xs mt-0.5">Panel Admin</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {isActive && <ChevronRight className="h-3 w-3 ml-auto text-slate-500" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700/60 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Store className="h-4 w-4 shrink-0" />
          Ver tienda
        </a>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
