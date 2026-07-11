import { useState } from 'react';
import { motion, AnimatePresence, useAnimate } from 'motion/react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import type { CustomerData } from '@/actions/createPayment';
import { REGIONES_COMUNAS, COMUNAS_POR_REGION } from '@/data/comunas-chile';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onSubmit: (customer: CustomerData) => Promise<void>;
  loading?: boolean;
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
        <div className="w-5 h-5 rounded-md border-2 border-brand-secondary/30 bg-white peer-checked:bg-brand-primary peer-checked:border-brand-primary transition-all duration-150 group-hover:border-brand-primary/60" />
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
}: CheckoutModalProps) {
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

  const set =
    (field: keyof CustomerData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => {
        const next = { ...prev, [field]: e.target.value };
        if (field === 'region') next.city = '';
        return next;
      });
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
    await onSubmit(form);
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
          <p className="text-sm text-devs-muted">
            Total: <span className="font-bold text-brand-primary">{formatPrice(totalAmount)}</span>
          </p>
        </DialogHeader>

        <hr className="border-brand-secondary/10" />

        <form ref={formScope} onSubmit={handleSubmit} className="space-y-5 mt-1">
          {/* Nombre completo + Email — 2 columnas en desktop, 1 en mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-devs-text mb-1.5">
                Nombre completo <span className="text-brand-primary">*</span>
              </label>
              <input
                className={inputClass('name')}
                value={form.name}
                onChange={set('name')}
                placeholder="Jorge Epuñan"
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
                placeholder="jorge@devschile.cl"
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Checkbox: ¿Envío a domicilio? */}
          <div className="rounded-xl border border-brand-secondary/10 bg-brand-surface/50 p-4 space-y-4">
            <BrandCheckbox
              checked={!!form.wantsDelivery}
              onChange={toggle('wantsDelivery')}
              label="¿Envío a domicilio?"
              sublabel="Agrega tu dirección para coordinar la entrega"
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
                      placeholder="Av. Providencia 1234, Depto 5B"
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
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
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
                      placeholder="7500000"
                      maxLength={7}
                      autoComplete="postal-code"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Checkbox: newsletter */}
          <BrandCheckbox
            checked={!!form.wantsNewsletter}
            onChange={toggle('wantsNewsletter')}
            label="Quiero recibir novedades de la tienda"
            sublabel="Sin spam — solo lanzamientos y productos nuevos 🦌"
          />

          {/* Botón submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98]"
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
          <p className="text-xs text-devs-muted text-center leading-relaxed">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
