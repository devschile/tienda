import { X, Loader2, MapPin, Mail, Package, Save } from 'lucide-react';
import { useAdminOne, useAdminMutation } from '../../hooks/useAdminData';
import { useState, useEffect } from 'react';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  original_unit_price: number | null;
  subtotal: number;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_region: string | null;
  shipping_zip: string | null;
  mp_payment_id: string | null;
  wants_newsletter: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

interface Props {
  orderId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

const formatDate = (s: string) =>
  new Date(s).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short', hour12: false });

export const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  pending_transfer: {
    label: 'Transferencia',
    color: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  refunded: { label: 'Reembolsado', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-400', dot: 'bg-slate-300' },
};

const NEXT_STATUSES: Record<string, string[]> = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['refunded', 'cancelled'],
  pending_transfer: ['approved', 'rejected', 'cancelled'],
  rejected: [],
  refunded: [],
  cancelled: [],
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function OrderDetailPanel({ orderId, onClose, onSaved }: Props) {
  const { data: order, loading } = useAdminOne<Order>('orders', orderId);
  const { update, loading: saving } = useAdminMutation<Order>('orders');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Sincronizar textarea cuando carga la orden
  useEffect(() => {
    if (order) setNotes(order.notes ?? '');
  }, [order?.id]);

  const saveNotes = async () => {
    if (!orderId) return;
    await update(orderId, { notes: notes || null });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!orderId) return;
    setConfirm(null);
    await update(orderId, { status: newStatus });
    onSaved();
  };

  const nextStatuses = order ? (NEXT_STATUSES[order.status] ?? []) : [];

  if (!orderId) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="font-semibold text-slate-800">Detalle de orden</h2>
            {order && (
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{order.id.substring(0, 8)}…</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : !order ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Orden no encontrada
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Estado + cambio */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={order.status} />
                <span className="text-xs text-slate-400">{formatDate(order.created_at)}</span>
              </div>
              {nextStatuses.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Cambiar estado:</p>
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses.map((s) => {
                      const cfg = STATUS_CONFIG[s];
                      return confirm === s ? (
                        <div key={s} className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-600">¿Confirmar?</span>
                          <button
                            onClick={() => handleStatusChange(s)}
                            disabled={saving}
                            className="px-2.5 py-1 text-xs font-medium bg-slate-800 text-white rounded-lg disabled:opacity-50"
                          >
                            {saving ? '…' : 'Sí'}
                          </button>
                          <button
                            onClick={() => setConfirm(null)}
                            className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          key={s}
                          onClick={() => setConfirm(s)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold hover:opacity-75 transition-opacity ${cfg?.color}`}
                        >
                          → {cfg?.label ?? s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Cliente */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Cliente
                </h3>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {order.customer_name}
                    </span>
                    {order.wants_newsletter && (
                      <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-semibold">
                        newsletter ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {order.customer_email}
                  </div>
                  {order.shipping_address && (
                    <div className="flex items-start gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        {[
                          order.shipping_address,
                          order.shipping_city,
                          order.shipping_region,
                          order.shipping_zip,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Productos */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Productos ({order.items?.length ?? 0})
                </h3>
                <div className="space-y-2">
                  {(order.items ?? []).map((item, i) => {
                    const hasDiscount =
                      item.original_unit_price && item.original_unit_price > item.unit_price;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Package className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 line-clamp-1">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-slate-400">×{item.quantity}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-slate-700">
                            {formatCLP(item.subtotal)}
                          </p>
                          {hasDiscount && (
                            <p className="text-xs text-slate-400 line-through">
                              {formatCLP(
                                (item.original_unit_price ?? item.unit_price) * item.quantity,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Total */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-slate-700">Total</span>
                <span className="text-xl font-bold text-slate-800">
                  {formatCLP(order.total_amount)}
                </span>
              </div>

              {order.mp_payment_id && (
                <p className="text-xs text-slate-400 font-mono">MP: {order.mp_payment_id}</p>
              )}

              {/* Notas internas */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Notas internas
                  </h3>
                  <button
                    onClick={saveNotes}
                    disabled={saving}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 "
                  >
                    {notesSaved ? (
                      <span className="text-green-600 font-semibold">✓ Guardado</span>
                    ) : (
                      <>
                        <Save className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-500">Guardar</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Agrega notas sobre este pedido (solo visible en el admin)…"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 resize-none transition-colors text-slate-700 placeholder-slate-400"
                />
              </section>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
