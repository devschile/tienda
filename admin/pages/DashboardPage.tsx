import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, Package, Clock, AlertTriangle } from 'lucide-react';
import { adminFetch } from '../utils/adminFetch';

interface DashboardData {
  orders_count: number;
  approved_count: number;
  revenue: number;
  pending: number;
  low_stock: number;
  products: number;
  period: string;
}

type Period = 'today' | '7d' | '30d' | '6m' | 'all';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: '6m', label: '6 meses' },
  { key: 'all', label: 'Todo' },
];

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

export function DashboardPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetch<{ data: DashboardData }>(`dashboard?period=${period}`)
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  const val = (v: number | undefined) => (loading ? '…' : v !== undefined ? String(v) : '—');

  const stats = [
    {
      label: 'Pedidos',
      value: val(data?.orders_count),
      sub: data ? `${data.approved_count} aprobados` : undefined,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Ingresos',
      value: loading ? '…' : data ? formatCLP(data.revenue) : '—',
      sub: 'pagos aprobados',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pendientes de pago',
      value: val(data?.pending),
      sub: 'en todos los periodos',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Productos activos',
      value: val(data?.products),
      sub: data?.low_stock ? `${data.low_stock} con stock bajo` : undefined,
      icon: Package,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header + filtros de periodo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen de la tienda</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error} — ¿está corriendo{' '}
          <code className="bg-red-100 px-1 rounded">npm run dev:functions</code>?
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p
              className={`text-2xl font-bold text-slate-800 transition-opacity ${loading ? 'opacity-40' : ''}`}
            >
              {value}
            </p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Stock bajo */}
      {!loading && data && data.low_stock > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{data.low_stock}</strong> producto{data.low_stock > 1 ? 's' : ''} con menos de 5
            unidades en stock.{' '}
            <a href="/admin/products?filter=low_stock" className="underline font-medium">
              Ver productos
            </a>
          </span>
        </div>
      )}
    </div>
  );
}
