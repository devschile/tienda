import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { User } from 'lucide-react';

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-end">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <span>Admin</span>
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
