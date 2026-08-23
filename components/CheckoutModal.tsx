import { useState } from 'react';
import { motion, AnimatePresence, useAnimate } from 'motion/react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Tag, X } from 'lucide-react';
import type { CustomerData } from '@/actions/createPayment';
import applyPromoCode from '@/actions/applyPromoCode';
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
  shippingCost?: number;
  freeShippingThreshold?: number;
  /** false = ningún producto del carrito admite envío (ej. solo membresías digitales) —
   * oculta la sección de envío aunque shippingEnabled sea true. Default true. */
  cartAllowsShipping?: boolean;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

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
  freeShippingThreshold = 0,
  cartAllowsShipping = true,
}: CheckoutModalProps) {
  const showShippingSection = shippingEnabled && cartAllowsShipping;
  const [formScope, animateForm] = useAnimate();
  const [form, setForm] = useState<CustomerData>({
    name: '',
    email: '',
    wantsDelivery: false,
    address: '',
    city: '',
    region: '',
    zip: '',
    wantsNewsletter: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoApplied | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // Costo de envío efectivo: 0 si supera el umbral de envío gratis
  const rawShippingCost =
    form.wantsDelivery && showShippingSection && shippingCost > 0
      ? freeShippingThreshold > 0 && totalAmount >= freeShippingThreshold
        ? 0
        : shippingCost
      : 0;
  const shippingPromoActive = promo?.type === 'shipping' && rawShippingCost > 0;
  const effectiveShipping = shippingPromoActive ? 0 : rawShippingCost;
  const promoAmount = promo && promo.type !== 'shipping' ? Math.min(promo.amount, totalAmount) : 0;
  const grandTotal = totalAmount - promoAmount + effectiveShipping;

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
        form.wantsDelivery && showShippingSection,
      );
      if (result.ok && result.code) {
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
    if (form.wantsDelivery) {
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
    await onSubmit({ ...form, shippingCost: effectiveShipping, promoCode: promo?.code });
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
                    shippingCost > 0
                      ? freeShippingThreshold > 0
                        ? `Costo: ${formatPrice(shippingCost)} \u2014 gratis sobre ${formatPrice(freeShippingThreshold)}`
                        : `Costo de envío: ${formatPrice(shippingCost)}`
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
