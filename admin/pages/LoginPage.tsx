import { useState, type FormEvent } from 'react';
import { Store, Loader2, AlertCircle } from 'lucide-react';
import type { AdminAuth } from '../hooks/useAdminAuth';
import { useAdminTitle } from '../hooks/useAdminTitle';

interface Props {
  auth: AdminAuth;
}

export function LoginPage({ auth }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useAdminTitle('Iniciar sesión');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await auth.login(email, password);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 mb-4">
            <Store className="h-6 w-6 text-slate-300" />
          </div>
          <h1 className="text-xl font-semibold text-white">Panel Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Tienda devsChile™</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {auth.error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{auth.error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 text-sm bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              placeholder="admin@devschile.cl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2.5 text-sm bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={auth.loading}
            className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {auth.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">Solo acceso autorizado</p>
      </div>
    </div>
  );
}
