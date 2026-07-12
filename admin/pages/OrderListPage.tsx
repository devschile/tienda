import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Download, AlertTriangle } from 'lucide-react';
import { useAdminList } from '../hooks/useAdminData';
import { useRowSelection } from '../hooks/useRowSelection';
import { SelectCheckbox } from '../components/ui/SelectCheckbox';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge, STATUS_CONFIG } from '../components/orders/OrderDetailPanel';
import { OrderDetailPanel } from '../components/orders/OrderDetailPanel';
import { OrderSkeletonRow } from '../components/ui/TableSkeleton';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Order {
  id: string;
  status: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  shipping_city: string | null;
  shipping_region: string | null;
  items_count: number;
  notes: string | null;
  mp_payment_id: string | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const exportToCSV = (rows: Order[], label: string) => {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const hdrs = [
    '#Orden',
    'Cliente',
    'Email',
    'Total CLP',
    'Items',
    'Estado',
    'Fecha',
    'Ciudad',
    'Región',
    'Notas',
    'MP Payment ID',
  ];
  const lines = [
    hdrs.join(','),
    ...rows.map((o) =>
      [
        esc(o.id),
        esc(o.customer_name),
        esc(o.customer_email),
        o.total_amount,
        o.items_count,
        esc(o.status),
        esc(new Date(o.created_at).toLocaleString('es-CL', { hour12: false })),
        esc(o.shipping_city),
        esc(o.shipping_region),
        esc(o.notes),
        esc(o.mp_payment_id),
      ].join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Constantes ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: '', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'approved', label: 'Aprobados' },
  { key: 'pending_transfer', label: 'Transferencias' },
  { key: 'rejected', label: 'Rechazados' },
  { key: 'refunded', label: 'Reembolsados' },
  { key: 'cancelled', label: 'Cancelados' },
];

// ── Componente ────────────────────────────────────────────────────────────────
export function OrderListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const {
    data: orders = [],
    total = 0,
    pageSize = 15,
    loading,
    error,
    refetch,
  } = useAdminList<Order>('orders', { page, pageSize: 15, status: status || undefined });

  const sel = useRowSelection(orders);

  const handleTabChange = (s: string) => {
    setStatus(s);
    setPage(1);
    sel.clear();
  };
  const handlePageChange = (p: number) => {
    setPage(p);
    sel.clear();
  };

  const handleExport = useCallback(() => {
    const rows = sel.count > 0 ? orders.filter((o) => sel.selected.has(o.id)) : orders;
    const label = sel.count > 0 ? `${sel.count}-seleccionados` : status || 'todos';
    exportToCSV(rows, label);
  }, [sel, orders, status]);

  return (
    <div className="max-w-6xl">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Pedidos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} pedidos</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <Download className="h-4 w-4" />
          {sel.count > 0 ? `Exportar ${sel.count} seleccionados` : 'Exportar CSV'}
        </button>
      </div>

      {/* Tabs de estado */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {STATUS_TABS.map(({ key, label }) => {
          const cfg = key ? STATUS_CONFIG[key] : null;
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                status === key
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 w-10">
                <SelectCheckbox
                  checked={sel.allSelected}
                  indeterminate={sel.someSelected}
                  onChange={sel.toggleAll}
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                # Orden
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Cliente
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Items
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Estado
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Fecha
              </th>
              <th className="w-10" />
            </tr>
          </thead>

          <AnimatePresence mode="wait">
            {/* ── Skeleton ── */}
            {loading && (
              <motion.tbody key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <OrderSkeletonRow key={i} index={i} />
                ))}
              </motion.tbody>
            )}

            {/* ── Error ── */}
            {!loading && error && (
              <motion.tbody
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <AlertTriangle className="h-7 w-7 text-red-400" />
                      <p className="text-sm text-red-500 font-medium">{error}</p>
                    </motion.div>
                  </td>
                </tr>
              </motion.tbody>
            )}

            {/* ── Empty ── */}
            {!loading && !error && orders.length === 0 && (
              <motion.tbody
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0, y: 16 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', bounce: 0.45, delay: 0.1 }}
                      className="flex flex-col items-center gap-3 text-slate-400"
                    >
                      <ShoppingBag className="h-9 w-9" />
                      <p className="text-sm">Sin pedidos</p>
                    </motion.div>
                  </td>
                </tr>
              </motion.tbody>
            )}

            {/* ── Data ── */}
            {!loading && !error && orders.length > 0 && (
              <motion.tbody
                key={`data-${status}`}
                className="divide-y divide-slate-100"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {orders.map((o) => (
                  <motion.tr
                    key={o.id}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    className={`transition-colors ${sel.selected.has(o.id) ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3">
                      <SelectCheckbox
                        checked={sel.selected.has(o.id)}
                        onChange={() => sel.toggle(o.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-500">
                        {o.id.substring(0, 8)}…
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 line-clamp-1">{o.customer_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {o.customer_email}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      {formatCLP(o.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {o.items_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="pr-4 py-3 text-right">
                      <button
                        onClick={() => setDetailId(o.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Ver
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            )}
          </AnimatePresence>
        </table>

        {!loading && orders.length > 0 && (
          <motion.div
            className="px-4 pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Pagination page={page} pageSize={pageSize} total={total} onChange={handlePageChange} />
          </motion.div>
        )}
      </div>

      <OrderDetailPanel
        orderId={detailId}
        onClose={() => setDetailId(null)}
        onSaved={() => {
          setDetailId(null);
          refetch();
        }}
      />
    </div>
  );
}
