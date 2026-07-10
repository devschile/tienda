import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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

export function CheckoutModal({
  open,
  onOpenChange,
  totalAmount,
  onSubmit,
  loading,
}: CheckoutModalProps) {
  const [form, setForm] = useState<CustomerData>({
    name: '',
    email: '',
    address: '',
    city: '',
    region: '',
    zip: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});

  const set =
    (field: keyof CustomerData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => {
        const next = { ...prev, [field]: e.target.value };
        // Al cambiar región, limpiar la comuna
        if (field === 'region') next.city = '';
        return next;
      });
    };

  const comunas = form.region ? (COMUNAS_POR_REGION[form.region] ?? []) : [];

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Nombre requerido';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email inválido';
    if (!form.address?.trim()) errs.address = 'Dirección requerida';
    if (!form.region?.trim()) errs.region = 'Región requerida';
    if (!form.city?.trim()) errs.city = 'Comuna requerida';
    setErrors(errs);
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

  const disabledSelectClass = `${inputBase} border-brand-secondary/20 opacity-50 cursor-not-allowed bg-brand-surface`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-brand-background rounded-2xl border-brand-secondary/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl font-bold text-brand-secondary">
            Datos de facturación
          </DialogTitle>
          <p className="text-sm text-devs-muted">
            Total a pagar:{' '}
            <span className="font-bold text-brand-primary">{formatPrice(totalAmount)}</span>
          </p>
        </DialogHeader>

        <hr />

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-devs-text mb-1">
              Nombre completo *
            </label>
            <input
              className={inputClass('name')}
              value={form.name}
              onChange={set('name')}
              placeholder="Lorem Ipsum da Silva"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-devs-text mb-1">Email *</label>
            <input
              type="email"
              className={inputClass('email')}
              value={form.email}
              onChange={set('email')}
              placeholder="lorem@carabineros.cl"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-devs-text mb-1">Dirección *</label>
            <input
              className={inputClass('address')}
              value={form.address ?? ''}
              onChange={set('address')}
              placeholder="Pasaje Huemul 666, Casa 5B"
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          {/* Región */}
          <div>
            <label className="block text-sm font-medium text-devs-text mb-1">
              Región <span className="text-brand-primary">*</span>
            </label>
            <select
              className={inputClass('region')}
              value={form.region ?? ''}
              onChange={set('region')}
            >
              <option value="">Selecciona tu región</option>
              {REGIONES_COMUNAS.map((r) => (
                <option key={r.abbreviation} value={r.name}>
                  {r.romanNumber} — {r.name}
                </option>
              ))}
            </select>
            {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
          </div>

          {/* Comuna — filtrada según la región seleccionada */}
          <div>
            <label className="block text-sm font-medium text-devs-text mb-1">
              Comuna <span className="text-brand-primary">*</span>
            </label>
            {comunas.length === 0 ? (
              <select className={disabledSelectClass} disabled>
                <option>Primero selecciona una región</option>
              </select>
            ) : (
              <select className={inputClass('city')} value={form.city ?? ''} onChange={set('city')}>
                <option value="">Selecciona tu comuna</option>
                {comunas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>

          {/* Código postal (opcional) */}
          <div>
            <label className="block text-sm font-medium text-devs-text mb-1">
              Código postal <span className="text-devs-muted font-normal text-xs">(opcional)</span>
            </label>
            <input
              className={inputClass('zip')}
              value={form.zip ?? ''}
              onChange={set('zip')}
              placeholder="7500000"
              maxLength={7}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-md h-12 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98] mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...
              </>
            ) : (
              'Pagar con MercadoPago 👉'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
