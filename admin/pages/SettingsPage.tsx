import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  Power,
  Truck,
  Plug,
  Loader2,
  Check,
  CreditCard,
  Mail,
  Database,
  AlertCircle,
  Save,
} from 'lucide-react';
import { adminFetch } from '../utils/adminFetch';
import { useAdminTitle } from '../hooks/useAdminTitle';
import { Toggle } from '../components/ui/Toggle';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Settings {
  [key: string]: string;
}

interface Integrations {
  mercadopago: { configured: boolean; mode: string };
  email: { provider: string; configured: boolean };
  database: { configured: boolean };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const bool = (v: string | undefined) => v === 'true';
const input =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors text-slate-800 bg-white';

// ── Card de sección ───────────────────────────────────────────────────────────
function SectionCard({
  icon: Icon,
  title,
  children,
  dirty,
  saving,
  saved,
  onSave,
  error,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  error?: string | null;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 22 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Icon className="h-4 w-4 text-slate-600" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        </div>

        {/* Punto de cambios sin guardar */}
        <AnimatePresence>
          {dirty && !saving && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.6 }}
              className="flex items-center gap-1.5 text-xs text-amber-600 font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Sin guardar
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-4">{children}</div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-5 mb-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer — aparece solo con cambios */}
      <AnimatePresence>
        {(dirty || saving || saved) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
              <motion.button
                onClick={onSave}
                disabled={saving || saved}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-default ${
                  saved
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                whileHover={!saving && !saved ? { scale: 1.03 } : {}}
                whileTap={!saving && !saved ? { scale: 0.96 } : {}}
              >
                <AnimatePresence mode="wait">
                  {saving ? (
                    <motion.span
                      key="s"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </motion.span>
                  ) : saved ? (
                    <motion.span
                      key="ok"
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', bounce: 0.6 }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="save"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
                {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Campo de formulario ───────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ── Fila de toggle ────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-0.5">
      <div>
        <p className="text-sm text-slate-700 font-medium">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ── Badge de integración ──────────────────────────────────────────────────────
function IntegrationRow({
  icon: Icon,
  label,
  status,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  status: 'ok' | 'warn' | 'error';
  detail: string;
}) {
  const dot = { ok: 'bg-green-400', warn: 'bg-amber-400', error: 'bg-red-400' }[status];
  const text = { ok: 'text-green-700', warn: 'text-amber-700', error: 'text-red-600' }[status];
  const bg = { ok: 'bg-green-50', warn: 'bg-amber-50', error: 'bg-red-50' }[status];

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
      className="flex items-center gap-3 py-2.5"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
      </div>
      <span
        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${bg} ${text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {detail}
      </span>
    </motion.div>
  );
}

// ── SettingsPage ──────────────────────────────────────────────────────────────
export function SettingsPage() {
  useAdminTitle('Configuración');

  const [integrations, setIntegrations] = useState<Integrations | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);

  // Estado local por sección
  const [general, setGeneral] = useState<Settings>({});
  const [generalOrig, setGeneralOrig] = useState<Settings>({});
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalSaved, setGeneralSaved] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [storeStatus, setStoreStatus] = useState<Settings>({});
  const [storeStatusOrig, setStoreStatusOrig] = useState<Settings>({});
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<Settings>({});
  const [shippingOrig, setShippingOrig] = useState<Settings>({});
  const [shippingSaving, setShippingSaving] = useState(false);
  const [shippingSaved, setShippingSaved] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const GENERAL_KEYS = ['store_name', 'store_tagline', 'contact_email'];
  const STATUS_KEYS = ['store_open', 'maintenance_message'];
  const SHIPPING_KEYS = ['shipping_enabled', 'shipping_cost', 'free_shipping_threshold'];

  const load = useCallback(async () => {
    setLoadingInit(true);
    try {
      const res = await adminFetch<{ data: Settings }>('settings?integrations=1');
      const d = res.data;

      const _int = d._integrations ? (JSON.parse(d._integrations) as Integrations) : null;
      setIntegrations(_int);

      const clean = Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith('_')));

      const g = Object.fromEntries(GENERAL_KEYS.map((k) => [k, clean[k] ?? '']));
      const s = Object.fromEntries(STATUS_KEYS.map((k) => [k, clean[k] ?? '']));
      const sh = Object.fromEntries(SHIPPING_KEYS.map((k) => [k, clean[k] ?? '']));

      setGeneral(g);
      setGeneralOrig(g);
      setStoreStatus(s);
      setStoreStatusOrig(s);
      setShipping(sh);
      setShippingOrig(sh);
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setLoadingInit(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const isDirty = (vals: Settings, orig: Settings) =>
    Object.keys(vals).some((k) => vals[k] !== orig[k]);

  const saveSection = async (
    vals: Settings,
    setOrig: (v: Settings) => void,
    setSaving: (v: boolean) => void,
    setSaved: (v: boolean) => void,
    setError: (v: string | null) => void,
  ) => {
    setSaving(true);
    setError(null);
    try {
      await adminFetch('settings', { method: 'PUT', body: JSON.stringify(vals) });
      setOrig({ ...vals });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loadingInit) {
    return (
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.45, delay: i * 0.08 }}
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="h-2.5 w-20 bg-slate-200 rounded animate-pulse" />
                <div className="h-9 w-full bg-slate-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
      >
        <h1 className="text-xl font-semibold text-slate-800">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ajustes globales de la tienda</p>
      </motion.div>

      {/* Cards con stagger */}
      <motion.div
        className="space-y-5"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* ── General ─────────────────────────────────────────────────── */}
        <SectionCard
          icon={Store}
          title="General"
          dirty={isDirty(general, generalOrig)}
          saving={generalSaving}
          saved={generalSaved}
          error={generalError}
          onSave={() =>
            saveSection(general, setGeneralOrig, setGeneralSaving, setGeneralSaved, setGeneralError)
          }
        >
          <Field label="Nombre de la tienda">
            <input
              className={input}
              value={general.store_name ?? ''}
              onChange={(e) => setGeneral((p) => ({ ...p, store_name: e.target.value }))}
              placeholder="Tienda devsChile™"
            />
          </Field>
          <Field label="Tagline" hint="Aparece debajo del nombre en la cabecera">
            <input
              className={input}
              value={general.store_tagline ?? ''}
              onChange={(e) => setGeneral((p) => ({ ...p, store_tagline: e.target.value }))}
              placeholder="Productos exclusivos de la comunidad"
            />
          </Field>
          <Field label="Email de contacto" hint="Para consultas de clientes y notificaciones">
            <input
              type="email"
              className={input}
              value={general.contact_email ?? ''}
              onChange={(e) => setGeneral((p) => ({ ...p, contact_email: e.target.value }))}
              placeholder="huemul@devschile.cl"
            />
          </Field>
        </SectionCard>

        {/* ── Estado de la tienda ──────────────────────────────────────── */}
        <SectionCard
          icon={Power}
          title="Estado de la tienda"
          dirty={isDirty(storeStatus, storeStatusOrig)}
          saving={statusSaving}
          saved={statusSaved}
          error={statusError}
          onSave={() =>
            saveSection(
              storeStatus,
              setStoreStatusOrig,
              setStatusSaving,
              setStatusSaved,
              setStatusError,
            )
          }
        >
          <ToggleRow
            label="Tienda abierta"
            description="Si está desactivado, los visitantes ven la página de mantenimiento"
            checked={bool(storeStatus.store_open)}
            onChange={(v) => setStoreStatus((p) => ({ ...p, store_open: String(v) }))}
          />
          <AnimatePresence>
            {!bool(storeStatus.store_open) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                className="overflow-hidden"
              >
                <Field label="Mensaje de mantenimiento">
                  <textarea
                    rows={3}
                    className={`${input} resize-none`}
                    value={storeStatus.maintenance_message ?? ''}
                    onChange={(e) =>
                      setStoreStatus((p) => ({ ...p, maintenance_message: e.target.value }))
                    }
                    placeholder="Estamos preparando algo increíble. ¡Vuelve pronto!"
                  />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
        </SectionCard>

        {/* ── Envío ───────────────────────────────────────────────────── */}
        <SectionCard
          icon={Truck}
          title="Envío"
          dirty={isDirty(shipping, shippingOrig)}
          saving={shippingSaving}
          saved={shippingSaved}
          error={shippingError}
          onSave={() =>
            saveSection(
              shipping,
              setShippingOrig,
              setShippingSaving,
              setShippingSaved,
              setShippingError,
            )
          }
        >
          <ToggleRow
            label="Envío a domicilio"
            description="Muestra el formulario de dirección en el checkout"
            checked={bool(shipping.shipping_enabled)}
            onChange={(v) => setShipping((p) => ({ ...p, shipping_enabled: String(v) }))}
          />
          <AnimatePresence>
            {bool(shipping.shipping_enabled) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Field label="Costo de envío (CLP)">
                    <input
                      type="number"
                      min="0"
                      className={input}
                      value={shipping.shipping_cost ?? ''}
                      onChange={(e) =>
                        setShipping((p) => ({ ...p, shipping_cost: e.target.value }))
                      }
                      placeholder="3000"
                    />
                  </Field>
                  <Field label="Envío gratis desde (CLP)" hint="0 = siempre cobrar">
                    <input
                      type="number"
                      min="0"
                      className={input}
                      value={shipping.free_shipping_threshold ?? ''}
                      onChange={(e) =>
                        setShipping((p) => ({ ...p, free_shipping_threshold: e.target.value }))
                      }
                      placeholder="30000"
                    />
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SectionCard>

        {/* ── Integraciones (read-only) ────────────────────────────────── */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Plug className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Integraciones</h2>
              <p className="text-xs text-slate-400">Configuradas mediante variables de entorno</p>
            </div>
          </div>

          <motion.div
            className="px-5 py-3 divide-y divide-slate-100"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
          >
            <IntegrationRow
              icon={CreditCard}
              label="MercadoPago"
              status={integrations?.mercadopago.configured ? 'ok' : 'error'}
              detail={
                !integrations?.mercadopago.configured
                  ? 'Sin configurar'
                  : integrations.mercadopago.mode === 'production'
                    ? 'Producción'
                    : 'Sandbox'
              }
            />
            <IntegrationRow
              icon={Mail}
              label="Email"
              status={integrations?.email.configured ? 'ok' : 'warn'}
              detail={
                !integrations?.email.configured
                  ? 'Sin configurar'
                  : integrations.email.provider === 'mailgun'
                    ? 'Mailgun'
                    : 'Resend'
              }
            />
            <IntegrationRow
              icon={Database}
              label="Base de datos"
              status={integrations?.database.configured ? 'ok' : 'error'}
              detail={integrations?.database.configured ? 'NeonDB conectada' : 'Sin configurar'}
            />
          </motion.div>

          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Para cambiar las claves de API edita las variables de entorno en{' '}
              <a
                href="https://app.netlify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-600 transition-colors"
              >
                Netlify → Site configuration → Environment variables
              </a>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
