import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, XCircle, Clock, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import getOrder, { type Order, type OrderStatus } from '@/actions/getOrder';
import { CoinConfetti } from '@/components/CoinConfetti';
import logo from '@/images/devschile2026.png';

interface OrderConfirmationProps {
  urlStatus: 'success' | 'failure' | 'pending';
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    icon: React.ReactNode;
    title: string;
    message: string;
    color: string;
    bg: string;
  }
> = {
  approved: {
    icon: <CheckCircle2 className="h-16 w-16 text-emerald-500" />,
    title: '¡Pago aprobado!',
    message: 'Hemos recibido tu pago. Nos contactaremos pronto para coordinar el envío.',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  rejected: {
    icon: <XCircle className="h-16 w-16 text-red-500" />,
    title: 'Pago no completado',
    message: 'El pago no pudo procesarse. Puedes intentarlo nuevamente con otro método de pago.',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
  },
  pending: {
    icon: <Clock className="h-16 w-16 text-amber-500" />,
    title: 'Pago pendiente',
    message: 'Tu pago está siendo procesado. Recibirás confirmación en cuanto se complete.',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
  pending_transfer: {
    icon: <Clock className="h-16 w-16 text-amber-500" />,
    title: 'Transferencia en proceso',
    message: 'Tu transferencia puede tardar hasta 24 horas en acreditarse. Te avisaremos.',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
  cancelled: {
    icon: <XCircle className="h-16 w-16 text-gray-400" />,
    title: 'Orden cancelada',
    message: 'Esta orden fue cancelada. Puedes hacer una nueva compra cuando quieras.',
    color: 'text-gray-600',
    bg: 'bg-gray-50 border-gray-200',
  },
  refunded: {
    icon: <CheckCircle2 className="h-16 w-16 text-blue-500" />,
    title: 'Devolución procesada',
    message: 'El reembolso fue procesado. Puede tardar algunos días en reflejarse.',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
};

// Mapeo del parámetro de URL al status esperado mientras llega el webhook
const URL_STATUS_MAP: Record<string, OrderStatus> = {
  success: 'approved',
  failure: 'rejected',
  pending: 'pending_transfer',
};

export function OrderConfirmation({ urlStatus }: OrderConfirmationProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id');

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    load();
    // Reintentar una vez después de 3s por si el webhook aún no llegó
    const retry = setTimeout(load, 3000);
    return () => clearTimeout(retry);
  }, [orderId]);

  // Determinar status a mostrar: orden real si cargó, si no el de la URL
  const displayStatus: OrderStatus = order?.status ?? URL_STATUS_MAP[urlStatus] ?? 'pending';
  const config = STATUS_CONFIG[displayStatus];

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      {/* Confetti de monedas — solo en página de éxito */}
      {urlStatus === 'success' && <CoinConfetti />}
      {/* Header mínimo */}
      <header className="border-b border-brand-secondary/10 py-4 px-6">
        <a href="/" className="flex items-center gap-2 w-fit">
          <img src={logo} alt="devsChile" className="h-8 w-8 object-contain" />
          <span className="font-mono font-bold text-brand-secondary">Tienda devsChile</span>
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-brand-secondary/10 overflow-hidden"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
        >
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 flex flex-col items-center gap-4"
            >
              <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
              <p className="text-devs-muted font-medium">Verificando tu pago...</p>
            </motion.div>
          ) : error || !orderId ? (
            <div className="p-10 flex flex-col items-center gap-4 text-center">
              <ShoppingBag className="h-12 w-12 text-devs-muted" />
              <p className="font-mono font-bold text-devs-text">No encontramos tu orden</p>
              <p className="text-sm text-devs-muted">El enlace puede haber expirado.</p>
              <Button
                asChild
                className="bg-brand-primary hover:bg-brand-secondary text-white rounded-xl"
              >
                <a href="/">Volver a la tienda</a>
              </Button>
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div className={`p-6 text-center border-b ${config.bg}`}>
                <div className="flex justify-center mb-3">{config.icon}</div>
                <h1 className={`font-mono text-2xl font-bold ${config.color}`}>{config.title}</h1>
                <p className="text-sm text-devs-muted mt-2">{config.message}</p>
              </div>

              {/* Order details */}
              {order && (
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs text-devs-muted mb-1">N° de orden</p>
                    <p className="font-mono text-xs text-devs-text break-all">{order.id}</p>
                  </div>

                  {order.customer.name && (
                    <div>
                      <p className="text-xs text-devs-muted mb-1">Comprador</p>
                      <p className="font-medium text-devs-text">{order.customer.name}</p>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <p className="text-xs text-devs-muted mb-2">Productos</p>
                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-devs-text">
                            {item.product_name}{' '}
                            <span className="text-devs-muted">×{item.quantity}</span>
                          </span>
                          <span className="font-medium text-devs-text">
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-3 border-t border-brand-secondary/10">
                    <span className="font-medium text-devs-text">Total</span>
                    <span className="font-mono text-xl font-bold text-brand-primary">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>
                </div>
              )}

              <div className="px-6 pb-6">
                <Button
                  asChild
                  className="w-full bg-brand-primary hover:bg-brand-secondary text-white rounded-xl h-11"
                >
                  <a href="/">Volver a la tienda</a>
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
