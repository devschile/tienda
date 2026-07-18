import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Package,
  Download,
  Plus,
  AlertTriangle,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { useAdminList, useAdminMutation } from '../hooks/useAdminData';
import { useRowSelection } from '../hooks/useRowSelection';
import { SelectCheckbox } from '../components/ui/SelectCheckbox';
import { Toggle } from '../components/ui/Toggle';
import { Pagination } from '../components/ui/Pagination';
import { ProductEditPanel } from '../components/products/ProductEditPanel';
import { ProductSkeletonRow } from '../components/ui/TableSkeleton';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  sale_price: number | null;
  visible: boolean;
  available: boolean;
  stock: number;
  on_sale: boolean;
  archived: boolean;
  cover_url: string | null;
  created_time: string;
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

type FilterKey = 'all' | 'on_sale' | 'low_stock' | 'hidden' | 'archived';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'on_sale', label: '⚡ En oferta' },
  { key: 'low_stock', label: '⚠️ Stock bajo' },
  { key: 'hidden', label: '🙈 Ocultos' },
  { key: 'archived', label: '📦 Archivados' },
];

const exportProductsToCSV = (rows: Product[], label: string) => {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = [
    'ID',
    'Nombre',
    'Categoría',
    'Precio',
    'Precio oferta',
    'Stock',
    'Visible',
    'Disponible',
    'En oferta',
  ];
  const lines = [
    headers.join(','),
    ...rows.map((p) =>
      [
        esc(p.id),
        esc(p.name),
        esc(p.category),
        p.price,
        p.sale_price ?? '',
        p.stock,
        p.visible,
        p.available,
        p.on_sale,
      ].join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `productos-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export function ProductListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const params = {
    page,
    pageSize: 15,
    search: search || undefined,
    on_sale: filter === 'on_sale' ? 'true' : undefined,
    low_stock: filter === 'low_stock' ? 'true' : undefined,
    visible: filter === 'hidden' ? 'false' : undefined,
    archived: filter === 'archived' ? 'true' : undefined,
  };

  const {
    data: products = [],
    total = 0,
    pageSize = 15,
    loading,
    error,
    refetch,
  } = useAdminList<Product>('products', params);

  const { update } = useAdminMutation<Product>('products');
  const sel = useRowSelection(products);

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
    const rows = sel.count > 0 ? products.filter((p) => sel.selected.has(p.id)) : products;
    exportProductsToCSV(rows, sel.count > 0 ? `${sel.count}-seleccionados` : filter);
  }, [sel, products, filter]);

  // Toggle inline sin abrir el formulario
  const toggle = useCallback(
    async (id: string, field: 'visible' | 'available' | 'on_sale', value: boolean) => {
      await update(id, { [field]: value });
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

  return (
    <div className="max-w-6xl">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Productos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} productos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            {sel.count > 0 ? `Exportar ${sel.count} seleccionados` : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 my-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre…"
            className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 w-56 transition-colors"
          />
        </div>

        {/* Pills de filtro */}
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-18" />
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Producto
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Precio
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Stock
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Visible
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Dispon.
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Oferta
              </th>
              <th className="w-10" />
            </tr>
          </thead>

          <AnimatePresence mode="wait">
            {/* ── Skeleton ── */}
            {loading && (
              <motion.tbody key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <ProductSkeletonRow key={i} index={i} />
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
                  <td colSpan={9} className="px-6 py-14 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <AlertTriangle className="h-7 w-7 text-red-400" />
                      <p className="text-sm text-red-500 font-medium">{error}</p>
                      <p className="text-xs text-slate-400">
                        ¿Está corriendo{' '}
                        <code className="bg-slate-100 px-1 rounded">npm run dev:functions</code>?
                      </p>
                    </motion.div>
                  </td>
                </tr>
              </motion.tbody>
            )}

            {/* ── Empty ── */}
            {!loading && !error && products.length === 0 && (
              <motion.tbody
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center">
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0, y: 16 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', bounce: 0.45, delay: 0.1 }}
                      className="flex flex-col items-center gap-3 text-slate-400"
                    >
                      <Package className="h-9 w-9" />
                      <p className="text-sm">Sin resultados</p>
                    </motion.div>
                  </td>
                </tr>
              </motion.tbody>
            )}

            {/* ── Data ── */}
            {!loading && !error && products.length > 0 && (
              <motion.tbody
                key="data"
                className="divide-y divide-slate-100"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {products.map((p) => (
                  <motion.tr
                    key={p.id}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    className={`transition-colors ${sel.selected.has(p.id) ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3">
                      <SelectCheckbox
                        checked={sel.selected.has(p.id)}
                        onChange={() => sel.toggle(p.id)}
                      />
                    </td>
                    <td className="p-3">
                      {p.cover_url ? (
                        <img
                          src={p.cover_url}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover bg-slate-100"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Package className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 line-clamp-1">{p.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{p.category}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.on_sale && p.sale_price ? (
                        <div>
                          <p className="font-semibold text-slate-800">{formatCLP(p.sale_price)}</p>
                          <p className="text-xs text-slate-400 line-through">
                            {formatCLP(p.price)}
                          </p>
                        </div>
                      ) : (
                        <p className="font-medium text-slate-700">{formatCLP(p.price)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.stock === 0
                            ? 'bg-red-100 text-red-700'
                            : p.stock < 5
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Toggle
                        size="sm"
                        checked={p.visible}
                        onChange={(v) => toggle(p.id, 'visible', v)}
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Toggle
                        size="sm"
                        checked={p.available}
                        onChange={(v) => toggle(p.id, 'available', v)}
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Toggle
                        size="sm"
                        checked={p.on_sale}
                        onChange={(v) => toggle(p.id, 'on_sale', v)}
                      />
                    </td>
                    <td className="pr-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleArchived(p.id, !p.archived)}
                          title={p.archived ? 'Desarchivar' : 'Archivar'}
                          className="p-1.5 text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                          {p.archived ? (
                            <ArchiveRestore className="h-3.5 w-3.5" />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditId(p.id)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            )}
          </AnimatePresence>
        </table>

        {/* Paginación */}
        {!loading && products.length > 0 && (
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

      {/* Panel crear / editar */}
      <ProductEditPanel
        productId={creating ? null : editId}
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
