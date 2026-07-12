import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShoppingBag, Package, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { adminFetch } from '../utils/adminFetch';
import { useAdminList } from '../hooks/useAdminData';
import { StatusBadge } from '../components/orders/OrderDetailPanel';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface DashboardData {
  orders_count: number;
  approved_count: number;
  revenue: number;
  pending: number;
  low_stock: number;
  products: number;
  period: string;
}
interface RecentOrder {
  id: string;
  status: string;
  total_amount: number;
  customer_name: string;
  created_at: string;
}
interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  cover_url: string | null;
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

const formatDate = (s: string) =>
  new Date(s).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

// ── Componente ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('today');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Últimos 5 pedidos y productos con stock bajo
  const { data: recentOrders = [] } = useAdminList<RecentOrder>('orders', { pageSize: 5, page: 1 });
  const { data: lowStockItems = [] } = useAdminList<LowStockProduct>('products', {
    pageSize: 5,
    low_stock: 'true',
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetch<{ data: DashboardData }>(`dashboard?period=${period}`)
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  const val = (v?: number) => (loading ? '…' : v !== undefined ? String(v) : '—');

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
    <div className="space-y-6 max-w-5xl">
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

      {/* Alert stock bajo */}
      {!loading && data && data.low_stock > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{data.low_stock}</strong> producto{data.low_stock > 1 ? 's' : ''} con stock
            bajo.{' '}
            <button
              onClick={() => navigate('/admin/products?filter=low_stock')}
              className="underline font-medium"
            >
              Ver productos
            </button>
          </span>
        </div>
      )}

      {/* Tablas inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Últimos pedidos */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Últimos pedidos</h2>
            <button
              onClick={() => navigate('/admin/orders')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Sin pedidos</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/orders')}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{o.customer_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <StatusBadge status={o.status} />
                    <span className="text-sm font-semibold text-slate-700">
                      {formatCLP(o.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock bajo */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">
              Stock bajo <span className="text-slate-400">(menos de 5)</span>
            </h2>
            <button
              onClick={() => navigate('/admin/products')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              ✓ Sin productos con stock bajo
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockItems.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/products')}
                >
                  {p.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
                  )}
                  <p className="flex-1 text-sm font-medium text-slate-700 truncate">{p.name}</p>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
