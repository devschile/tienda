// Constructor de packs (producto tipo 'bundle').
// 1) Elige tamaño → 2) selecciona ítems → validación (sorpresa o bloqueo).
import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProductRecord } from '@/types/products';
import type { BundleSelection } from '@/hooks/useCart';
import posthog from '@/lib/posthog';
import { EmojiText } from '@/components/Emoji';

interface BundleBuilderProps {
  product: ProductRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ítems elegibles de ESTE pack (roster curado por el admin: bundle_item_ids,
   * filtrado por available + stock > 0). */
  items: ProductRecord[];
  onAddToCart: (product: ProductRecord, bundle: BundleSelection) => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

export function BundleBuilder({
  product,
  open,
  onOpenChange,
  items,
  onAddToCart,
}: BundleBuilderProps) {
  const sizes = product.fields.bundle_sizes?.length ? product.fields.bundle_sizes : null;
  const unitPrice = product.fields.bundle_unit_price ?? product.fields.price;
  const allowSurprise = product.fields.bundle_allow_surprise !== false;

  const [size, setSize] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [surpriseConfirmed, setSurpriseConfirmed] = useState(false);
  const [added, setAdded] = useState(false);

  // Reset al abrir o cambiar producto
  useEffect(() => {
    if (open && product) {
      setSize(sizes && sizes.length > 0 ? sizes[0] : null);
      setCounts({});
      setSurpriseConfirmed(false);
      setAdded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product.id]);

  const selectedCount = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const deficit = size ? size - selectedCount : 0;
  const canAdd =
    size !== null && (deficit === 0 || (allowSurprise && deficit > 0 && surpriseConfirmed));

  const inc = (item: ProductRecord) => {
    if (size === null || selectedCount >= size) return;
    if (counts[item.id] >= item.fields.stock) return;
    setCounts((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }));
  };
  const dec = (id: string) => {
    setCounts((prev) => {
      const next = { ...prev };
      if ((next[id] ?? 0) <= 1) {
        delete next[id];
      } else {
        next[id] = next[id] - 1;
      }
      return next;
    });
  };

  const handleAdd = () => {
    if (!canAdd || added) return;
    const selectedItems = Object.entries(counts)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({
        productId,
        name: items.find((s) => s.id === productId)?.fields.name ?? 'Ítem',
        quantity,
      }));
    const bundle: BundleSelection = {
      size: size as number,
      items: selectedItems,
      surpriseCount: Math.max(0, deficit),
    };
    posthog.capture('bundle_added_to_cart', {
      bundle_id: product.id,
      size: bundle.size,
      explicit_count: selectedItems.reduce((s, i) => s + i.quantity, 0),
      surprise_count: bundle.surpriseCount,
    });
    onAddToCart(product, bundle);
    setAdded(true);
    setTimeout(() => onOpenChange(false), 750);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-brand-background border border-brand-secondary/10 shadow-2xl p-6"
                  initial={{ opacity: 0, x: '-50%', y: 'calc(-50% + 12px)', scale: 0.96 }}
                  animate={{ opacity: 1, x: '-50%', y: '-50%', scale: 1 }}
                  exit={{ opacity: 0, x: '-50%', y: 'calc(-50% + 12px)', scale: 0.96 }}
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                >
                  <div className="sr-only">
                    <DialogPrimitive.Title>Arma tu pack</DialogPrimitive.Title>
                    <DialogPrimitive.Description>
                      Elige el tamaño y combina los ítems disponibles.
                    </DialogPrimitive.Description>
                  </div>

                  {/* Header */}
                  <div className="flex items-start justify-between pr-8">
                    <div>
                      <h2 className="font-mono text-xl font-bold text-brand-secondary">
                        <EmojiText text={product.fields.name} />
                      </h2>
                      <p className="text-sm text-devs-muted mt-0.5">
                        {unitPrice ? `${formatPrice(unitPrice)} por ítem` : ''} · Elige de los ítems
                        disponibles
                      </p>
                    </div>
                  </div>

                  {/* Paso 1 — Tamaño */}
                  {sizes && sizes.length > 1 && (
                    <div className="mt-5">
                      <p className="text-xs font-medium text-brand-secondary uppercase tracking-wide mb-2">
                        Tamaño del pack
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSize(s)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                              size === s
                                ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white'
                                : 'bg-brand-surface border border-brand-secondary/20 text-devs-text hover:bg-brand-accent/20'
                            }`}
                          >
                            {s} ítems · {formatPrice(s * unitPrice)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progreso */}
                  <div className="mt-5 bg-brand-surface rounded-xl p-4 border border-brand-secondary/10">
                    <div className="flex items-center justify-between text-sm font-semibold text-devs-text">
                      <span>
                        Seleccionados: {selectedCount} / {size ?? '—'}
                      </span>
                      <span className="font-mono font-bold text-brand-primary">
                        {formatPrice((size ?? 0) * unitPrice)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-brand-secondary/10 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                        animate={{
                          width: `${size ? Math.min(100, (selectedCount / size) * 100) : 0}%`,
                        }}
                        transition={{ type: 'spring', bounce: 0.1 }}
                      />
                    </div>

                    {/* Validación incompleta */}
                    <AnimatePresence initial={false}>
                      {deficit > 0 && size !== null && (
                        <motion.div
                          key="deficit"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mt-3"
                        >
                          {allowSurprise ? (
                            <>
                              <p className="text-sm text-amber-700 bg-amber-100 border border-amber-200 rounded-lg px-3 py-2">
                                ⚠️ Faltan {deficit} {deficit === 1 ? 'ítem' : 'ítems'} —{' '}
                                {deficit === 1 ? 'se completará' : 'se completarán'} con{' '}
                                {deficit === 1 ? 'un ítem sorpresa' : 'ítems sorpresa'} (los
                                elegiremos según stock disponible).
                              </p>
                              <label className="mt-2 flex items-start gap-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={surpriseConfirmed}
                                  onChange={(e) => setSurpriseConfirmed(e.target.checked)}
                                  className="mt-0.5 w-4 h-4 accent-brand-primary"
                                />
                                <span className="text-sm text-devs-text">
                                  Acepto que los {deficit} ítems faltantes sean{' '}
                                  <strong>sorpresa</strong>.
                                </span>
                              </label>
                            </>
                          ) : (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                              Debes elegir exactamente {size} ítems para armar el pack.
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Paso 2 — Ítems */}
                  <p className="mt-5 text-xs font-medium text-brand-secondary uppercase tracking-wide">
                    Elige tus ítems
                  </p>
                  {items.length === 0 ? (
                    <div className="mt-3 bg-brand-surface rounded-xl p-6 text-center text-sm text-devs-muted">
                      No hay ítems disponibles en stock ahora mismo.
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {items.map((item) => {
                        const qty = counts[item.id] ?? 0;
                        const exhausted = size !== null && selectedCount >= size && qty === 0;
                        const soldOut = item.fields.stock === 0;
                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl border bg-white p-3 transition-colors ${
                              qty > 0
                                ? 'border-brand-primary/60 shadow-md'
                                : 'border-brand-secondary/15'
                            }`}
                          >
                            <img
                              src={item.fields.coverImage?.url ?? '/assets/images/default.svg'}
                              alt={item.fields.name}
                              className={`w-full aspect-square object-cover rounded-lg bg-brand-surface ${soldOut || (exhausted && qty === 0) ? 'opacity-40 grayscale' : ''}`}
                            />
                            <p className="mt-2 text-sm font-semibold text-devs-text line-clamp-1 leading-tight">
                              <EmojiText text={item.fields.name} />
                            </p>
                            <p className="text-xs text-devs-muted mb-2">
                              {formatPrice(unitPrice)} · stock {item.fields.stock}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <button
                                onClick={() => dec(item.id)}
                                disabled={qty === 0}
                                className="w-7 h-7 rounded-full border border-brand-secondary/20 flex items-center justify-center text-brand-secondary hover:bg-brand-secondary hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand-secondary"
                                aria-label={`Quitar ${item.fields.name}`}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-bold text-devs-text min-w-[1.25rem] text-center">
                                {qty}
                              </span>
                              <button
                                onClick={() => inc(item)}
                                disabled={soldOut || exhausted || qty >= item.fields.stock}
                                className="w-7 h-7 rounded-full border border-brand-secondary/20 flex items-center justify-center text-brand-secondary hover:bg-brand-secondary hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand-secondary"
                                aria-label={`Agregar ${item.fields.name}`}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-devs-muted">Total del pack</p>
                      <p className="font-mono text-2xl font-bold text-brand-primary">
                        {formatPrice((size ?? 0) * unitPrice)}
                      </p>
                    </div>
                    <Button
                      onClick={handleAdd}
                      disabled={!canAdd || items.length === 0}
                      className={`h-12 px-6 text-sm font-bold tracking-wide rounded-xl transition-all active:scale-[0.98] ${
                        added ? 'bg-emerald-500 text-white' : 'btn-buy btn-glow'
                      }`}
                    >
                      {added ? (
                        <>
                          <Check className="h-4 w-4 mr-2" /> Añadido
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" /> Añadir al carrito
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
