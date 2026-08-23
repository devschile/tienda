import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Check } from 'lucide-react';
import { useAdminOne, useAdminMutation } from '../../hooks/useAdminData';
import { Toggle } from '../ui/Toggle';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed' | 'shipping';
  discount_value: number;
  min_subtotal: number;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  archived: boolean;
  created_time: string;
}

const DEFAULTS: Partial<Coupon> = {
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: 10,
  min_subtotal: 0,
  max_discount: null,
  starts_at: null,
  expires_at: null,
  max_uses: null,
  active: true,
};

// ISO (BD) → valor para <input type="datetime-local"> en hora local.
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const TYPE_OPTIONS: { value: Coupon['discount_type']; label: string; hint: string }[] = [
  { value: 'percent', label: 'Porcentaje', hint: 'Descuento % sobre el subtotal' },
  { value: 'fixed', label: 'Monto fijo', hint: 'Descuento en CLP sobre el subtotal' },
  { value: 'shipping', label: 'Envío gratis', hint: 'Anula solo el costo de envío' },
];

interface Props {
  couponId: string | null;
  creating?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CouponEditPanel({ couponId, creating = false, onClose, onSaved }: Props) {
  const isOpen = creating || couponId !== null;

  const { data, loading: loadingData } = useAdminOne<Coupon>('coupons', creating ? null : couponId);
  const { update, create, loading: saving } = useAdminMutation<Coupon>('coupons');

  const [form, setForm] = useState<Partial<Coupon>>(creating ? DEFAULTS : {});
  const [saved, setSaved] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (creating) {
      setForm(DEFAULTS);
      setSaved(false);
      setValidationError(null);
    }
  }, [creating]);

  useEffect(() => {
    if (!creating && data) {
      setForm({
        ...data,
        starts_at: toLocalInput(data.starts_at) || null,
        expires_at: toLocalInput(data.expires_at) || null,
      });
      setSaved(false);
      setValidationError(null);
    }
  }, [creating, data]);

  const set = (field: keyof Coupon, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const code = (form.code ?? '').trim().toUpperCase();
    if (!code) {
      setValidationError('El código es requerido');
      return;
    }
    const type = form.discount_type;
    if (!type) {
      setValidationError('Selecciona el tipo de descuento');
      return;
    }
    if (!form.discount_value || form.discount_value <= 0) {
      setValidationError('El valor del descuento debe ser mayor a 0');
      return;
    }
    if (type === 'percent' && (form.discount_value > 100 || form.discount_value < 1)) {
      setValidationError('Un descuento en porcentaje debe estar entre 1 y 100');
      return;
    }
    if (form.max_uses != null && form.max_uses <= 0) {
      setValidationError('El máximo de usos debe ser mayor a 0 (o vacío = ilimitado)');
      return;
    }
    if (
      form.starts_at &&
      form.expires_at &&
      new Date(form.expires_at).getTime() < new Date(form.starts_at).getTime()
    ) {
      setValidationError('La fecha de expiración es anterior a la de inicio');
      return;
    }
    setValidationError(null);

    const payload: Partial<Coupon> = {
      ...form,
      code,
      min_subtotal: form.min_subtotal ?? 0,
      max_discount: form.max_discount && form.max_discount > 0 ? form.max_discount : null,
      discount_value: Number(form.discount_value),
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      max_uses: form.max_uses && form.max_uses > 0 ? Number(form.max_uses) : null,
    };
    delete (payload as Partial<Coupon>).id;
    delete (payload as Partial<Coupon>).uses_count;
    delete (payload as Partial<Coupon>).archived;
    delete (payload as Partial<Coupon>).created_time;

    const result = creating
      ? await create(payload)
      : couponId
        ? await update(couponId, payload)
        : null;
    if (result) {
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
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-white shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0.18, duration: 0.48 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="font-semibold text-slate-800 text-base">
                  {creating ? 'Nuevo código' : 'Editar código'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">
                  {creating ? 'Define el descuento y sus límites' : form.code || 'Código'}
                </p>
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
                    'Crear código'
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

            {validationError && (
              <div className="mx-6 mt-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {validationError}
              </div>
            )}

            {!creating && loadingData ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Código + descripción */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    Código <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={`${input} uppercase font-mono`}
                    value={form.code ?? ''}
                    onChange={(e) => set('code', e.target.value.toUpperCase())}
                    placeholder="DEVSCL10"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    El usuario lo escribe igual lo escriba; se normaliza a mayúsculas.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    Descripción
                  </label>
                  <input
                    className={input}
                    value={form.description ?? ''}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Para el control interno del admin"
                  />
                </div>

                {/* Tipo de descuento */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    Tipo de descuento <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TYPE_OPTIONS.map(({ value, label, hint }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('discount_type', value)}
                        className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                          form.discount_type === value
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-sm font-medium">{label}</span>
                        <span
                          className={`block text-[10px] leading-tight mt-0.5 ${
                            form.discount_type === value ? 'text-white/70' : 'text-slate-400'
                          }`}
                        >
                          {hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Valor del descuento */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    {form.discount_type === 'percent'
                      ? 'Porcentaje (%)'
                      : form.discount_type === 'shipping'
                        ? 'Referencia (CLP, opcional)'
                        : 'Monto CLP'}{' '}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={input}
                    value={form.discount_value ?? ''}
                    onChange={(e) => set('discount_value', parseInt(e.target.value) || 0)}
                    placeholder={form.discount_type === 'percent' ? '10' : '2000'}
                  />
                  {form.discount_type === 'percent' && (
                    <p className="text-xs text-slate-400 mt-1">
                      Ej. 10 = 10% de descuento sobre el subtotal.
                    </p>
                  )}
                  {form.discount_type === 'shipping' && (
                    <p className="text-xs text-slate-400 mt-1">
                      El monto es informativo; el código solo anula el costo de envío.
                    </p>
                  )}
                </div>

                {/* Restricciones numéricas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                      Subtotal mínimo CLP
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={input}
                      value={form.min_subtotal ?? 0}
                      onChange={(e) => set('min_subtotal', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  {form.discount_type === 'percent' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                        Tope máximo CLP
                      </label>
                      <input
                        type="number"
                        min="0"
                        className={input}
                        value={form.max_discount ?? ''}
                        onChange={(e) =>
                          set('max_discount', e.target.value ? parseInt(e.target.value) : null)
                        }
                        placeholder="Vacío = sin tope"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                      Máximo de usos
                    </label>
                    <input
                      type="number"
                      min="1"
                      className={input}
                      value={form.max_uses ?? ''}
                      onChange={(e) =>
                        set('max_uses', e.target.value ? parseInt(e.target.value) : null)
                      }
                      placeholder="Vacío = ilimitado"
                    />
                  </div>
                </div>

                {/* Vigencia */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                      Inicio
                    </label>
                    <input
                      type="datetime-local"
                      className={input}
                      value={form.starts_at ?? ''}
                      onChange={(e) => set('starts_at', e.target.value || null)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                      Expira
                    </label>
                    <input
                      type="datetime-local"
                      className={input}
                      value={form.expires_at ?? ''}
                      onChange={(e) => set('expires_at', e.target.value || null)}
                    />
                  </div>
                </div>

                {/* Activo */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">
                      Código activo
                      <span className="block text-xs text-slate-400">
                        Solo los códigos activos aplican en el checkout.
                      </span>
                    </span>
                    <Toggle checked={!!form.active} onChange={(v) => set('active', v)} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
