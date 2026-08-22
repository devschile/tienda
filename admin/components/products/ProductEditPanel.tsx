import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, EyeOff, Loader2, Check, Plus } from 'lucide-react';
import { useAdminOne, useAdminMutation } from '../../hooks/useAdminData';
import { adminFetch } from '../../utils/adminFetch';
import { Toggle } from '../ui/Toggle';
import { ImageManager } from './ImageManager';
import posthog from '../../../lib/posthog';

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
  presale: boolean;
  cover_url: string | null;
  product_type: 'standard' | 'bundle' | 'addon';
  selectable_in_bundles: boolean;
  bundle_unit_price: number | null;
  bundle_sizes: string;
  bundle_allow_surprise: boolean;
  shipping_enabled: boolean;
}

const DEFAULTS: Partial<Product> = {
  name: '',
  description: '',
  long_description: null,
  category: '',
  price: 0,
  sale_price: null,
  visible: true,
  available: true,
  stock: 0,
  on_sale: false,
  presale: false,
  product_type: 'standard',
  selectable_in_bundles: false,
  bundle_unit_price: null,
  bundle_sizes: '',
  bundle_allow_surprise: true,
  shipping_enabled: true,
};

interface Props {
  /** ID del producto para editar. null = panel cerrado (si creating también es false). */
  productId: string | null;
  /** true = modo creación (no requiere productId). */
  creating?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductEditPanel({ productId, creating = false, onClose, onSaved }: Props) {
  const isOpen = creating || productId !== null;

  const { data, loading: loadingData } = useAdminOne<Product>(
    'products',
    creating ? null : productId,
  );
  const { update, create, loading: saving } = useAdminMutation<Product>('products');

  const [form, setForm] = useState<Partial<Product>>(creating ? DEFAULTS : {});
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);

  // Categorías existentes para el select — se cargan una vez al abrir el panel
  useEffect(() => {
    if (!isOpen) return;
    adminFetch<{ data: string[] }>('categories')
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, [isOpen]);

  // Reset form when mode changes
  useEffect(() => {
    if (creating) {
      setForm(DEFAULTS);
      setPreview(false);
      setSaved(false);
      setValidationError(null);
      setAddingCategory(false);
    }
  }, [creating]);

  // Populate form when editing an existing product
  useEffect(() => {
    if (!creating && data) {
      const rawSizes = data.bundle_sizes as unknown;
      // bundle_sizes llega como JSON string desde el backend ('[3,4,6]') o array
      let sizesStr = '';
      if (typeof rawSizes === 'string') {
        try {
          const parsed = JSON.parse(rawSizes);
          if (Array.isArray(parsed)) sizesStr = parsed.join(', ');
        } catch {
          sizesStr = rawSizes;
        }
      } else if (Array.isArray(rawSizes)) {
        sizesStr = rawSizes.join(', ');
      }
      setForm({ ...data, bundle_sizes: sizesStr });
      setPreview(false);
      setSaved(false);
      setValidationError(null);
      setAddingCategory(false);
    }
  }, [creating, data]);

  const set = (field: keyof Product, value: unknown) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // presale y on_sale son mutuamente excluyentes
      if (field === 'presale' && value === true) next.on_sale = false;
      else if (field === 'on_sale' && value === true) next.presale = false;
      return next;
    });

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setValidationError('El nombre es requerido');
      return;
    }
    if (form.price === undefined || form.price === null || isNaN(Number(form.price))) {
      setValidationError('El precio es requerido');
      return;
    }
    if (form.product_type === 'bundle') {
      if (!form.bundle_unit_price || form.bundle_unit_price <= 0) {
        setValidationError('Los packs requieren un precio por sticker');
        return;
      }
      const sizes = (form.bundle_sizes ?? '')
        .split(/[,\s]+/)
        .map((s) => parseInt(s, 10))
        .filter((n) => Number.isInteger(n) && n > 0);
      if (sizes.length === 0) {
        setValidationError('Los packs requieren al menos un tamaño (ej. 3, 4, 6)');
        return;
      }
    }
    setValidationError(null);

    const dbFields = { ...form };
    delete (dbFields as Partial<Product>).cover_url;
    const result = creating
      ? await create(dbFields)
      : productId
        ? await update(productId, dbFields)
        : null;

    if (result) {
      posthog.capture(creating ? 'admin_product_created' : 'admin_product_updated', {
        product_id: result.id,
        category: result.category || 'uncategorized',
        available: result.available,
        visible: result.visible,
        on_sale: result.on_sale,
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved();
      }, 900);
    }
  };

  const input =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors text-slate-800 bg-white';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-white shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0.18, duration: 0.48 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="font-semibold text-slate-800 text-base">
                  {creating ? 'Nuevo producto' : 'Editar producto'}
                </h2>
                {!creating && data && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">
                    {data.name}
                  </p>
                )}
                {creating && (
                  <p className="text-xs text-slate-400 mt-0.5">Completa los campos y guarda</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || (!creating && loadingData)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {creating ? 'Creando…' : 'Guardando…'}
                    </>
                  ) : saved ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      {creating ? 'Creado' : 'Guardado'}
                    </>
                  ) : creating ? (
                    'Crear producto'
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

            {/* Validation error */}
            {validationError && (
              <div className="mx-6 mt-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {validationError}
              </div>
            )}

            {/* Body */}
            {!creating && loadingData ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Gestor de imágenes (solo en modo edición) */}
                {!creating && productId && <ImageManager productId={productId} />}

                {/* Nombre */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    Nombre <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={input}
                    value={form.name ?? ''}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Nombre del producto"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    Categoría
                  </label>
                  {addingCategory ? (
                    <div className="flex gap-2">
                      <input
                        className={input}
                        autoFocus
                        value={form.category ?? ''}
                        onChange={(e) => set('category', e.target.value)}
                        placeholder="Nombre de la nueva categoría"
                      />
                      <button
                        type="button"
                        onClick={() => setAddingCategory(false)}
                        className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        className={input}
                        value={form.category ?? ''}
                        onChange={(e) => set('category', e.target.value)}
                      >
                        <option value="">Sin categoría</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        {form.category && !categories.includes(form.category) && (
                          <option value={form.category}>{form.category}</option>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          set('category', '');
                          setAddingCategory(true);
                        }}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Nueva
                      </button>
                    </div>
                  )}
                </div>

                {/* Precios */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                      Precio CLP <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={input}
                      value={form.price ?? ''}
                      onChange={(e) => set('price', parseInt(e.target.value) || 0)}
                      placeholder="12000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                      Precio oferta
                    </label>
                    <input
                      type="number"
                      min="0"
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
                    Stock inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={input}
                    value={form.stock ?? ''}
                    onChange={(e) => set('stock', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                {/* Toggles */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  {(
                    [
                      ['visible', 'Visible en catálogo'],
                      ['available', 'Disponible para comprar'],
                      ['on_sale', 'En oferta'],
                      ['presale', 'En preventa'],
                      ['shipping_enabled', 'Habilita envío'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{label}</span>
                      <Toggle checked={!!form[field]} onChange={(v) => set(field, v)} />
                    </div>
                  ))}
                </div>

                {/* Tipo de producto */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    Tipo de producto
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['standard', 'Standard', 'Compra directa como siempre'],
                        ['bundle', 'Pack', 'Constructor de stickers'],
                        ['addon', 'Sticker', 'Solo como agregado o en pack'],
                      ] as const
                    ).map(([value, label, hint]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('product_type', value)}
                        className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                          form.product_type === value
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-sm font-medium">{label}</span>
                        <span
                          className={`block text-[10px] leading-tight mt-0.5 ${
                            form.product_type === value ? 'text-white/70' : 'text-slate-400'
                          }`}
                        >
                          {hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configuración de pack (solo product_type = bundle) */}
                {form.product_type === 'bundle' && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                        Precio por sticker (CLP) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        className={input}
                        value={form.bundle_unit_price ?? ''}
                        onChange={(e) =>
                          set('bundle_unit_price', e.target.value ? parseInt(e.target.value) : null)
                        }
                        placeholder="1000"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        El precio del pack es tamaño × precio por sticker.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                        Tamaños disponibles <span className="text-red-400">*</span>
                      </label>
                      <input
                        className={input}
                        value={form.bundle_sizes ?? ''}
                        onChange={(e) => set('bundle_sizes', e.target.value)}
                        placeholder="3, 4, 6"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Tamaños separados por coma. Ej. 3, 4, 6 = packs de 3, 4 y 6 stickers.
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">
                        Permitir stickers sorpresa
                        <span className="block text-xs text-slate-400">
                          Si el usuario elige menos stickers que el tamaño, se completan con
                          sorpresa (tras confirmación).
                        </span>
                      </span>
                      <Toggle
                        checked={form.bundle_allow_surprise ?? true}
                        onChange={(v) => set('bundle_allow_surprise', v)}
                      />
                    </div>
                  </div>
                )}

                {/* Flag sticker seleccionable en packs */}
                {form.product_type !== 'bundle' && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">
                        Seleccionable en packs
                        <span className="block text-xs text-slate-400">
                          Este sticker puede elegirse dentro de un pack de stickers.
                        </span>
                      </span>
                      <Toggle
                        checked={!!form.selectable_in_bundles}
                        onChange={(v) => set('selectable_in_bundles', v)}
                      />
                    </div>
                  </div>
                )}

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
                    placeholder="Una frase que describe el producto"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
