import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimate } from 'motion/react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Tag, X } from 'lucide-react';
import type { CustomerData } from '@/actions/createPayment';
import type { SoySession } from '@/actions/soyAuth';
import applyPromoCode from '@/actions/applyPromoCode';
import { useToast } from '@/hooks/use-toast';
import { CHECKOUT_DRAFT_KEY, checkoutDraftKey } from '@/lib/checkout-draft';
import posthog from '@/lib/posthog';
import { shippingCostForTier, type ShippingTier, type ShippingTierCosts } from '@/lib/shipping';
import { REGIONES_COMUNAS, COMUNAS_POR_REGION } from '@/data/comunas-chile';

interface PromoApplied {
  code: string;
  type: 'percent' | 'fixed' | 'shipping';
  amount: number;
}

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onSubmit: (customer: CustomerData) => Promise<void>;
  loading?: boolean;
  shippingEnabled?: boolean;
  /** Costo base/legacy (clave shipping_cost) — fallback para el tier xs. */
  shippingCost?: number;
  /** Costos absolutos por tier (claves shipping_cost_*) desde settings. */
  shippingCosts?: Partial<ShippingTierCosts>;
  /** Tier más grande del carrito (null = ningún ítem permite envío). */
  cartShippingTier?: ShippingTier | null;
  freeShippingThreshold?: number;
  /** false = ningún producto del carrito admite envío (ej. solo membresías digitales) —
   * oculta la sección de envío aunque shippingEnabled sea true. Default true. */
  cartAllowsShipping?: boolean;
  cartKey?: string;
  soy?: SoySession | null;
  soyVerifying?: boolean;
  soyStale?: boolean;
  onRefreshSoy?: () => void;
  onVerifySoy?: () => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

const EMPTY_FORM = {
  name: '',
  email: '',
  wantsDelivery: false,
  address: '',
  city: '',
  region: '',
  zip: '',
  wantsNewsletter: true,
} satisfies CustomerData;

function loadFormDraft(draftKey: string): CustomerData {
  try {
    const raw = sessionStorage.getItem(draftKey);
    if (!raw) return EMPTY_FORM;
    const draft = JSON.parse(raw) as Record<string, unknown>;
    if (!draft || typeof draft !== 'object') return EMPTY_FORM;
    const restored: CustomerData = { ...EMPTY_FORM };
    for (const [key, fallback] of Object.entries(EMPTY_FORM)) {
      if (typeof draft[key] === typeof fallback) {
        Object.assign(restored, { [key]: draft[key] });
      }
    }
    return restored;
  } catch {
    return EMPTY_FORM;
  }
}

// ── Checkbox con estilo de marca ────────────────────────────────────────────
function BrandCheckbox({
  checked,
  onChange,
  label,
  sublabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sublabel?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group select-none">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-5 h-5 rounded-md border-2 border-brand-secondary/30 bg-white peer-checked:bg-green-600 peer-checked:border-green-700 transition-all duration-150 group-hover:green-600" />
        <Check className="absolute inset-0 m-auto h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150 pointer-events-none" />
      </div>
      <div>
        <span className="text-sm font-medium text-devs-text leading-snug">{label}</span>
        {sublabel && <p className="text-xs text-devs-muted mt-0.5 leading-relaxed">{sublabel}</p>}
      </div>
    </label>
  );
}

export function CheckoutModal({
  open,
  onOpenChange,
  totalAmount,
  onSubmit,
  loading,
  shippingEnabled = true,
  shippingCost = 0,
  shippingCosts = {},
  cartShippingTier = null,
  freeShippingThreshold = 0,
  cartAllowsShipping = true,
  cartKey = '',
  soy = null,
  soyVerifying = false,
  soyStale = false,
  onRefreshSoy,
  onVerifySoy,
}: CheckoutModalProps) {
  const showShippingSection = shippingEnabled && cartAllowsShipping;
  const draftKey = cartKey ? checkoutDraftKey(cartKey) : CHECKOUT_DRAFT_KEY;
  const [formScope, animateForm] = useAnimate();
  const [form, setForm] = useState<CustomerData>(() => loadFormDraft(draftKey));
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoApplied | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  // Inputs con los que se validó por última vez el código. Evita que el effect
  // de re-validación se re-dispare por el propio setPromo (mismo code → mismo key).
  const promoValidatedKeyRef = useRef<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    sessionStorage.setItem(draftKey, JSON.stringify(form));
    if (cartKey) sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
  }, [open, form, draftKey, cartKey]);

  useEffect(() => {
    if (!open || !soy || soyVerifying) return;
    onRefreshSoy?.();
    // Refresh once per access token each time the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, soy?.accessToken]);
  // Costo del tier que manda en el carrito (el más grande). Este es un
  // estimado para la UI; create-payment.js lo recalcula desde la BD.
  const cartTierCost = cartShippingTier
    ? shippingCostForTier(cartShippingTier, shippingCosts, shippingCost)
    : 0;

  // Costo de envío efectivo: 0 si supera el umbral de envío gratis
  const deliverySelected = form.wantsDelivery && showShippingSection;
  const rawShippingCost =
    form.wantsDelivery && showShippingSection && cartTierCost > 0
      ? freeShippingThreshold > 0 && totalAmount >= freeShippingThreshold
        ? 0
        : cartTierCost
      : 0;
  const shippingPromoActive = promo?.type === 'shipping' && rawShippingCost > 0;
  const effectiveShipping = shippingPromoActive ? 0 : rawShippingCost;
  const promoAmount = promo && promo.type !== 'shipping' ? Math.min(promo.amount, totalAmount) : 0;
  const grandTotal = totalAmount - promoAmount + effectiveShipping;

  // Re-validar el código cuando cambian los inputs que condicionan su validez.
  // El carrito solo cambia con el modal cerrado, así que se re-chequea al reabrir
  // (open → true) y al alternar la entrega. Si el código deja de aplicar (p. ej. el
  // subtotal quedó bajo min_subtotal), se quita automáticamente con el motivo.
  useEffect(() => {
    if (!promo || !open) return; // sin código o cerrado: no re-validar
    const key = `${promo.code}|${totalAmount}|${rawShippingCost}|${deliverySelected}`;
    if (promoValidatedKeyRef.current === key) return;

    // Marcar antes de lanzar la request para evitar re-entradas del effect.
    promoValidatedKeyRef.current = key;
    let cancelled = false;
    setPromoLoading(true);
    applyPromoCode(promo.code, totalAmount, rawShippingCost, deliverySelected)
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.code) {
          // Actualiza el monto al carrito actual (los % siguen al subtotal).
          setPromo({ code: res.code, type: res.type ?? promo.type, amount: res.discount_amount });
          setPromoError(null);
        } else {
          const reason = res.error ?? 'El código ya no aplica a tu carrito';
          posthog.capture('checkout_promo_invalidated', {
            code: promo.code,
            cart_total: totalAmount,
            reason,
          });
          toast({
            title: 'Código de descuento removido',
            description: reason,
          });
          setPromo(null);
          setPromoError(reason);
          // Se deja el código en el input para re-aplicarlo si ajusta el carrito.
          setPromoInput(promo.code);
        }
      })
      .catch(() => {
        // Falla de red: se conserva el código; el servidor igual re-valida al pagar.
      })
      .finally(() => {
        if (!cancelled) setPromoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, promo, totalAmount, rawShippingCost, deliverySelected, toast]);

  const set =
    (field: keyof CustomerData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => {
        const next = { ...prev, [field]: e.target.value };
        if (field === 'region') next.city = '';
        return next;
      });
    };

  const applyPromo = async () => {
    if (promoLoading) return;
    setPromoError(null);
    setPromoLoading(true);
    try {
      const result = await applyPromoCode(
        promoInput,
        totalAmount,
        rawShippingCost,
        deliverySelected,
      );
      if (result.ok && result.code) {
        // Marcar la clave para que el effect de re-validación no repita la request.
        promoValidatedKeyRef.current = `${result.code}|${totalAmount}|${rawShippingCost}|${deliverySelected}`;
        setPromo({
          code: result.code,
          type: result.type ?? 'fixed',
          amount: result.discount_amount,
        });
        setPromoInput('');
      } else {
        setPromoError(result.error ?? 'El código no es válido');
      }
    } catch {
      setPromoError('No se pudo validar el código. Intenta nuevamente.');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromo(null);
    setPromoError(null);
  };

  const toggle = (field: 'wantsDelivery' | 'wantsNewsletter') => (value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Limpiar errores de envío si se desmarca
    if (field === 'wantsDelivery' && !value) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.address;
        delete next.region;
        delete next.city;
        return next;
      });
      // Un código de envío gratis sin entrega no aplica: se quita para no
      // mostrar un ahorro inexistente ni fallar al pagar.
      if (promo?.type === 'shipping') removePromo();
    }
  };

  const comunas = form.region ? (COMUNAS_POR_REGION[form.region] ?? []) : [];

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Nombre requerido';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email inválido';
    // Un carrito digital (sección oculta) no puede exigir campos que no muestra.
    if (form.wantsDelivery && showShippingSection) {
      if (!form.address?.trim()) errs.address = 'Dirección requerida';
      if (!form.region?.trim()) errs.region = 'Región requerida';
      if (!form.city?.trim()) errs.city = 'Comuna requerida';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      animateForm(
        formScope.current,
        { x: [0, -8, 8, -6, 6, -4, 4, 0] },
        { duration: 0.4, ease: 'easeInOut' },
      );
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const normalized: CustomerData = showShippingSection
      ? form
      : { ...form, wantsDelivery: false, address: '', city: '', region: '', zip: '' };

    await onSubmit({
      ...normalized,
      shippingCost: effectiveShipping,
      promoCode: promo?.code,
      soyAccessToken: soy?.accessToken,
    });
  };

  const inputBase =
    'w-full rounded-lg border px-3 py-2.5 text-sm text-devs-text bg-white outline-none transition-colors focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary';

  const inputClass = (field: keyof CustomerData) =>
    `${inputBase} ${errors[field] ? 'border-red-400' : 'border-brand-secondary/20'}`;

  const disabledSelectClass = `${inputBase} border-brand-secondary/10 opacity-40 cursor-not-allowed bg-brand-surface`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* max-w-xl: más ancho que lg para dar espacio a región/comuna en la misma fila */}
      <DialogContent className="max-w-2xl bg-brand-background md:rounded-2xl border-brand-secondary/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl font-bold text-brand-secondary">
            Datos de compra
          </DialogTitle>
          <div className="space-y-0.5">
            <p className="text-sm text-devs-muted">
              Productos:{' '}
              <span className="font-semibold text-devs-text">{formatPrice(totalAmount)}</span>
            </p>
            {promoAmount > 0 && (
              <p className="text-sm text-green-700">
                Descuento ({promo?.code}):{' '}
                <span className="font-semibold">−{formatPrice(promoAmount)}</span>
              </p>
            )}
            {shippingPromoActive && (
              <p className="text-sm text-green-700">
                Envío gratis ({promo?.code}):{' '}
                <span className="font-semibold">−{formatPrice(rawShippingCost)}</span>
              </p>
            )}
            {effectiveShipping > 0 && (
              <p className="text-sm text-devs-muted">
                Envío:{' '}
                <span className="font-semibold text-devs-text">
                  {formatPrice(effectiveShipping)}
                </span>
              </p>
            )}
            {effectiveShipping === 0 &&
              form.wantsDelivery &&
              showShippingSection &&
              freeShippingThreshold > 0 &&
              totalAmount >= freeShippingThreshold && (
                <p className="text-xs text-green-600 font-medium">✓ Envío gratis por umbral</p>
              )}
            <p className="text-sm font-bold text-brand-primary">Total: {formatPrice(grandTotal)}</p>
          </div>
        </DialogHeader>

        <hr className="border-brand-secondary/10" />

        <form ref={formScope} onSubmit={handleSubmit} className="space-y-5 mt-1">
          <motion.div
            className="space-y-5"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
            }}
          >
            {/* Nombre completo + Email */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.25 } },
              }}
            >
              <div>
                <label className="block text-sm font-medium text-devs-text mb-1.5">
                  Nombre completo <span className="text-brand-primary">*</span>
                </label>
                <input
                  className={inputClass('name')}
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Zé Pequeño da Silva"
                  autoComplete="name"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-devs-text mb-1.5">
                  Email <span className="text-brand-primary">*</span>
                </label>
                <input
                  type="email"
                  className={inputClass('email')}
                  value={form.email}
                  onChange={set('email')}
                  placeholder="littlejoseph@gmail.cl"
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
            </motion.div>

            {/* Checkbox: ¿Envío a domicilio? — solo si está habilitado en ajustes
                y al menos un producto del carrito admite envío */}
            {showShippingSection && (
              <motion.div
                className="rounded-xl border border-brand-secondary/10 bg-brand-surface/50 p-4 space-y-4"
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.25 } },
                }}
              >
                <BrandCheckbox
                  checked={!!form.wantsDelivery}
                  onChange={toggle('wantsDelivery')}
                  label="¿Envío a domicilio?"
                  sublabel={
                    cartTierCost > 0
                      ? freeShippingThreshold > 0
                        ? `Costo: ${formatPrice(cartTierCost)}${
                            cartShippingTier ? ` (${cartShippingTier.toUpperCase()})` : ''
                          } \u2014 gratis sobre ${formatPrice(freeShippingThreshold)}`
                        : `Costo de envío: ${formatPrice(cartTierCost)}${
                            cartShippingTier ? ` (${cartShippingTier.toUpperCase()})` : ''
                          }`
                      : 'Agrega tu dirección para coordinar la entrega'
                  }
                />

                {/* Campos de envío — visibles solo si wantsDelivery */}
                <AnimatePresence initial={false}>
                  {form.wantsDelivery && (
                    <motion.div
                      key="delivery-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                      style={{ overflow: 'hidden' }}
                      className="space-y-4 pt-1"
                    >
                      {/* Dirección */}
                      <div>
                        <label className="block text-sm font-medium text-devs-text mb-1.5">
                          Dirección <span className="text-brand-primary">*</span>
                        </label>
                        <input
                          className={inputClass('address')}
                          value={form.address ?? ''}
                          onChange={set('address')}
                          placeholder="Calle Patagonia 110 casa 6 - Villa Huemul"
                          autoComplete="street-address"
                        />
                        {errors.address && (
                          <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                        )}
                      </div>

                      {/* Región / Comuna — side by side en desktop, stacked en mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-devs-text mb-1.5">
                            Región <span className="text-brand-primary">*</span>
                          </label>
                          <select
                            className={inputClass('region')}
                            value={form.region ?? ''}
                            onChange={set('region')}
                          >
                            <option value="">Selecciona región</option>
                            {REGIONES_COMUNAS.map((r) => (
                              <option key={r.abbreviation} value={r.name}>
                                {r.romanNumber} — {r.name}
                              </option>
                            ))}
                          </select>
                          {errors.region && (
                            <p className="text-xs text-red-500 mt-1">{errors.region}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-devs-text mb-1.5">
                            Comuna <span className="text-brand-primary">*</span>
                          </label>
                          {comunas.length === 0 ? (
                            <select className={disabledSelectClass} disabled>
                              <option>Selecciona comuna</option>
                            </select>
                          ) : (
                            <select
                              className={inputClass('city')}
                              value={form.city ?? ''}
                              onChange={set('city')}
                            >
                              <option value="">Selecciona comuna</option>
                              {comunas.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          )}
                          {errors.city && (
                            <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                          )}
                        </div>
                      </div>

                      {/* Código postal */}
                      <div>
                        <label className="block text-sm font-medium text-devs-text mb-1.5">
                          Código postal{' '}
                          <span className="text-devs-muted font-normal text-xs">(opcional)</span>
                        </label>
                        <input
                          className={inputClass('zip')}
                          value={form.zip ?? ''}
                          onChange={set('zip')}
                          placeholder="7500001"
                          maxLength={7}
                          autoComplete="postal-code"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Código de descuento */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.25 } },
              }}
            >
              {promo ? (
                <div className="flex items-center justify-between rounded-xl border border-green-300 bg-green-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-700" />
                    <span className="text-sm font-medium text-green-800">
                      {promo.type === 'shipping'
                        ? `Envío gratis con «${promo.code}»`
                        : `Código «${promo.code}» aplicado (−${formatPrice(promo.amount)})`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removePromo}
                    title="Quitar código"
                    className="p-1 rounded-md text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-devs-text mb-1.5">
                    ¿Tienes un código de descuento?
                  </label>
                  <div className="flex gap-2">
                    <input
                      className={inputBase}
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        setPromoError(null);
                      }}
                      placeholder="Ej. DEVSCL10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyPromo();
                        }
                      }}
                      disabled={promoLoading}
                      autoCapitalize="characters"
                    />
                    <Button
                      type="button"
                      onClick={applyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      variant="outline"
                      className="shrink-0 gap-1.5 border-brand-secondary/30 text-brand-primary hover:bg-brand-secondary/5"
                    >
                      {promoLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                      Aplicar
                    </Button>
                  </div>
                  {promoError && <p className="text-xs text-red-500 mt-1.5">{promoError}</p>}
                </div>
              )}
            </motion.div>

            {/* Checkbox: newsletter */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.25 } },
              }}
            >
              <BrandCheckbox
                checked={!!form.wantsNewsletter}
                onChange={toggle('wantsNewsletter')}
                label="Quiero recibir novedades de la tienda"
                sublabel="Sin spam — solo lanzamientos y productos nuevos 🦌"
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.25 } },
              }}
            >
              <SoyMembershipPanel
                soy={soy}
                verifying={soyVerifying}
                stale={soyStale}
                onVerify={onVerifySoy}
              />
            </motion.div>

            {/* Botón submit */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.25 } },
              }}
            >
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold rounded-xl transition-all active:scale-[0.98] btn-buy btn-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...
                  </>
                ) : (
                  'Pagar con MercadoPago 👉'
                )}
              </Button>

              {/* Aceptación tácita de Términos y Condiciones */}
              <p className="text-xs text-devs-muted text-center mt-3 leading-relaxed">
                Al continuar aceptas nuestros{' '}
                <a
                  href="/terminos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary hover:underline font-medium"
                >
                  Términos y Condiciones
                </a>{' '}
                y la política de privacidad de la tienda.
              </p>
            </motion.div>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function soyBadgeText(soy: SoySession, stale: boolean): { title: string; message: string } {
  if (stale)
    return {
      title: 'Miembro devsChile verificado',
      message: 'No pudimos confirmar tu estado gold ahora mismo; el descuento se valida al pagar.',
    };
  if (soy.isGold)
    return {
      title: 'Miembro gold devsChile',
      message: 'Tu pedido llevará descuento miembro.',
    };
  return {
    title: 'Miembro devsChile verificado',
    message: 'Sin descuento por ahora: el descuento es para membresía gold.',
  };
}

function SoyMembershipPanel({
  soy,
  verifying,
  stale,
  onVerify,
}: {
  soy: SoySession | null;
  verifying: boolean;
  stale: boolean;
  onVerify?: () => void;
}) {
  if (soy && verifying) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-brand-secondary/10 bg-brand-surface/50 p-4">
        <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-brand-secondary" />
        <div>
          <p className="text-sm font-semibold text-devs-text">Verificando membresía…</p>
          <p className="mt-0.5 text-xs text-devs-muted leading-relaxed">
            Consultando tu estado gold en devsChile.
          </p>
        </div>
      </div>
    );
  }

  if (soy) {
    const goldConfirmed = soy.isGold && !stale;
    const { title, message } = soyBadgeText(soy, stale);
    return (
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          goldConfirmed
            ? 'border-green-300 bg-green-50'
            : 'border-brand-secondary/10 bg-brand-surface/50'
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
            goldConfirmed ? 'bg-green-600' : 'bg-brand-secondary/40'
          }`}
        >
          <Check className="h-3 w-3" />
        </span>
        <div>
          <p className="text-sm font-semibold text-devs-text">{title}</p>
          <p className="mt-0.5 text-xs text-devs-muted leading-relaxed">
            {soy.member.handle
              ? `Conectado como @${soy.member.handle}.`
              : 'Tu cuenta devsChile está conectada.'}{' '}
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={verifying}
      onClick={() => {
        posthog.capture('checkout_soy_verify_clicked');
        onVerify?.();
      }}
      className="w-full rounded-xl border border-dashed border-brand-secondary/30 px-4 py-3 text-sm text-devs-muted transition-colors hover:border-brand-primary hover:text-brand-primary disabled:opacity-60"
    >
      {verifying ? 'Conectando con devsChile…' : '¿Eres parte de devsChile? Verifica tu membresía'}
    </button>
  );
}
