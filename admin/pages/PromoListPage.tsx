import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Ticket, Plus, AlertTriangle, Archive, ArchiveRestore } from 'lucide-react';
import { useAdminList, useAdminMutation } from '../hooks/useAdminData';
import { useRowSelection } from '../hooks/useRowSelection';
import { SelectCheckbox } from '../components/ui/SelectCheckbox';
import { Toggle } from '../components/ui/Toggle';
import { ExportCSVButton, BulkArchiveButtons } from '../components/ui/BulkActionButtons';
import { Pagination } from '../components/ui/Pagination';
import { CouponEditPanel, type Coupon } from '../components/promos/CouponEditPanel';
import { PromoSkeletonRow } from '../components/ui/TableSkeleton';

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

const formatDate = (s: string | null | undefined) => {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '—';
  }
};

const TYPE_BADGES: Record<Coupon['discount_type'], { label: string; cls: string }> = {
  percent: { label: '%', cls: 'bg-violet-100 text-violet-700' },
  fixed: { label: '$', cls: 'bg-sky-100 text-sky-700' },
  shipping: { label: '🚚', cls: 'bg-emerald-100 text-emerald-700' },
};

const discountLabel = (c: Coupon) => {
  if (c.discount_type === 'percent') return `${c.discount_value}%`;
  if (c.discount_type === 'shipping') return 'Envío gratis';
  return formatCLP(c.discount_value);
};

type FilterKey = 'all' | 'active' | 'inactive' | 'archived';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: '✅ Activos' },
  { key: 'inactive', label: '⏸️ Inactivos' },
  { key: 'archived', label: '📦 Archivados' },
];

const exportCouponsToCSV = (rows: Coupon[], label: string) => {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = [
    'Código',
    'Descripción',
    'Tipo',
    'Valor',
    'Subtotal mínimo',
    'Tope máx',
    'Inicio',
    'Expira',
    'Usos',
    'Máx usos',
    'Activo',
  ];
  const lines = [
    headers.join(','),
    ...rows.map((c) =>
      [
        esc(c.code),
        esc(c.description),
        esc(c.discount_type),
        c.discount_value,
        c.min_subtotal,
        c.max_discount ?? '',
        esc(c.starts_at ?? ''),
        esc(c.expires_at ?? ''),
        c.uses_count,
        c.max_uses ?? '',
        c.active,
      ].join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `codigos-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export function PromoListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const params = {
    page,
    pageSize: 15,
    search: search || undefined,
    active: filter === 'active' ? 'true' : filter === 'inactive' ? 'false' : undefined,
    archived: filter === 'archived' ? 'true' : undefined,
  };

  const {
    data: coupons = [],
    total = 0,
    pageSize = 15,
    loading,
    error,
    refetch,
  } = useAdminList<Coupon>('coupons', params);

  const { update } = useAdminMutation<Coupon>('coupons');
  const sel = useRowSelection(coupons);

  const handleFilterChange = (key: FilterKey) => {
    setFilter(key);
    setPage(1);
    sel.clear();
  };
  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
    sel.clear();
  };

  const handleExport = useCallback(() => {
    const rows = sel.count > 0 ? coupons.filter((c) => sel.selected.has(c.id)) : coupons;
    exportCouponsToCSV(rows, sel.count > 0 ? `${sel.count}-seleccionados` : filter);
  }, [sel, coupons, filter]);

  const toggleActive = useCallback(
    async (id: string, active: boolean) => {
      await update(id, { active });
      refetch();
    },
    [update, refetch],
  );

  const toggleArchived = useCallback(
    async (id: string, archived: boolean) => {
      await update(id, { archived });
      sel.clear();
      refetch();
    },
    [update, refetch, sel],
  );

  const handleBulkArchive = useCallback(
    async (archived: boolean) => {
      if (sel.count === 0) return;
      await Promise.all(Array.from(sel.selected).map((id) => update(id, { archived })));
      sel.clear();
      refetch();
    },
    [sel, update, refetch],
  );

  return (
    <div className="max-w-6xl">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Códigos de descuento</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} códigos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo código
          </button>
          <ExportCSVButton onExport={handleExport} selectedCount={sel.count} />
          <BulkArchiveButtons
            selectedCount={sel.count}
            isArchived={filter === 'archived'}
            onToggleArchive={() => handleBulkArchive(filter !== 'archived')}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 my-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por código…"
            className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 w-56 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
                Código
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Descuento
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Mínimo
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Vigencia
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Usos
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Activo
              </th>
              <th className="w-10" />
            </tr>
          </thead>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.tbody key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <PromoSkeletonRow key={i} index={i} />
                ))}
              </motion.tbody>
            )}

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

            {!loading && !error && coupons.length === 0 && (
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
                      <Ticket className="h-9 w-9" />
                      <p className="text-sm">Sin resultados</p>
                    </motion.div>
                  </td>
                </tr>
              </motion.tbody>
            )}

            {!loading && !error && coupons.length > 0 && (
              <motion.tbody
                key="data"
                className="divide-y divide-slate-100"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {coupons.map((c) => {
                  const badge = TYPE_BADGES[c.discount_type];
                  const expired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
                  const exhausted = c.max_uses != null && c.uses_count >= c.max_uses;
                  return (
                    <motion.tr
                      key={c.id}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        visible: { opacity: 1, x: 0 },
                      }}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                      className={`transition-colors ${sel.selected.has(c.id) ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3">
                        <SelectCheckbox
                          checked={sel.selected.has(c.id)}
                          onChange={() => sel.toggle(c.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className="font-mono font-semibold text-slate-800 cursor-pointer hover:underline"
                          onClick={() => setEditId(c.id)}
                        >
                          {c.code}
                        </p>
                        {c.description && (
                          <p className="text-xs text-slate-400 mt-0.5 max-w-[180px] truncate">
                            {c.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-700">
                          {discountLabel(c)}
                        </span>
                        <span
                          className={`ml-1.5 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${badge.cls}`}
                          title={c.discount_type}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {c.min_subtotal > 0 ? formatCLP(c.min_subtotal) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        <p>Ini: {formatDate(c.starts_at)}</p>
                        <p className="text-slate-400">
                          Fin: {formatDate(c.expires_at)}
                          {expired && (
                            <span className="ml-1 text-red-500 font-medium">(vencido)</span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            exhausted ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.uses_count}
                          {c.max_uses != null ? `/${c.max_uses}` : ' ∞'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Toggle
                          size="sm"
                          checked={c.active}
                          onChange={(v) => toggleActive(c.id, v)}
                        />
                      </td>
                      <td className="pr-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleArchived(c.id, !c.archived)}
                            title={c.archived ? 'Desarchivar' : 'Archivar'}
                            className="p-1.5 text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          >
                            {c.archived ? (
                              <ArchiveRestore className="h-3.5 w-3.5" />
                            ) : (
                              <Archive className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditId(c.id)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            )}
          </AnimatePresence>
        </table>

        {!loading && coupons.length > 0 && (
          <motion.div
            className="px-4 pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
          </motion.div>
        )}
      </div>

      <CouponEditPanel
        couponId={creating ? null : editId}
        creating={creating}
        onClose={() => {
          setEditId(null);
          setCreating(false);
        }}
        onSaved={() => {
          setEditId(null);
          setCreating(false);
          refetch();
        }}
      />
    </div>
  );
}
