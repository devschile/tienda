import { Store } from 'lucide-react';

// Placeholder — reemplazado en Phase 1 con lógica real de auth
export function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 mb-4">
            <Store className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Tienda devsChile™</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-colors"
              placeholder="admin@devschile.cl"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <input
              type="password"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-colors"
              placeholder="••••••••"
              disabled
            />
          </div>
          <button
            disabled
            className="w-full py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
          >
            Iniciar sesión — Phase 1
          </button>
        </div>
      </div>
    </div>
  );
}
