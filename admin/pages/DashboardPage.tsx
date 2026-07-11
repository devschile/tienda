import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { adminFetch } from '../utils/adminFetch';

interface DashboardData {
  orders_today: number;
  revenue_today: number;
  pending: number;
  low_stock: number;
  products: number;
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch<{ data: DashboardData }>('dashboard')
      .then((res) => setData(res.data))
      .catch(() => {
        /* silencioso — dev sin functions */
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: 'Pedidos hoy',
      value: loading ? '…' : String(data?.orders_today ?? '—'),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Ingresos hoy',
      value: loading ? '…' : data ? formatCLP(data.revenue_today) : '—',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pedidos pendientes',
      value: loading ? '…' : String(data?.pending ?? '—'),
      icon: LayoutDashboard,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Stock bajo (< 5)',
      value: loading ? '…' : String(data?.low_stock ?? '—'),
      icon: Package,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumen de la tienda</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Requiere <code className="bg-slate-100 px-1 rounded">npm run dev:functions</code> para datos
        reales.
      </p>
    </div>
  );
}
