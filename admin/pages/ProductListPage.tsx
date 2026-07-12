import { useState, useCallback } from 'react';
import { Search, Filter, Package } from 'lucide-react';
import { useAdminList, useAdminMutation } from '../hooks/useAdminData';
import { Toggle } from '../components/ui/Toggle';
import { Pagination } from '../components/ui/Pagination';
import { ProductEditPanel } from '../components/products/ProductEditPanel';

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
  cover_url: string | null;
  created_time: string;
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

type FilterKey = 'all' | 'on_sale' | 'low_stock' | 'hidden';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'on_sale', label: '⚡ En oferta' },
  { key: 'low_stock', label: '⚠️ Stock bajo' },
  { key: 'hidden', label: '🙈 Ocultos' },
];

export function ProductListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [editId, setEditId] = useState<string | null>(null);

  // Construir params según filtro activo
  const params = {
    page,
    pageSize: 15,
    search: search || undefined,
    on_sale: filter === 'on_sale' ? 'true' : undefined,
    low_stock: filter === 'low_stock' ? 'true' : undefined,
    visible: filter === 'hidden' ? 'false' : undefined,
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

  const handleFilterChange = (key: FilterKey) => {
    setFilter(key);
    setPage(1);
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  // Toggle inline sin abrir el formulario
  const toggle = useCallback(
    async (id: string, field: 'visible' | 'available' | 'on_sale', value: boolean) => {
      await update(id, { [field]: value });
      refetch();
    },
    [update, refetch],
  );

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Productos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} productos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
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
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            <span className="text-sm">Cargando…</span>
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-red-500 font-medium">Error: {error}</p>
            <p className="text-xs text-slate-400 mt-1">
              ¿Está corriendo{' '}
              <code className="bg-slate-100 px-1 rounded">npm run dev:functions</code>?
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Package className="h-8 w-8" />
            <p className="text-sm">Sin resultados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-12" />
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
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  {/* Imagen */}
                  <td className="px-4 py-3">
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

                  {/* Nombre + categoría */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 line-clamp-1">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.category}</p>
                  </td>

                  {/* Precio */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.on_sale && p.sale_price ? (
                      <div>
                        <p className="font-semibold text-slate-800">{formatCLP(p.sale_price)}</p>
                        <p className="text-xs text-slate-400 line-through">{formatCLP(p.price)}</p>
                      </div>
                    ) : (
                      <p className="font-medium text-slate-700">{formatCLP(p.price)}</p>
                    )}
                  </td>

                  {/* Stock */}
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

                  {/* Toggles inline */}
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

                  {/* Editar */}
                  <td className="pr-4 py-3 text-right">
                    <button
                      onClick={() => setEditId(p.id)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Paginación */}
        {!loading && products.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Panel de edición */}
      <ProductEditPanel
        productId={editId}
        onClose={() => setEditId(null)}
        onSaved={() => {
          setEditId(null);
          refetch();
        }}
      />
    </div>
  );
}
