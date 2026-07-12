import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
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

// ── Skeletons ─────────────────────────────────────────────────────────────────
function Pulse({
  w,
  h = 'h-3.5',
  r = 'rounded',
  className = '',
}: {
  w: string;
  h?: string;
  r?: string;
  className?: string;
}) {
  return <div className={`bg-slate-200 animate-pulse ${w} ${h} ${r} ${className}`} />;
}

function StatCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={{ type: 'spring', bounce: 0.35, duration: 0.45 }}
      className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
    >
      <Pulse w="w-9" h="h-9" r="rounded-lg" />
      <Pulse w={['w-14', 'w-20', 'w-10', 'w-12'][index % 4]} h="h-7" />
      <div className="space-y-1.5">
        <Pulse w={['w-20', 'w-16', 'w-24', 'w-18'][index % 4]} h="h-2.5" />
        <Pulse w={['w-28', 'w-24', 'w-20', 'w-26'][index % 4]} h="h-2.5" />
      </div>
    </motion.div>
  );
}

function RecentOrderSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1 - index * 0.1, x: 0 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.38, delay: index * 0.055 }}
      className="flex items-center justify-between px-5 py-3 border-b border-slate-100 last:border-0"
    >
      <div className="space-y-1.5">
        <Pulse w={['w-28', 'w-32', 'w-24', 'w-36', 'w-28'][index % 5]} />
        <Pulse w="w-20" h="h-2.5" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Pulse w="w-20" h="h-5" r="rounded-full" />
        <Pulse w="w-16" />
      </div>
    </motion.div>
  );
}

function LowStockSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1 - index * 0.1, x: 0 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.38, delay: index * 0.055 }}
      className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 last:border-0"
    >
      <Pulse w="w-8" h="h-8" r="rounded-lg" className="shrink-0" />
      <Pulse w={['w-40', 'w-32', 'w-48', 'w-36', 'w-44'][index % 5]} className="flex-1" />
      <Pulse w="w-16" h="h-5" r="rounded-full" className="shrink-0" />
    </motion.div>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('today');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: recentOrders = [], loading: ordersLoading } = useAdminList<RecentOrder>('orders', {
    pageSize: 5,
    page: 1,
  });
  const { data: lowStockItems = [], loading: stockLoading } = useAdminList<LowStockProduct>(
    'products',
    { pageSize: 5, low_stock: 'true' },
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetch<{ data: DashboardData }>(`dashboard?period=${period}`)
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  const stats = [
    {
      label: 'Pedidos',
      value: data ? String(data.orders_count) : null,
      sub: data ? `${data.approved_count} aprobados` : null,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Ingresos',
      value: data ? formatCLP(data.revenue) : null,
      sub: 'pagos aprobados',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pendientes de pago',
      value: data ? String(data.pending) : null,
      sub: 'en todos los periodos',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Productos activos',
      value: data ? String(data.products) : null,
      sub: data?.low_stock ? `${data.low_stock} con stock bajo` : 'sin stock bajo',
      icon: Package,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header + filtros */}
      <motion.div
        className="flex flex-wrap items-center justify-between gap-3"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen de la tienda</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {PERIODS.map(({ key, label }) => (
            <motion.button
              key={key}
              onClick={() => setPeriod(key)}
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === key ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
            >
              {period === key && (
                <motion.div
                  layoutId="period-pill"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.35 }}
                />
              )}
              <span className="relative">{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error} — ¿está corriendo{' '}
              <code className="bg-red-100 px-1 rounded">npm run dev:functions</code>?
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats cards */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="stats-skeleton"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={`stats-${period}`}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
              <motion.div
                key={label}
                variants={{
                  hidden: { opacity: 0, y: 18, scale: 0.93 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>

                {/* Número — anima al cambiar de periodo */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={value}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.3 }}
                    className="text-2xl font-bold text-slate-800"
                  >
                    {value ?? '—'}
                  </motion.p>
                </AnimatePresence>

                <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert stock bajo */}
      <AnimatePresence>
        {!loading && data && data.low_stock > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            className="overflow-hidden"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tablas inferiores */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.5, delay: 0.15 }}
      >
        {/* Últimos pedidos */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Últimos pedidos</h2>
            <motion.button
              onClick={() => navigate('/admin/orders')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              whileHover={{ x: 2 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {ordersLoading ? (
              <motion.div key="orders-skel" exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <RecentOrderSkeleton key={i} index={i} />
                ))}
              </motion.div>
            ) : recentOrders.length === 0 ? (
              <motion.div
                key="orders-empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.4, delay: 0.05 }}
                className="flex flex-col items-center gap-2 py-10 text-slate-400"
              >
                <ShoppingBag className="h-7 w-7" />
                <p className="text-xs">Sin pedidos</p>
              </motion.div>
            ) : (
              <motion.div
                key="orders-data"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                className="divide-y divide-slate-100"
              >
                {recentOrders.map((o) => (
                  <motion.div
                    key={o.id}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate('/admin/orders')}
                    whileHover={{ x: 2 }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {o.customer_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(o.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <StatusBadge status={o.status} />
                      <span className="text-sm font-semibold text-slate-700">
                        {formatCLP(o.total_amount)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stock bajo */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">
              Stock bajo <span className="text-slate-400">(menos de 5)</span>
            </h2>
            <motion.button
              onClick={() => navigate('/admin/products')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              whileHover={{ x: 2 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {stockLoading ? (
              <motion.div key="stock-skel" exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <LowStockSkeleton key={i} index={i} />
                ))}
              </motion.div>
            ) : lowStockItems.length === 0 ? (
              <motion.div
                key="stock-empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.4, delay: 0.05 }}
                className="flex flex-col items-center gap-2 py-10 text-slate-400"
              >
                <CheckCircle2 className="h-7 w-7 text-green-400" />
                <p className="text-xs">Sin productos con stock bajo</p>
              </motion.div>
            ) : (
              <motion.div
                key="stock-data"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                className="divide-y divide-slate-100"
              >
                {lowStockItems.map((p) => (
                  <motion.div
                    key={p.id}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate('/admin/products')}
                    whileHover={{ x: 2 }}
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
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
