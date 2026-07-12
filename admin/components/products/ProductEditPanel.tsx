import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useAdminOne, useAdminMutation } from '../../hooks/useAdminData';
import { Toggle } from '../ui/Toggle';

interface Product {
  id: string;
  name: string;
  description: string;
  long_description: string | null;
  category: string;
  price: number;
  sale_price: number | null;
  visible: boolean;
  available: boolean;
  stock: number;
  on_sale: boolean;
  cover_url: string | null;
}

interface Props {
  productId: string | null;
  onClose: () => void;
  onSaved: () => void;
}


export function ProductEditPanel({ productId, onClose, onSaved }: Props) {
  const { data, loading: loadingData } = useAdminOne<Product>('products', productId);
  const { update, loading: saving } = useAdminMutation<Product>('products');

  const [form, setForm] = useState<Partial<Product>>({});
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = (field: keyof Product, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!productId) return;
    const result = await update(productId, form);
    if (result) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved();
      }, 1000);
    }
  };

  const input =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors text-slate-800';

  if (!productId) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="font-semibold text-slate-800 text-base">Editar producto</h2>
            {data && (
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">{data.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || loadingData}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…
                </>
              ) : saved ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Guardado
                </>
              ) : (
                'Guardar'
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {loadingData ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Imagen cover */}
            {form.cover_url && (
              <img
                src={form.cover_url}
                alt=""
                className="w-full h-40 object-cover rounded-xl bg-slate-100"
              />
            )}

            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Nombre
              </label>
              <input
                className={input}
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Categoría
              </label>
              <input
                className={input}
                value={form.category ?? ''}
                onChange={(e) => set('category', e.target.value)}
              />
            </div>

            {/* Precios */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Precio CLP
                </label>
                <input
                  type="number"
                  className={input}
                  value={form.price ?? ''}
                  onChange={(e) => set('price', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Precio oferta
                </label>
                <input
                  type="number"
                  className={input}
                  placeholder="Vacío = sin oferta"
                  value={form.sale_price ?? ''}
                  onChange={(e) =>
                    set('sale_price', e.target.value ? parseInt(e.target.value) : null)
                  }
                />
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Stock
              </label>
              <input
                type="number"
                min="0"
                className={input}
                value={form.stock ?? ''}
                onChange={(e) => set('stock', parseInt(e.target.value))}
              />
            </div>

            {/* Toggles */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              {(
                [
                  ['visible', 'Visible en catálogo'],
                  ['available', 'Disponible para comprar'],
                  ['on_sale', 'En oferta'],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{label}</span>
                  <Toggle checked={!!form[field]} onChange={(v) => set(field, v)} />
                </div>
              ))}
            </div>

            {/* Descripción corta */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Descripción corta
              </label>
              <textarea
                rows={3}
                className={`${input} resize-none`}
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>

            {/* Descripción larga — Markdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Descripción larga (Markdown)
                </label>
                <button
                  onClick={() => setPreview((p) => !p)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {preview ? (
                    <>
                      <EyeOff className="h-3 w-3" /> Editar
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" /> Preview
                    </>
                  )}
                </button>
              </div>
              {preview ? (
                <div className="min-h-[120px] px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono">
                  {form.long_description || (
                    <span className="text-slate-400 italic">Sin descripción</span>
                  )}
                </div>
              ) : (
                <textarea
                  rows={8}
                  className={`${input} resize-y font-mono text-xs`}
                  placeholder={'# Título\n\n## Características\n\n- Item 1\n- **Negrita**'}
                  value={form.long_description ?? ''}
                  onChange={(e) => set('long_description', e.target.value || null)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
