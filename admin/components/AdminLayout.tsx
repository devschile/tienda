import { Outlet } from 'react-router-dom';
import type { AdminAuth } from '../hooks/useAdminAuth';
import { AdminSidebar } from './AdminSidebar';
import { User } from 'lucide-react';

interface Props {
  auth: AdminAuth;
}

export function AdminLayout({ auth }: Props) {
  return (
    <div className="fixed inset-0 flex font-sans overflow-hidden">
      <AdminSidebar onLogout={auth.logout} />

      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
        {/* Header */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-end">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <span>{auth.identity?.name ?? 'Admin'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
